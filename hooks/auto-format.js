#!/usr/bin/env node
/**
 * Auto Format Hook
 * Automatically runs code formatter after Edit/Write tool usage
 *
 * Supported formatters:
 * - JavaScript/TypeScript: prettier, eslint --fix
 * - Python: black, ruff
 * - Go: gofmt
 * - Rust: rustfmt
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Formatter settings by file extension
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

    // Only process Edit or Write tools
    if (data.tool_name === 'Edit' || data.tool_name === 'Write') {
      const filePath = data.tool_input?.file_path;

      if (filePath && fs.existsSync(filePath)) {
        const formatters = getFormatters(filePath);

        for (const formatter of formatters) {
          if (runFormatter(formatter, filePath)) {
            // First successful formatter is enough
            console.error(`Formatted: ${path.basename(filePath)}`);
            break;
          }
        }
      }
    }

    // Return data as-is
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
