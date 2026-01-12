#!/usr/bin/env node
/**
 * Agent Usage Logger Hook (Unified Pre+Post)
 * Tracks all subagent invocations with UUID-based timing for parallel agents
 *
 * Features:
 * - UUID-based tracking (fixes parallel agent timing issues)
 * - Pre-tool: Records start time with unique ID
 * - Post-tool: Calculates duration and logs
 * - Statistics aggregation
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG = {
  logFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'agent-usage.log'),
  statsFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'agent-usage-stats.json'),
  pendingFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'agent-pending.json'),
  detailedLogFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'agent-usage-detailed.jsonl')
};

// Determine if this is PreToolUse or PostToolUse based on tool_result presence
function isPostToolUse(data) {
  return data.hasOwnProperty('tool_result');
}

function generateUUID() {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function loadPending() {
  try {
    if (fs.existsSync(CONFIG.pendingFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.pendingFile, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return {};
}

function savePending(pending) {
  try {
    const dir = path.dirname(CONFIG.pendingFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG.pendingFile, JSON.stringify(pending, null, 2));
  } catch (e) { /* ignore */ }
}

function loadStats() {
  try {
    if (fs.existsSync(CONFIG.statsFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.statsFile, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return { agents: {}, totalCalls: 0, startDate: new Date().toISOString(), durations: {} };
}

function saveStats(stats) {
  try {
    const dir = path.dirname(CONFIG.statsFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG.statsFile, JSON.stringify(stats, null, 2));
  } catch (e) { /* ignore */ }
}

function appendLog(entry) {
  try {
    const dir = path.dirname(CONFIG.logFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(CONFIG.logFile, entry + '\n');
  } catch (e) { /* ignore */ }
}

function appendDetailedLog(record) {
  try {
    const dir = path.dirname(CONFIG.detailedLogFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(CONFIG.detailedLogFile, JSON.stringify(record) + '\n');
  } catch (e) { /* ignore */ }
}

function handlePreToolUse(data) {
  if (data.tool_name !== 'Task') return data;

  const subagentType = data.tool_input?.subagent_type || 'unknown';
  const taskId = generateUUID();
  const pending = loadPending();

  // Store with UUID key (fixes parallel agent issue)
  pending[taskId] = {
    type: subagentType,
    startTime: Date.now(),
    prompt: (data.tool_input?.prompt || '').slice(0, 200)
  };

  savePending(pending);

  // Inject task ID into data for post-hook correlation
  data._agentTaskId = taskId;

  console.error(`[AGENT-LOG] Starting ${subagentType} (id: ${taskId.slice(0, 8)}...)`);
  return data;
}

function handlePostToolUse(data) {
  if (data.tool_name !== 'Task') return data;

  const subagentType = data.tool_input?.subagent_type || 'unknown';
  const taskId = data._agentTaskId;
  const timestamp = new Date().toISOString();
  const pending = loadPending();

  // Calculate duration
  let duration = 0;
  if (taskId && pending[taskId]) {
    duration = Date.now() - pending[taskId].startTime;
    delete pending[taskId];
    savePending(pending);
  } else {
    // Fallback: try to find by type (legacy compatibility)
    const legacyKey = Object.keys(pending).find(k => pending[k].type === subagentType);
    if (legacyKey) {
      duration = Date.now() - pending[legacyKey].startTime;
      delete pending[legacyKey];
      savePending(pending);
    }
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

  // Append to log
  const durationStr = duration > 0 ? `${(duration / 1000).toFixed(1)}s` : '-';
  const promptPreview = (data.tool_input?.prompt || '').slice(0, 100).replace(/\n/g, ' ');
  const logEntry = `${timestamp} | ${subagentType.padEnd(20)} | ${durationStr.padStart(8)} | ${promptPreview}`;
  appendLog(logEntry);

  // Save detailed log
  appendDetailedLog({
    timestamp,
    agent: subagentType,
    duration,
    prompt: data.tool_input?.prompt || '',
    model: data.tool_input?.model || 'default',
    taskId: taskId || null
  });

  console.error(`[AGENT-LOG] ${subagentType} completed in ${durationStr} (total: ${stats.agents[subagentType]})`);
  return data;
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
    let data = JSON.parse(input);

    if (data.tool_name === 'Task') {
      if (isPostToolUse(data)) {
        data = handlePostToolUse(data);
      } else {
        data = handlePreToolUse(data);
      }
    }

    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
