#!/usr/bin/env node
/**
 * Agent Usage Reminder Hook
 * PostToolUse 이벤트에서 에이전트 사용이 권장되는 상황 감지
 *
 * 기능:
 * - 직접 Glob/Grep/Read를 많이 사용할 때 explore 에이전트 권장
 * - 복잡한 작업을 직접 수행할 때 전문 에이전트 권장
 * - "Never Work Alone" 원칙 리마인드
 *
 * 환경변수:
 * - AGENT_REMINDER=false: 리마인더 비활성화
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  enabled: process.env.AGENT_REMINDER !== 'false',
  stateFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'agent-reminder-state.json'),
  // 직접 도구 호출 임계치
  thresholds: {
    search: 5,     // Glob/Grep 호출 수
    read: 8,       // Read 호출 수
    edit: 5        // Edit 호출 수
  }
};

// 에이전트 추천 매핑
const AGENT_SUGGESTIONS = {
  search: {
    agent: 'explore',
    message: '코드베이스 탐색은 explore 에이전트에게 위임하세요.'
  },
  read: {
    agent: 'librarian',
    message: '문서/코드 조사는 librarian 에이전트에게 위임하세요.'
  },
  edit: {
    agent: 'refactorer',
    message: '대규모 코드 수정은 refactorer 에이전트를 고려하세요.'
  }
};

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (e) {
    // 무시
  }
  return {
    counts: { Glob: 0, Grep: 0, Read: 0, Edit: 0 },
    lastReset: Date.now(),
    remindedFor: []
  };
}

function saveState(state) {
  try {
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (e) {
    // 무시
  }
}

function categorizeToolUse(toolName) {
  if (['Glob', 'Grep'].includes(toolName)) return 'search';
  if (toolName === 'Read') return 'read';
  if (['Edit', 'Write'].includes(toolName)) return 'edit';
  return null;
}

async function main() {
  if (!CONFIG.enabled) {
    // 비활성화된 경우 패스스루
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
    let input = '';
    for await (const line of rl) input += line;
    console.log(input);
    return;
  }

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

    // 10분 이상 경과 시 리셋
    if (Date.now() - state.lastReset > 10 * 60 * 1000) {
      state.counts = { Glob: 0, Grep: 0, Read: 0, Edit: 0 };
      state.remindedFor = [];
      state.lastReset = Date.now();
    }

    // Task 도구 사용 시 카운트 리셋 (에이전트 사용 중)
    if (data.tool_name === 'Task') {
      state.counts = { Glob: 0, Grep: 0, Read: 0, Edit: 0 };
      state.remindedFor = [];
      saveState(state);
      console.log(JSON.stringify(data));
      return;
    }

    // 도구 사용 카운트
    if (state.counts.hasOwnProperty(data.tool_name)) {
      state.counts[data.tool_name]++;
    }

    // 카테고리별 체크
    const category = categorizeToolUse(data.tool_name);
    if (category) {
      let totalForCategory = 0;
      if (category === 'search') {
        totalForCategory = state.counts.Glob + state.counts.Grep;
      } else if (category === 'read') {
        totalForCategory = state.counts.Read;
      } else if (category === 'edit') {
        totalForCategory = state.counts.Edit;
      }

      const threshold = CONFIG.thresholds[category];
      const suggestion = AGENT_SUGGESTIONS[category];

      // 임계치 초과 & 아직 리마인드 안 함
      if (totalForCategory >= threshold && !state.remindedFor.includes(category)) {
        console.error(`\n💡 [AGENT REMINDER] "${data.tool_name}" ${totalForCategory}회 사용`);
        console.error(`   ${suggestion.message}`);
        console.error(`   Task(subagent_type="${suggestion.agent}", prompt="...")`);
        console.error('   "Never Work Alone" - 전문가 에이전트가 있으면 위임하세요.\n');

        state.remindedFor.push(category);
      }
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
