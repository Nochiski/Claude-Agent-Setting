#!/usr/bin/env node
/**
 * Comment Checker Hook
 * Edit 도구 사용 후 과도한 주석이 추가되지 않았는지 검사
 */

const readline = require('readline');

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

    // Edit 도구의 new_string에서 주석 비율 체크
    if (data.tool_input && data.tool_input.new_string) {
      const content = data.tool_input.new_string;
      const lines = content.split('\n');
      const commentLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('//') ||
               trimmed.startsWith('#') ||
               trimmed.startsWith('*') ||
               trimmed.startsWith('/*');
      });

      const commentRatio = commentLines.length / lines.length;

      if (commentRatio > 0.5 && lines.length > 5) {
        console.error(`Warning: High comment ratio (${(commentRatio * 100).toFixed(1)}%)`);
      }
    }

    // 데이터 그대로 반환 (차단하지 않음)
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
