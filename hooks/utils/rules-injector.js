#!/usr/bin/env node
/**
 * Rules Injector Hook
 * Injects project rules into context on UserPromptSubmit
 *
 * Rule file priority:
 * 1. CLAUDE.md (project root)
 * 2. .claude/rules.md
 * 3. .cursorrules (Cursor compatible)
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

// Tracking to inject only once per session
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

    // Skip if already injected
    const prompt = data.user_prompt || '';
    if (prompt.includes(INJECTED_FLAG)) {
      console.log(JSON.stringify(data));
      return;
    }

    // Find rules file
    const rulesPath = findRulesFile(cwd);
    if (rulesPath) {
      const rules = loadRules(rulesPath);
      if (rules) {
        // Inject rules only on first prompt
        const ruleName = path.basename(rulesPath);
        const injection = `${INJECTED_FLAG}\n<project-rules source="${ruleName}">\n${rules}\n</project-rules>\n\n`;

        // Add rules before prompt
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
