#!/usr/bin/env node
/**
 * Pre-Commit Test Hook
 * git commit 실행 전 테스트 코드 탐색 및 실행
 *
 * 동작:
 * 1. git commit 명령 감지
 * 2. 테스트 파일 존재 여부 확인
 * 3. 테스트 실행
 * 4. 실패 시 커밋 차단
 */

const { execSync, spawnSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// 테스트 프레임워크별 설정
const TEST_CONFIGS = [
  // JavaScript/TypeScript
  { files: ['package.json'], testCmd: 'npm test', checkScript: true },
  { files: ['jest.config.js', 'jest.config.ts'], testCmd: 'npx jest' },
  { files: ['vitest.config.js', 'vitest.config.ts'], testCmd: 'npx vitest run' },

  // Python
  { files: ['pytest.ini', 'pyproject.toml', 'setup.py'], testCmd: 'pytest', testDirs: ['tests', 'test'] },
  { files: ['tox.ini'], testCmd: 'tox' },

  // Go
  { files: ['go.mod'], testCmd: 'go test ./...', testPattern: '*_test.go' },

  // Rust
  { files: ['Cargo.toml'], testCmd: 'cargo test' },

  // Java/Kotlin
  { files: ['pom.xml'], testCmd: 'mvn test' },
  { files: ['build.gradle', 'build.gradle.kts'], testCmd: 'gradle test' },

  // Ruby
  { files: ['Gemfile'], testCmd: 'bundle exec rspec', testDirs: ['spec'] },

  // PHP
  { files: ['phpunit.xml', 'phpunit.xml.dist'], testCmd: 'vendor/bin/phpunit' },
];

// 일반적인 테스트 디렉토리/파일 패턴
const TEST_PATTERNS = [
  'test', 'tests', 'spec', 'specs', '__tests__',
  '*.test.js', '*.spec.js', '*.test.ts', '*.spec.ts',
  '*_test.go', '*_test.py', 'test_*.py'
];

function getCwd() {
  try {
    return process.cwd();
  } catch {
    return process.env.PWD || process.env.CD || '.';
  }
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function findTestConfig(cwd) {
  for (const config of TEST_CONFIGS) {
    for (const file of config.files) {
      const fullPath = path.join(cwd, file);
      if (fileExists(fullPath)) {
        // package.json의 경우 test 스크립트가 있는지 확인
        if (config.checkScript && file === 'package.json') {
          try {
            const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            if (pkg.scripts && pkg.scripts.test &&
                !pkg.scripts.test.includes('no test specified')) {
              return config;
            }
          } catch {
            continue;
          }
        } else {
          return config;
        }
      }
    }
  }
  return null;
}

function hasTestFiles(cwd) {
  // 테스트 디렉토리 확인
  const testDirs = ['test', 'tests', 'spec', 'specs', '__tests__', 'src/__tests__'];
  for (const dir of testDirs) {
    if (fileExists(path.join(cwd, dir))) {
      return true;
    }
  }

  // 테스트 파일 패턴 확인 (간단한 검사)
  try {
    const result = spawnSync('find', ['.', '-name', '*.test.*', '-o', '-name', '*.spec.*', '-o', '-name', 'test_*'], {
      cwd,
      encoding: 'utf8',
      timeout: 5000
    });
    if (result.stdout && result.stdout.trim().length > 0) {
      return true;
    }
  } catch {
    // find 명령 실패 시 무시
  }

  // Windows용 대체 검사
  try {
    const files = fs.readdirSync(cwd);
    for (const file of files) {
      if (file.includes('.test.') || file.includes('.spec.') ||
          file.startsWith('test_') || file.endsWith('_test.go')) {
        return true;
      }
    }
  } catch {
    // 디렉토리 읽기 실패 시 무시
  }

  return false;
}

function runTests(testCmd, cwd) {
  try {
    // 테스트 실행 (최대 5분)
    execSync(testCmd, {
      cwd,
      stdio: 'pipe',
      timeout: 300000,
      encoding: 'utf8'
    });
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e.stderr || e.stdout || e.message,
      exitCode: e.status
    };
  }
}

function isGitCommitCommand(command) {
  if (!command) return false;
  // git commit 패턴 매칭
  const patterns = [
    /\bgit\s+commit\b/i,
    /\bgit\s+.*commit\b/i
  ];
  return patterns.some(p => p.test(command));
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

    // Bash 도구의 git commit 명령인지 확인
    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};
    const command = toolInput.command || '';

    if (toolName !== 'Bash' || !isGitCommitCommand(command)) {
      // git commit이 아니면 그냥 통과
      console.log(JSON.stringify(data));
      return;
    }

    // git commit 명령 감지됨
    const cwd = getCwd();

    // 테스트 설정 찾기
    const testConfig = findTestConfig(cwd);
    const hasTests = hasTestFiles(cwd);

    if (!testConfig && !hasTests) {
      // 테스트 파일이 없으면 경고만 출력하고 통과
      console.error('[pre-commit-test] Warning: No test files found. Proceeding with commit.');
      console.log(JSON.stringify(data));
      return;
    }

    if (!testConfig) {
      // 테스트 파일은 있지만 실행 방법을 모름
      console.error('[pre-commit-test] Warning: Test files found but no test runner configured.');
      console.log(JSON.stringify(data));
      return;
    }

    // 테스트 실행
    console.error(`[pre-commit-test] Running tests: ${testConfig.testCmd}`);
    const result = runTests(testConfig.testCmd, cwd);

    if (result.success) {
      console.error('[pre-commit-test] Tests passed! Proceeding with commit.');
      console.log(JSON.stringify(data));
    } else {
      // 테스트 실패 - 커밋 차단
      const response = {
        decision: "block",
        reason: `Tests failed. Please fix failing tests before committing.\n\nCommand: ${testConfig.testCmd}\nExit code: ${result.exitCode}\n\nError output:\n${result.error ? result.error.substring(0, 500) : 'No error output'}`
      };
      console.log(JSON.stringify(response));
    }
  } catch (e) {
    console.error('[pre-commit-test] Hook error:', e.message);
    // 에러 시에도 커밋 진행 허용 (훅 실패가 작업을 막지 않도록)
    try {
      const data = JSON.parse(input);
      console.log(JSON.stringify(data));
    } catch {
      process.exit(1);
    }
  }
}

main();
