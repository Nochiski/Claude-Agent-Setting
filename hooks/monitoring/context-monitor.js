#!/usr/bin/env node
/**
 * Context Window Monitor Hook
 * Monitors context window usage during PostToolUse events
 *
 * Features:
 * - Tracks tool result sizes
 * - Estimates cumulative tokens and warns
 * - Warning messages when thresholds are reached
 *
 * Environment variables:
 * - CONTEXT_MONITOR=false: Disable monitoring
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Warning threshold (estimated tokens)
  warnThreshold: parseInt(process.env.CONTEXT_WARN_THRESHOLD) || 150000,
  // Danger threshold
  dangerThreshold: parseInt(process.env.CONTEXT_DANGER_THRESHOLD) || 180000,
  // State file path
  stateFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'context-state.json')
};

// Approximate token estimation (4 chars = 1 token for English, 1 char = 1 token for Korean)
function estimateTokens(text) {
  if (!text) return 0;
  const str = typeof text === 'string' ? text : JSON.stringify(text);
  // Korean character count
  const koreanChars = (str.match(/[\uAC00-\uD7AF]/g) || []).length;
  // Other characters
  const otherChars = str.length - koreanChars;
  return Math.ceil(koreanChars + otherChars / 4);
}

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return { totalTokens: 0, toolCalls: 0, lastReset: Date.now() };
}

function saveState(state) {
  // Async write (fire-and-forget) for better performance
  fs.writeFile(CONFIG.stateFile, JSON.stringify(state, null, 2), () => {});
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

    // Skip monitoring if disabled via environment variable
    if (process.env.CONTEXT_MONITOR === 'false') {
      console.log(JSON.stringify(data));
      return;
    }

    const state = loadState();

    // Reset if more than 5 minutes elapsed (consider as new session)
    if (Date.now() - state.lastReset > 5 * 60 * 1000) {
      state.totalTokens = 0;
      state.toolCalls = 0;
      state.lastReset = Date.now();
    }

    // Estimate tokens for current tool result
    const resultTokens = estimateTokens(data.tool_result);
    const inputTokens = estimateTokens(data.tool_input);

    state.totalTokens += resultTokens + inputTokens;
    state.toolCalls += 1;

    // Determine warning level
    let warningLevel = 'normal';
    if (state.totalTokens > CONFIG.dangerThreshold) {
      warningLevel = 'danger';
    } else if (state.totalTokens > CONFIG.warnThreshold) {
      warningLevel = 'warn';
    }

    // Output warning messages
    if (warningLevel === 'danger') {
      console.error(`\n⚠️  [CONTEXT DANGER] Estimated tokens: ${state.totalTokens.toLocaleString()} (threshold: ${CONFIG.dangerThreshold.toLocaleString()})`);
      console.error('   Context window is almost full. Starting a new session is recommended.\n');
    } else if (warningLevel === 'warn') {
      console.error(`\n⚡ [CONTEXT WARN] Estimated tokens: ${state.totalTokens.toLocaleString()} (threshold: ${CONFIG.warnThreshold.toLocaleString()})`);
      console.error('   Context usage is high. Reduce unnecessary file reads.\n');
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
