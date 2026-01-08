#!/usr/bin/env node
/**
 * Edit Error Recovery Hook
 * PostToolUse 이벤트에서 Edit 도구 에러 감지 및 복구 힌트 제공
 *
 * 기능:
 * - "old_string not found" 에러 감지
 * - 유사 문자열 힌트 제공
 * - 공백/줄바꿈 문제 감지
 */

const readline = require('readline');
const fs = require('fs');

// 에러 패턴
const ERROR_PATTERNS = {
  notFound: /old_string.*not found|could not find|no match/i,
  notUnique: /not unique|multiple matches|ambiguous/i,
  fileNotExist: /file.*not exist|no such file/i
};

function analyzeEditError(data) {
  const result = data.tool_result || '';
  const oldString = data.tool_input?.old_string || '';
  const filePath = data.tool_input?.file_path || '';

  const issues = [];
  const hints = [];

  // old_string not found 에러
  if (ERROR_PATTERNS.notFound.test(result)) {
    issues.push('old_string을 파일에서 찾을 수 없음');

    // 파일이 존재하는지 확인
    if (filePath && fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');

        // 공백 문제 검사
        if (oldString.includes('  ') || oldString.includes('\t')) {
          hints.push('old_string에 연속 공백 또는 탭이 포함되어 있습니다. 실제 파일의 들여쓰기를 확인하세요.');
        }

        // 줄바꿈 문제 검사
        if (oldString.includes('\r\n') && !content.includes('\r\n')) {
          hints.push('줄바꿈 형식 불일치: old_string은 CRLF(\\r\\n)지만 파일은 LF(\\n)입니다.');
        } else if (oldString.includes('\n') && !oldString.includes('\r\n') && content.includes('\r\n')) {
          hints.push('줄바꿈 형식 불일치: old_string은 LF(\\n)지만 파일은 CRLF(\\r\\n)입니다.');
        }

        // 유사 문자열 검색 (첫 줄 기준)
        const firstLine = oldString.split(/[\r\n]/)[0].trim();
        if (firstLine.length > 10) {
          const lines = content.split(/\r?\n/);
          const similar = lines.find(line =>
            line.includes(firstLine.substring(0, 20)) ||
            firstLine.includes(line.trim().substring(0, 20))
          );
          if (similar) {
            hints.push(`유사한 줄 발견: "${similar.trim().substring(0, 50)}..."`);
          }
        }

        // 대소문자 문제
        if (content.toLowerCase().includes(oldString.toLowerCase()) &&
            !content.includes(oldString)) {
          hints.push('대소문자가 일치하지 않습니다. 정확한 대소문자를 사용하세요.');
        }

      } catch (e) {
        // 파일 읽기 실패 무시
      }
    }

    if (hints.length === 0) {
      hints.push('파일을 다시 읽고 정확한 문자열을 복사하세요.');
      hints.push('들여쓰기와 공백이 정확히 일치하는지 확인하세요.');
    }
  }

  // not unique 에러
  if (ERROR_PATTERNS.notUnique.test(result)) {
    issues.push('old_string이 파일에 여러 번 존재함');
    hints.push('더 많은 컨텍스트(주변 줄)를 포함하여 고유하게 만드세요.');
    hints.push('또는 replace_all: true 옵션을 사용하세요.');
  }

  // 파일 없음 에러
  if (ERROR_PATTERNS.fileNotExist.test(result)) {
    issues.push('파일이 존재하지 않음');
    hints.push('파일 경로가 정확한지 확인하세요.');
    hints.push('Glob 도구로 파일 위치를 먼저 확인하세요.');
  }

  return { issues, hints };
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

    // Edit 도구이고 에러가 발생한 경우
    if (data.tool_name === 'Edit') {
      const result = data.tool_result || '';
      const hasError = Object.values(ERROR_PATTERNS).some(p => p.test(result));

      if (hasError) {
        const { issues, hints } = analyzeEditError(data);

        if (issues.length > 0 || hints.length > 0) {
          console.error('\n🔧 [EDIT ERROR RECOVERY]');

          if (issues.length > 0) {
            console.error('   문제:');
            issues.forEach(i => console.error(`   - ${i}`));
          }

          if (hints.length > 0) {
            console.error('   힌트:');
            hints.forEach(h => console.error(`   - ${h}`));
          }

          console.error('');

          // tool_result에 힌트 추가
          data.tool_result = result +
            '\n\n<edit-recovery-hint>\n' +
            hints.map(h => `- ${h}`).join('\n') +
            '\n</edit-recovery-hint>';
        }
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
