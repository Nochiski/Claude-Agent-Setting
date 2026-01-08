#!/usr/bin/env node
/**
 * Ralph Loop Hook (Ralph Wiggum Style)
 * Checks completion conditions on Stop event, blocks session termination if incomplete for auto-loop execution
 *
 * Usage:
 * 1. Include completion marker in prompt: "<promise>COMPLETE</promise>" or "TASK_COMPLETE"
 * 2. Automatically continues until Claude outputs the completion marker
 *
 * Environment variables:
 * - RALPH_ENABLED=true: Enable Ralph Loop (default: false)
 * - RALPH_MAX_ITERATIONS=20: Maximum iterations (default: 20)
 * - RALPH_COMPLETION_MARKER=COMPLETE: Completion marker (default: COMPLETE)
 * - RALPH_PROMPT: Prompt to re-inject (if set, uses this prompt for each iteration)
 *
 * Warning:
 * - Costs can increase rapidly, so MAX_ITERATIONS setting is essential
 * - Only use for tasks with clear completion conditions
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  enabled: process.env.RALPH_ENABLED === 'true',
  maxIterations: parseInt(process.env.RALPH_MAX_ITERATIONS) || 20,
  completionMarker: process.env.RALPH_COMPLETION_MARKER || 'COMPLETE',
  customPrompt: process.env.RALPH_PROMPT || null,
  stateFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'ralph-state.json')
};

// Completion patterns (text markers)
const COMPLETION_PATTERNS = [
  /<promise>[\s\S]*?COMPLETE[\s\S]*?<\/promise>/i,
  /TASK_COMPLETE/,
  /\[COMPLETE\]/,
  /task\s*complete/i,
  /all\s*tasks.*complete/i
];

// Todo status-based completion check
function checkTodoCompletion(content) {
  // Incomplete if in_progress or pending status exists
  const inProgressCount = (content.match(/"status"\s*:\s*"in_progress"/g) || []).length;
  const pendingCount = (content.match(/"status"\s*:\s*"pending"/g) || []).length;
  const completedCount = (content.match(/"status"\s*:\s*"completed"/g) || []).length;

  // Complete if at least one todo exists and all are completed
  if (completedCount > 0 && inProgressCount === 0 && pendingCount === 0) {
    return { complete: true, reason: `All todos complete (${completedCount})` };
  }

  // Todos exist but incomplete items present
  if (completedCount > 0 || inProgressCount > 0 || pendingCount > 0) {
    return {
      complete: false,
      reason: `Todos incomplete - completed: ${completedCount}, in_progress: ${inProgressCount}, pending: ${pendingCount}`
    };
  }

  // No todos - determine by text markers
  return { complete: false, reason: 'No todos, checking text markers' };
}

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      const state = JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
      // Reset if more than 1 hour elapsed
      if (Date.now() - state.startTime > 60 * 60 * 1000) {
        return { iterations: 0, startTime: Date.now() };
      }
      return state;
    }
  } catch (e) {
    // ignore
  }
  return { iterations: 0, startTime: Date.now() };
}

function saveState(state) {
  try {
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (e) {
    // ignore
  }
}

function resetState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      fs.unlinkSync(CONFIG.stateFile);
    }
  } catch (e) {
    // ignore
  }
}

function checkCompletion(data) {
  const content = JSON.stringify(data);

  // 1. Todo status-based check (priority)
  const todoResult = checkTodoCompletion(content);
  if (todoResult.complete) {
    console.error(`   Completion detected: ${todoResult.reason}`);
    return true;
  }

  // 2. Custom marker check
  if (content.includes(CONFIG.completionMarker)) {
    console.error(`   Completion detected: Custom marker "${CONFIG.completionMarker}"`);
    return true;
  }

  // 3. Default completion pattern check
  const patternMatch = COMPLETION_PATTERNS.some(pattern => pattern.test(content));
  if (patternMatch) {
    console.error('   Completion detected: Text pattern match');
    return true;
  }

  // Log incomplete status
  if (todoResult.reason !== 'No todos, checking text markers') {
    console.error(`   ${todoResult.reason}`);
  }

  return false;
}

function readTranscript(transcriptPath) {
  try {
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      return fs.readFileSync(transcriptPath, 'utf8');
    }
  } catch (e) {
    // ignore
  }
  return '';
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

    // Pass through when Ralph Loop is disabled
    if (!CONFIG.enabled) {
      console.log(JSON.stringify(data));
      return;
    }

    // Check stop_hook_active (prevent infinite loop)
    if (data.stop_hook_active) {
      console.error('\n⚠️  [RALPH LOOP] stop_hook_active detected - allowing termination to prevent infinite loop\n');
      resetState();
      console.log(JSON.stringify(data));
      process.exit(0);
      return;
    }

    const state = loadState();

    // Also check completion in transcript
    const transcript = readTranscript(data.transcript_path);
    const isComplete = checkCompletion(data) ||
                       (transcript && checkCompletion({ transcript }));

    if (isComplete) {
      console.error(`\n✅ [RALPH LOOP] Completion marker detected! (completed after ${state.iterations} iterations)`);
      console.error('   Allowing normal session termination.\n');
      resetState();
      console.log(JSON.stringify(data));
      process.exit(0);
      return;
    }

    // Check maximum iterations
    if (state.iterations >= CONFIG.maxIterations) {
      console.error(`\n⚠️  [RALPH LOOP] Maximum iterations (${CONFIG.maxIterations}) reached`);
      console.error('   Completion marker not found, but terminating.');
      console.error('   Adjust with RALPH_MAX_ITERATIONS environment variable.\n');
      resetState();
      console.log(JSON.stringify(data));
      process.exit(0);
      return;
    }

    // Continue iteration
    state.iterations++;
    saveState(state);

    console.error(`\n🔄 [RALPH LOOP] Iteration ${state.iterations}/${CONFIG.maxIterations}`);
    console.error(`   Completion marker "${CONFIG.completionMarker}" not found.`);
    console.error('   Continuing work...\n');

    // Block termination
    const response = {
      decision: 'block',
      reason: `[Ralph Loop ${state.iterations}/${CONFIG.maxIterations}] Completion marker not found. Please continue work. Output "${CONFIG.completionMarker}" when complete.`
    };

    if (CONFIG.customPrompt) {
      response.reason += `\n\nTask instruction: ${CONFIG.customPrompt}`;
    }

    console.log(JSON.stringify(response));
    process.exit(2); // exit code 2 to block termination

  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
