#!/usr/bin/env node
/**
 * Agent Usage Reminder Hook
 * Detects situations where agent delegation is recommended during PostToolUse events
 *
 * Features:
 * - Recommends explore agent when using Glob/Grep/Read frequently
 * - Recommends specialized agents for complex tasks
 * - Reminds "Never Work Alone" principle
 *
 * Environment variables:
 * - AGENT_REMINDER=false: Disable reminders
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  enabled: process.env.AGENT_REMINDER !== 'false',
  stateFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'agent-reminder-state.json'),
  // Direct tool call thresholds
  thresholds: {
    search: 5,     // Glob/Grep call count
    read: 8,       // Read call count
    edit: 5        // Edit call count
  }
};

// Agent recommendation mapping
const AGENT_SUGGESTIONS = {
  search: {
    agent: 'explore',
    message: 'Delegate codebase exploration to the explore agent.'
  },
  read: {
    agent: 'librarian',
    message: 'Delegate documentation/code research to the librarian agent.'
  },
  edit: {
    agent: 'refactorer',
    message: 'Consider using the refactorer agent for large-scale code changes.'
  }
};

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return {
    counts: { Glob: 0, Grep: 0, Read: 0, Edit: 0 },
    lastReset: Date.now(),
    remindedFor: []
  };
}

function saveState(state) {
  // Async write (fire-and-forget) for better performance
  fs.writeFile(CONFIG.stateFile, JSON.stringify(state, null, 2), () => {});
}

function categorizeToolUse(toolName) {
  if (['Glob', 'Grep'].includes(toolName)) return 'search';
  if (toolName === 'Read') return 'read';
  if (['Edit', 'Write'].includes(toolName)) return 'edit';
  return null;
}

async function main() {
  if (!CONFIG.enabled) {
    // Pass through when disabled
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
    let input = '';
    for await (const line of rl) input += line;
    console.log(input);
    return;
  }

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
    const state = loadState();

    // Reset if more than 10 minutes elapsed
    if (Date.now() - state.lastReset > 10 * 60 * 1000) {
      state.counts = { Glob: 0, Grep: 0, Read: 0, Edit: 0 };
      state.remindedFor = [];
      state.lastReset = Date.now();
    }

    // Reset count when Task tool is used (agent in use)
    if (data.tool_name === 'Task') {
      state.counts = { Glob: 0, Grep: 0, Read: 0, Edit: 0 };
      state.remindedFor = [];
      saveState(state);
      console.log(JSON.stringify(data));
      return;
    }

    // Tool usage count
    if (state.counts.hasOwnProperty(data.tool_name)) {
      state.counts[data.tool_name]++;
    }

    // Check by category
    const category = categorizeToolUse(data.tool_name);
    if (category) {
      let totalForCategory = 0;
      if (category === 'search') {
        totalForCategory = state.counts.Glob + state.counts.Grep;
      } else if (category === 'read') {
        totalForCategory = state.counts.Read;
      } else if (category === 'edit') {
        totalForCategory = state.counts.Edit;
      }

      const threshold = CONFIG.thresholds[category];
      const suggestion = AGENT_SUGGESTIONS[category];

      // Threshold exceeded & not yet reminded
      if (totalForCategory >= threshold && !state.remindedFor.includes(category)) {
        console.error(`\n💡 [AGENT REMINDER] "${data.tool_name}" used ${totalForCategory} times`);
        console.error(`   ${suggestion.message}`);
        console.error(`   Task(subagent_type="${suggestion.agent}", prompt="...")`);
        console.error('   "Never Work Alone" - Delegate to expert agents when available.\n');

        state.remindedFor.push(category);
      }
    }

    saveState(state);

    // Return data as-is
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
