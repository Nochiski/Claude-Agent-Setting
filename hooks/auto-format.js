#!/usr/bin/env node
/**
 * Auto Format Hook
 * Edit/Write 도구 사용 후 자동으로 코드 포매터 실행
 *
 * 지원 포매터:
 * - JavaScript/TypeScript: prettier, eslint --fix
 * - Python: black, ruff
 * - Go: gofmt
 * - Rust: rustfmt
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// 확장자별 포매터 설정
const FORMATTERS = {
  '.js': ['prettier --write', 'eslint --fix'],
  '.jsx': ['prettier --write', 'eslint --fix'],
  '.ts': ['prettier --write', 'eslint --fix'],
  '.tsx': ['prettier --write', 'eslint --fix'],
  '.json': ['prettier --write'],
  '.css': ['prettier --write'],
  '.scss': ['prettier --write'],
  '.md': ['prettier --write'],
  '.py': ['black', 'ruff format'],
  '.go': ['gofmt -w'],
  '.rs': ['rustfmt'],
};

function getFormatters(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return FORMATTERS[ext] || [];
}

function commandExists(cmd) {
  try {
    execSync(`where ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync(`which ${cmd}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

function runFormatter(formatter, filePath) {
  const cmd = formatter.split(' ')[0];

  if (!commandExists(cmd)) {
    return false;
  }

  try {
    execSync(`${formatter} "${filePath}"`, {
      stdio: 'ignore',
      timeout: 10000
    });
    return true;
  } catch (e) {
    return false;
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

    // Edit 또는 Write 도구인 경우에만 처리
    if (data.tool_name === 'Edit' || data.tool_name === 'Write') {
      const filePath = data.tool_input?.file_path;

      if (filePath && fs.existsSync(filePath)) {
        const formatters = getFormatters(filePath);

        for (const formatter of formatters) {
          if (runFormatter(formatter, filePath)) {
            // 첫 번째 성공한 포매터로 충분
            console.error(`Formatted: ${path.basename(filePath)}`);
            break;
          }
        }
      }
    }

    // 데이터 그대로 반환
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
