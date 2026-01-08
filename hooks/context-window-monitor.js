#!/usr/bin/env node
/**
 * Context Window Monitor Hook
 * PostToolUse 이벤트에서 컨텍스트 윈도우 사용량 모니터링
 *
 * 기능:
 * - 도구 결과 크기 추적
 * - 누적 토큰 추정 및 경고
 * - 임계치 도달 시 경고 메시지
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
  // 경고 임계치 (추정 토큰 수)
  warnThreshold: parseInt(process.env.CONTEXT_WARN_THRESHOLD) || 150000,
  // 위험 임계치
  dangerThreshold: parseInt(process.env.CONTEXT_DANGER_THRESHOLD) || 180000,
  // 상태 파일 경로
  stateFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'context-state.json')
};

// 대략적인 토큰 추정 (영어 기준 4자 = 1토큰, 한글 1자 = 1토큰)
function estimateTokens(text) {
  if (!text) return 0;
  const str = typeof text === 'string' ? text : JSON.stringify(text);
  // 한글 문자 수
  const koreanChars = (str.match(/[\uAC00-\uD7AF]/g) || []).length;
  // 나머지 문자
  const otherChars = str.length - koreanChars;
  return Math.ceil(koreanChars + otherChars / 4);
}

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (e) {
    // 무시
  }
  return { totalTokens: 0, toolCalls: 0, lastReset: Date.now() };
}

function saveState(state) {
  try {
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (e) {
    // 무시
  }
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
    const state = loadState();

    // 5분 이상 경과 시 리셋 (새 세션으로 간주)
    if (Date.now() - state.lastReset > 5 * 60 * 1000) {
      state.totalTokens = 0;
      state.toolCalls = 0;
      state.lastReset = Date.now();
    }

    // 현재 도구 결과의 토큰 추정
    const resultTokens = estimateTokens(data.tool_result);
    const inputTokens = estimateTokens(data.tool_input);

    state.totalTokens += resultTokens + inputTokens;
    state.toolCalls += 1;

    // 경고 레벨 판단
    let warningLevel = 'normal';
    if (state.totalTokens > CONFIG.dangerThreshold) {
      warningLevel = 'danger';
    } else if (state.totalTokens > CONFIG.warnThreshold) {
      warningLevel = 'warn';
    }

    // 경고 메시지 출력
    if (warningLevel === 'danger') {
      console.error(`\n⚠️  [CONTEXT DANGER] 추정 토큰: ${state.totalTokens.toLocaleString()} (임계치: ${CONFIG.dangerThreshold.toLocaleString()})`);
      console.error('   컨텍스트 윈도우가 거의 가득 찼습니다. 새 세션 시작을 권장합니다.\n');
    } else if (warningLevel === 'warn') {
      console.error(`\n⚡ [CONTEXT WARN] 추정 토큰: ${state.totalTokens.toLocaleString()} (임계치: ${CONFIG.warnThreshold.toLocaleString()})`);
      console.error('   컨텍스트 사용량이 높습니다. 불필요한 파일 읽기를 줄이세요.\n');
    }

    saveState(state);

    // 데이터 그대로 반환
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
