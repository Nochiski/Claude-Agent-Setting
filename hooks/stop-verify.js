#!/usr/bin/env node
/**
 * Stop Verification Hook
 * Performs work verification on session termination
 *
 * Verification items:
 * - Check incomplete TODOs
 * - Run tests (if configured)
 * - Verify build (if configured)
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Verification settings (customizable via environment variables)
const CONFIG = {
  checkTodos: process.env.VERIFY_TODOS !== 'false',
  runTests: process.env.VERIFY_TESTS === 'true',
  runBuild: process.env.VERIFY_BUILD === 'true',
  testCommand: process.env.TEST_COMMAND || 'npm test',
  buildCommand: process.env.BUILD_COMMAND || 'npm run build'
};

function checkUnfinishedTodos(data) {
  // Find incomplete TODO patterns in conversation content
  const content = JSON.stringify(data);
  const todoPatterns = [
    /\[ \]/g,           // Unchecked checkbox
    /TODO:/gi,          // TODO comments
    /FIXME:/gi,         // FIXME comments
    /in_progress/g      // In-progress work
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

    // 1. Check incomplete TODOs
    if (CONFIG.checkTodos) {
      const todoIssues = checkUnfinishedTodos(data);
      if (todoIssues.length > 0) {
        warnings.push('Incomplete work found:');
        warnings = warnings.concat(todoIssues.map(i => `  - ${i}`));
      }
    }

    // 2. Run tests
    if (CONFIG.runTests) {
      const testResult = runCommand(CONFIG.testCommand);
      if (!testResult.success) {
        warnings.push(`Tests failed: ${CONFIG.testCommand}`);
      }
    }

    // 3. Verify build
    if (CONFIG.runBuild) {
      const buildResult = runCommand(CONFIG.buildCommand);
      if (!buildResult.success) {
        warnings.push(`Build failed: ${CONFIG.buildCommand}`);
      }
    }

    // Output warnings
    if (warnings.length > 0) {
      console.error('\n=== Pre-session termination verification results ===');
      warnings.forEach(w => console.error(w));
      console.error('=====================================================\n');
    }

    // Return data as-is (no blocking)
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
