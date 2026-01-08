#!/usr/bin/env node
/**
 * Ralph Loop Hook (Ralph Wiggum Style)
 * Stop 이벤트에서 완료 조건을 확인하고, 미완료 시 세션 종료를 차단하여 자동 반복 실행
 *
 * 사용법:
 * 1. 프롬프트에 완료 마커 포함: "<promise>COMPLETE</promise>" 또는 "TASK_COMPLETE"
 * 2. Claude가 완료 마커를 출력할 때까지 자동으로 계속 실행
 *
 * 환경변수:
 * - RALPH_ENABLED=true: Ralph Loop 활성화 (기본: false)
 * - RALPH_MAX_ITERATIONS=20: 최대 반복 횟수 (기본: 20)
 * - RALPH_COMPLETION_MARKER=COMPLETE: 완료 마커 (기본: COMPLETE)
 * - RALPH_PROMPT: 재주입할 프롬프트 (설정 시 매 반복마다 이 프롬프트 사용)
 *
 * 주의:
 * - 비용이 빠르게 증가할 수 있으므로 MAX_ITERATIONS 설정 필수
 * - 명확한 완료 조건이 있는 작업에만 사용
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  enabled: process.env.RALPH_ENABLED === 'true',
  maxIterations: parseInt(process.env.RALPH_MAX_ITERATIONS) || 20,
  completionMarker: process.env.RALPH_COMPLETION_MARKER || 'COMPLETE',
  customPrompt: process.env.RALPH_PROMPT || null,
  stateFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'ralph-state.json')
};

// 완료 패턴들 (텍스트 마커)
const COMPLETION_PATTERNS = [
  /<promise>[\s\S]*?COMPLETE[\s\S]*?<\/promise>/i,
  /TASK_COMPLETE/,
  /\[COMPLETE\]/,
  /작업\s*완료/,
  /모든\s*작업.*완료/
];

// Todo 상태 기반 완료 체크
function checkTodoCompletion(content) {
  // in_progress 또는 pending 상태가 있으면 미완료
  const inProgressCount = (content.match(/"status"\s*:\s*"in_progress"/g) || []).length;
  const pendingCount = (content.match(/"status"\s*:\s*"pending"/g) || []).length;
  const completedCount = (content.match(/"status"\s*:\s*"completed"/g) || []).length;

  // Todo가 하나라도 있고, 모두 completed면 완료
  if (completedCount > 0 && inProgressCount === 0 && pendingCount === 0) {
    return { complete: true, reason: `Todo 전체 완료 (${completedCount}개)` };
  }

  // Todo가 있지만 미완료 항목 존재
  if (completedCount > 0 || inProgressCount > 0 || pendingCount > 0) {
    return {
      complete: false,
      reason: `Todo 미완료 - completed: ${completedCount}, in_progress: ${inProgressCount}, pending: ${pendingCount}`
    };
  }

  // Todo 없음 - 텍스트 마커로 판단
  return { complete: false, reason: 'Todo 없음, 텍스트 마커로 판단' };
}

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      const state = JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
      // 1시간 이상 경과 시 리셋
      if (Date.now() - state.startTime > 60 * 60 * 1000) {
        return { iterations: 0, startTime: Date.now() };
      }
      return state;
    }
  } catch (e) {
    // 무시
  }
  return { iterations: 0, startTime: Date.now() };
}

function saveState(state) {
  try {
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (e) {
    // 무시
  }
}

function resetState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      fs.unlinkSync(CONFIG.stateFile);
    }
  } catch (e) {
    // 무시
  }
}

function checkCompletion(data) {
  const content = JSON.stringify(data);

  // 1. Todo 상태 기반 체크 (우선)
  const todoResult = checkTodoCompletion(content);
  if (todoResult.complete) {
    console.error(`   완료 감지: ${todoResult.reason}`);
    return true;
  }

  // 2. 커스텀 마커 체크
  if (content.includes(CONFIG.completionMarker)) {
    console.error(`   완료 감지: 커스텀 마커 "${CONFIG.completionMarker}"`);
    return true;
  }

  // 3. 기본 완료 패턴 체크
  const patternMatch = COMPLETION_PATTERNS.some(pattern => pattern.test(content));
  if (patternMatch) {
    console.error('   완료 감지: 텍스트 패턴 매칭');
    return true;
  }

  // 미완료 상태 로깅
  if (todoResult.reason !== 'Todo 없음, 텍스트 마커로 판단') {
    console.error(`   ${todoResult.reason}`);
  }

  return false;
}

function readTranscript(transcriptPath) {
  try {
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      return fs.readFileSync(transcriptPath, 'utf8');
    }
  } catch (e) {
    // 무시
  }
  return '';
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  let input = '';
  for await (const line of rl) {
    input += line;
  }

  try {
    const data = JSON.parse(input);

    // Ralph Loop 비활성화 시 패스스루
    if (!CONFIG.enabled) {
      console.log(JSON.stringify(data));
      return;
    }

    // stop_hook_active 확인 (무한 루프 방지)
    if (data.stop_hook_active) {
      console.error('\n⚠️  [RALPH LOOP] stop_hook_active 감지 - 무한 루프 방지를 위해 종료 허용\n');
      resetState();
      console.log(JSON.stringify(data));
      process.exit(0);
      return;
    }

    const state = loadState();

    // Transcript에서도 완료 확인
    const transcript = readTranscript(data.transcript_path);
    const isComplete = checkCompletion(data) ||
                       (transcript && checkCompletion({ transcript }));

    if (isComplete) {
      console.error(`\n✅ [RALPH LOOP] 완료 마커 감지! (${state.iterations}회 반복 후 완료)`);
      console.error('   세션 정상 종료를 허용합니다.\n');
      resetState();
      console.log(JSON.stringify(data));
      process.exit(0);
      return;
    }

    // 최대 반복 횟수 체크
    if (state.iterations >= CONFIG.maxIterations) {
      console.error(`\n⚠️  [RALPH LOOP] 최대 반복 횟수(${CONFIG.maxIterations}) 도달`);
      console.error('   완료 마커를 찾지 못했지만 종료합니다.');
      console.error('   RALPH_MAX_ITERATIONS 환경변수로 조정 가능합니다.\n');
      resetState();
      console.log(JSON.stringify(data));
      process.exit(0);
      return;
    }

    // 반복 계속
    state.iterations++;
    saveState(state);

    console.error(`\n🔄 [RALPH LOOP] 반복 ${state.iterations}/${CONFIG.maxIterations}`);
    console.error(`   완료 마커 "${CONFIG.completionMarker}"를 찾지 못했습니다.`);
    console.error('   작업을 계속합니다...\n');

    // 종료 차단
    const response = {
      decision: 'block',
      reason: `[Ralph Loop ${state.iterations}/${CONFIG.maxIterations}] 완료 마커를 찾지 못했습니다. 작업을 계속해주세요. 완료 시 "${CONFIG.completionMarker}"를 출력하세요.`
    };

    if (CONFIG.customPrompt) {
      response.reason += `\n\n작업 지시: ${CONFIG.customPrompt}`;
    }

    console.log(JSON.stringify(response));
    process.exit(2); // exit code 2로 종료 차단

  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
