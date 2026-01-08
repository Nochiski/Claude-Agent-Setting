#!/usr/bin/env node
/**
 * Rules Injector Hook
 * UserPromptSubmit 시 프로젝트 규칙을 컨텍스트에 주입
 *
 * 규칙 파일 우선순위:
 * 1. CLAUDE.md (프로젝트 루트)
 * 2. .claude/rules.md
 * 3. .cursorrules (Cursor 호환)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const RULE_FILES = [
  'CLAUDE.md',
  '.claude/rules.md',
  '.cursorrules',
  '.cursor/rules.md'
];

// 세션당 한 번만 주입하기 위한 추적
const INJECTED_FLAG = '<!-- rules-injected -->';

function findRulesFile(cwd) {
  for (const file of RULE_FILES) {
    const fullPath = path.join(cwd, file);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

function loadRules(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.trim();
  } catch (e) {
    return null;
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
    const cwd = process.cwd();

    // 이미 주입된 경우 스킵
    const prompt = data.user_prompt || '';
    if (prompt.includes(INJECTED_FLAG)) {
      console.log(JSON.stringify(data));
      return;
    }

    // 규칙 파일 찾기
    const rulesPath = findRulesFile(cwd);
    if (rulesPath) {
      const rules = loadRules(rulesPath);
      if (rules) {
        // 첫 프롬프트에만 규칙 주입
        const ruleName = path.basename(rulesPath);
        const injection = `${INJECTED_FLAG}\n<project-rules source="${ruleName}">\n${rules}\n</project-rules>\n\n`;

        // 프롬프트 앞에 규칙 추가
        if (data.user_prompt) {
          data.user_prompt = injection + data.user_prompt;
        }

        console.error(`Rules injected from: ${ruleName}`);
      }
    }

    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
