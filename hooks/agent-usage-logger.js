#!/usr/bin/env node
/**
 * Agent Usage Logger Hook
 * Logs all subagent invocations for usage analysis
 *
 * Tracks:
 * - Which agents are called
 * - When they are called (timestamp)
 * - Call frequency per agent
 *
 * Log file: ~/.claude/agent-usage.log
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  logFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'agent-usage.log'),
  statsFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'agent-usage-stats.json'),
  pendingFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'agent-pending.json'),
  detailedLogFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'agent-usage-detailed.jsonl')
};

function loadStats() {
  try {
    if (fs.existsSync(CONFIG.statsFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.statsFile, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return { agents: {}, totalCalls: 0, startDate: new Date().toISOString() };
}

function saveStats(stats) {
  try {
    fs.writeFileSync(CONFIG.statsFile, JSON.stringify(stats, null, 2));
  } catch (e) {
    // ignore
  }
}

function appendLog(entry) {
  try {
    fs.appendFileSync(CONFIG.logFile, entry + '\n');
  } catch (e) {
    // ignore
  }
}

function appendDetailedLog(record) {
  try {
    fs.appendFileSync(CONFIG.detailedLogFile, JSON.stringify(record) + '\n');
  } catch (e) {
    // ignore
  }
}

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

    // Track Task calls (subagent invocations)
    if (data.tool_name === 'Task') {
      const subagentType = data.tool_input?.subagent_type || 'unknown';
      const timestamp = new Date().toISOString();
      const promptPreview = (data.tool_input?.prompt || '').slice(0, 100);

      // Calculate duration from pending
      const pending = loadPending();
      let duration = 0;
      if (pending[subagentType]?.startTime) {
        duration = Date.now() - pending[subagentType].startTime;
        delete pending[subagentType];
        savePending(pending);
      }

      // Update stats
      const stats = loadStats();
      stats.agents[subagentType] = (stats.agents[subagentType] || 0) + 1;
      stats.totalCalls++;
      stats.lastUpdated = timestamp;

      // Track duration stats
      if (!stats.durations) stats.durations = {};
      if (!stats.durations[subagentType]) {
        stats.durations[subagentType] = { total: 0, count: 0, avg: 0 };
      }
      if (duration > 0) {
        stats.durations[subagentType].total += duration;
        stats.durations[subagentType].count++;
        stats.durations[subagentType].avg = Math.round(
          stats.durations[subagentType].total / stats.durations[subagentType].count
        );
      }

      saveStats(stats);

      // Append to log with duration
      const durationStr = duration > 0 ? `${(duration / 1000).toFixed(1)}s` : '-';
      const logEntry = `${timestamp} | ${subagentType} | ${durationStr} | ${promptPreview.replace(/\n/g, ' ')}`;
      appendLog(logEntry);

      // Save detailed log with full prompt
      const fullPrompt = data.tool_input?.prompt || '';
      appendDetailedLog({
        timestamp,
        agent: subagentType,
        duration,
        prompt: fullPrompt,
        model: data.tool_input?.model || 'default'
      });

      console.error(`[AGENT-LOG] ${subagentType} completed in ${durationStr} (total: ${stats.agents[subagentType]})`);
    }

    // Pass through data
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
