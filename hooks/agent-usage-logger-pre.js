#!/usr/bin/env node
/**
 * Agent Usage Logger Hook (PreToolUse)
 * Records agent start time for duration tracking
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  pendingFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'agent-pending.json')
};

function loadPending() {
  try {
    if (fs.existsSync(CONFIG.pendingFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.pendingFile, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return {};
}

function savePending(pending) {
  try {
    fs.writeFileSync(CONFIG.pendingFile, JSON.stringify(pending, null, 2));
  } catch (e) {
    // ignore
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

    // Track Task start time
    if (data.tool_name === 'Task') {
      const subagentType = data.tool_input?.subagent_type || 'unknown';
      const pending = loadPending();

      pending[subagentType] = {
        startTime: Date.now(),
        prompt: (data.tool_input?.prompt || '').slice(0, 100)
      };

      savePending(pending);
    }

    // Pass through data
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
