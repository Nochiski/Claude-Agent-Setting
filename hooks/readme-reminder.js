#!/usr/bin/env node
/**
 * README Reminder Hook
 * 코드 변경 후 README 업데이트 필요 여부 체크
 *
 * 트리거 조건:
 * - 새 파일 생성
 * - API 엔드포인트 변경
 * - 설정 파일 변경
 * - 주요 기능 추가/변경
 */

const path = require('path');
const readline = require('readline');

// README 업데이트가 필요할 수 있는 파일 패턴
const SIGNIFICANT_PATTERNS = [
  /^src\/api\//,           // API 변경
  /^src\/routes\//,        // 라우트 변경
  /^config\//,             // 설정 변경
  /package\.json$/,        // 의존성 변경
  /\.env\.example$/,       // 환경변수 변경
  /Dockerfile$/,           // Docker 설정
  /docker-compose/,        // Docker Compose
  /\.github\/workflows/,   // CI/CD 변경
  /schema/,                // 스키마 변경
  /migration/,             // DB 마이그레이션
];

// 새 기능 추가 감지 키워드
const NEW_FEATURE_KEYWORDS = [
  'new feature',
  'add endpoint',
  'create api',
  'implement',
  '새 기능',
  '추가',
  '구현',
];

function shouldRemind(filePath, toolInput) {
  // 패턴 매칭
  const relativePath = filePath.replace(/\\/g, '/');
  for (const pattern of SIGNIFICANT_PATTERNS) {
    if (pattern.test(relativePath)) {
      return true;
    }
  }

  // 새 파일 생성 감지 (Write 도구)
  if (toolInput && !toolInput.old_string && toolInput.content) {
    return true;
  }

  return false;
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

    // Edit 또는 Write 도구인 경우에만 처리
    if (data.tool_name === 'Edit' || data.tool_name === 'Write') {
      const filePath = data.tool_input?.file_path || '';

      // README 자체 수정은 무시
      if (filePath.toLowerCase().includes('readme')) {
        console.log(JSON.stringify(data));
        return;
      }

      if (shouldRemind(filePath, data.tool_input)) {
        // 결과에 리마인더 추가
        if (data.tool_result) {
          data.tool_result += '\n\n<readme-reminder>이 변경사항을 README.md에 반영해야 할 수 있습니다. 새 기능, API 변경, 설정 변경이 있다면 README를 업데이트하세요.</readme-reminder>';
        }
      }
    }

    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
