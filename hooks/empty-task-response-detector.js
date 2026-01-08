#!/usr/bin/env node
/**
 * Empty Task Response Detector Hook
 * PostToolUse 이벤트에서 Task(서브에이전트) 빈 응답 감지
 *
 * 기능:
 * - Task 도구의 빈 응답 감지
 * - 경고 메시지 및 재시도 힌트 제공
 */

const readline = require('readline');

// 빈 응답으로 간주하는 패턴
const EMPTY_PATTERNS = [
  /^\s*$/,                           // 공백만
  /^(undefined|null)$/i,             // undefined/null
  /^no\s+(result|output|response)/i, // "no result" 등
  /^error:/i,                        // 에러로 시작
  /^failed/i                         // 실패로 시작
];

function isEmptyResponse(result) {
  if (!result) return true;
  const str = typeof result === 'string' ? result : JSON.stringify(result);
  if (str.length < 10) return true;
  return EMPTY_PATTERNS.some(pattern => pattern.test(str.trim()));
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

    // Task 도구인 경우에만 검사
    if (data.tool_name === 'Task') {
      const result = data.tool_result;
      const subagentType = data.tool_input?.subagent_type || 'unknown';

      if (isEmptyResponse(result)) {
        console.error(`\n⚠️  [EMPTY TASK RESPONSE] 서브에이전트 '${subagentType}'가 빈 응답을 반환했습니다.`);
        console.error('   가능한 원인:');
        console.error('   - 프롬프트가 불명확함');
        console.error('   - 서브에이전트가 작업을 완료하지 못함');
        console.error('   - 타임아웃 또는 에러 발생');
        console.error('   권장 조치: 더 구체적인 프롬프트로 재시도하세요.\n');

        // tool_result에 경고 추가
        data.tool_result = (data.tool_result || '') +
          '\n\n<system-warning>서브에이전트가 빈 응답을 반환했습니다. 더 구체적인 프롬프트로 재시도를 고려하세요.</system-warning>';
      }
    }

    // 데이터 반환
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
