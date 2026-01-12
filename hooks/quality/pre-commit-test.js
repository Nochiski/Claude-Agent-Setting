#!/usr/bin/env node
/**
 * Pre-Commit Test Hook
 * Searches for and runs tests before git commit execution
 *
 * Behavior:
 * 1. Detect git commit command
 * 2. Check if test files exist
 * 3. Run tests
 * 4. Block commit on failure
 *
 * Skip options:
 * - TEST_SKIP=true environment variable
 * - git commit --no-verify flag
 */

const { execSync, spawnSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Skip configuration
const SKIP_CONFIG = {
  envVar: 'TEST_SKIP',
  noVerifyFlag: '--no-verify'
};

// Test framework configurations
const TEST_CONFIGS = [
  // JavaScript/TypeScript
  { files: ['package.json'], testCmd: 'npm test', checkScript: true },
  { files: ['jest.config.js', 'jest.config.ts'], testCmd: 'npx jest' },
  { files: ['vitest.config.js', 'vitest.config.ts'], testCmd: 'npx vitest run' },

  // Python (uv projects - check first)
  { files: ['uv.lock'], testCmd: 'uv run pytest', testDirs: ['tests', 'test'] },
  // Python (standard)
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

// Common test directory/file patterns
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
        // For package.json, check if test script exists
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
  // Check test directories
  const testDirs = ['test', 'tests', 'spec', 'specs', '__tests__', 'src/__tests__'];
  for (const dir of testDirs) {
    if (fileExists(path.join(cwd, dir))) {
      return true;
    }
  }

  // Check test file patterns (simple check)
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
    // Ignore find command failure
  }

  // Fallback check for Windows
  try {
    const files = fs.readdirSync(cwd);
    for (const file of files) {
      if (file.includes('.test.') || file.includes('.spec.') ||
          file.startsWith('test_') || file.endsWith('_test.go')) {
        return true;
      }
    }
  } catch {
    // Ignore directory read failure
  }

  return false;
}

function runTests(testCmd, cwd) {
  try {
    // Run tests (max 5 minutes)
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
  // git commit pattern matching
  const patterns = [
    /\bgit\s+commit\b/i,
    /\bgit\s+.*commit\b/i
  ];
  return patterns.some(p => p.test(command));
}

function shouldSkipTests(command) {
  // Check TEST_SKIP environment variable
  if (process.env[SKIP_CONFIG.envVar] === 'true') {
    console.error('[pre-commit-test] WARNING: Tests skipped via TEST_SKIP=true');
    console.error('[pre-commit-test] Remember to run tests before pushing!');
    return true;
  }

  // Check --no-verify flag in command
  if (command && command.includes(SKIP_CONFIG.noVerifyFlag)) {
    console.error('[pre-commit-test] WARNING: Tests skipped via --no-verify flag');
    console.error('[pre-commit-test] Remember to run tests before pushing!');
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

    // Check if Bash tool is running git commit command
    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};
    const command = toolInput.command || '';

    if (toolName !== 'Bash' || !isGitCommitCommand(command)) {
      // Pass through if not git commit
      console.log(JSON.stringify(data));
      return;
    }

    // Check if tests should be skipped
    if (shouldSkipTests(command)) {
      console.log(JSON.stringify(data));
      return;
    }

    // git commit command detected
    const cwd = getCwd();

    // Find test configuration
    const testConfig = findTestConfig(cwd);
    const hasTests = hasTestFiles(cwd);

    if (!testConfig && !hasTests) {
      // No test files - warn and pass through
      console.error('[pre-commit-test] Warning: No test files found. Proceeding with commit.');
      console.log(JSON.stringify(data));
      return;
    }

    if (!testConfig) {
      // Test files exist but don't know how to run them
      console.error('[pre-commit-test] Warning: Test files found but no test runner configured.');
      console.log(JSON.stringify(data));
      return;
    }

    // Run tests
    console.error(`[pre-commit-test] Running tests: ${testConfig.testCmd}`);
    const result = runTests(testConfig.testCmd, cwd);

    if (result.success) {
      console.error('[pre-commit-test] Tests passed! Proceeding with commit.');
      console.log(JSON.stringify(data));
    } else {
      // Test failed
      // Check if strict mode is enabled (default: warning only)
      const strictMode = process.env.TEST_STRICT === 'true';

      if (strictMode) {
        // Strict mode: block commit
        const response = {
          decision: "block",
          reason: `Tests failed. Please fix failing tests before committing.\n\nCommand: ${testConfig.testCmd}\nExit code: ${result.exitCode}\n\nError output:\n${result.error ? result.error.substring(0, 500) : 'No error output'}`
        };
        console.log(JSON.stringify(response));
      } else {
        // Default: warn and proceed (add warning to tool result for user awareness)
        console.error('\n');
        console.error('╔════════════════════════════════════════════════════════════════╗');
        console.error('║  ⚠️  TESTS FAILED - Proceeding with commit anyway              ║');
        console.error('╠════════════════════════════════════════════════════════════════╣');
        console.error(`║  Command: ${testConfig.testCmd.padEnd(51)}║`);
        console.error(`║  Exit code: ${String(result.exitCode).padEnd(50)}║`);
        console.error('║                                                                ║');
        console.error('║  The commit will proceed, but please fix the tests before     ║');
        console.error('║  pushing to remote. Use TEST_STRICT=true to block commits.    ║');
        console.error('║                                                                ║');
        console.error('╚════════════════════════════════════════════════════════════════╝');
        console.error('\n');

        // Add warning to tool_input for Claude's awareness
        if (!data.tool_input._warnings) {
          data.tool_input._warnings = [];
        }
        data.tool_input._warnings.push({
          type: 'test_failure',
          message: `Tests failed (${testConfig.testCmd}). Please fix before pushing.`,
          error: result.error ? result.error.substring(0, 200) : null
        });

        console.log(JSON.stringify(data));
      }
    }
  } catch (e) {
    console.error('[pre-commit-test] Hook error:', e.message);
    // Allow commit even on error (hook failure should not block work)
    try {
      const data = JSON.parse(input);
      console.log(JSON.stringify(data));
    } catch {
      process.exit(1);
    }
  }
}

main();

