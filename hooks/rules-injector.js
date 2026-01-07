#!/usr/bin/env node
/**
 * Rules Injector Hook
 * UserPromptSubmit 시 프로젝트 규칙과 README를 컨텍스트에 주입
 *
 * 규칙 파일 우선순위:
 * 1. CLAUDE.md (프로젝트 루트)
 * 2. .claude/rules.md
 * 3. .cursorrules (Cursor 호환)
 *
 * README 파일 (코딩 전 필수 읽기):
 * 1. README.md
 * 2. readme.md
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

const README_FILES = [
  'README.md',
  'readme.md',
  'Readme.md'
];

// 세션당 한 번만 주입하기 위한 추적
const INJECTED_FLAG = '<!-- rules-injected -->';

function findFile(cwd, fileList) {
  for (const file of fileList) {
    const fullPath = path.join(cwd, file);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

function loadFile(filePath) {
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

    let injection = INJECTED_FLAG + '\n';
    let injected = false;

    // README 파일 찾기 및 주입 (코딩 전 필수)
    const readmePath = findFile(cwd, README_FILES);
    if (readmePath) {
      const readme = loadFile(readmePath);
      if (readme) {
        const readmeName = path.basename(readmePath);
        injection += `<project-readme source="${readmeName}">\n이 README를 먼저 읽고 프로젝트 컨텍스트를 파악한 후 작업을 시작하세요.\n\n${readme}\n</project-readme>\n\n`;
        console.error(`README injected from: ${readmeName}`);
        injected = true;
      }
    }

    // 규칙 파일 찾기 및 주입
    const rulesPath = findFile(cwd, RULE_FILES);
    if (rulesPath) {
      const rules = loadFile(rulesPath);
      if (rules) {
        const ruleName = path.basename(rulesPath);
        injection += `<project-rules source="${ruleName}">\n${rules}\n</project-rules>\n\n`;
        console.error(`Rules injected from: ${ruleName}`);
        injected = true;
      }
    }

    // 프롬프트 앞에 주입
    if (injected && data.user_prompt) {
      data.user_prompt = injection + data.user_prompt;
    }

    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
