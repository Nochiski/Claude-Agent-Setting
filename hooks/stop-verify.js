#!/usr/bin/env node
/**
 * Stop Verification Hook
 * 세션 종료 시 작업 검증 수행
 *
 * 검증 항목:
 * - 미완료 TODO 체크
 * - 테스트 실행 (설정된 경우)
 * - 빌드 검증 (설정된 경우)
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// 검증 설정 (환경변수로 커스터마이징 가능)
const CONFIG = {
  checkTodos: process.env.VERIFY_TODOS !== 'false',
  runTests: process.env.VERIFY_TESTS === 'true',
  runBuild: process.env.VERIFY_BUILD === 'true',
  testCommand: process.env.TEST_COMMAND || 'npm test',
  buildCommand: process.env.BUILD_COMMAND || 'npm run build'
};

function checkUnfinishedTodos(data) {
  // 대화 내용에서 미완료 TODO 패턴 찾기
  const content = JSON.stringify(data);
  const todoPatterns = [
    /\[ \]/g,           // 미체크 체크박스
    /TODO:/gi,          // TODO 코멘트
    /FIXME:/gi,         // FIXME 코멘트
    /in_progress/g      // 진행 중인 작업
  ];

  let issues = [];
  for (const pattern of todoPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push(`${pattern.source}: ${matches.length}개 발견`);
    }
  }

  return issues;
}

function runCommand(command) {
  try {
    execSync(command, { stdio: 'pipe', timeout: 60000 });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
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
    let warnings = [];

    // 1. 미완료 TODO 체크
    if (CONFIG.checkTodos) {
      const todoIssues = checkUnfinishedTodos(data);
      if (todoIssues.length > 0) {
        warnings.push('미완료 작업 발견:');
        warnings = warnings.concat(todoIssues.map(i => `  - ${i}`));
      }
    }

    // 2. 테스트 실행
    if (CONFIG.runTests) {
      const testResult = runCommand(CONFIG.testCommand);
      if (!testResult.success) {
        warnings.push(`테스트 실패: ${CONFIG.testCommand}`);
      }
    }

    // 3. 빌드 검증
    if (CONFIG.runBuild) {
      const buildResult = runCommand(CONFIG.buildCommand);
      if (!buildResult.success) {
        warnings.push(`빌드 실패: ${CONFIG.buildCommand}`);
      }
    }

    // 경고 출력
    if (warnings.length > 0) {
      console.error('\n=== 세션 종료 전 검증 결과 ===');
      warnings.forEach(w => console.error(w));
      console.error('================================\n');
    }

    // 데이터 그대로 반환 (차단하지 않음)
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
