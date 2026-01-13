#!/usr/bin/env node
/**
 * Stop Orchestrator Hook
 * Unified stop event handler - combines Ralph Loop, Pipeline Enforcer, and Stop Verify
 *
 * Execution order:
 * 1. Ralph Loop check (if RALPH_ENABLED=true)
 * 2. Pipeline completion check (if code was modified)
 * 3. Verification warnings (TODO check, optional tests/build)
 *
 * Environment variables:
 * - RALPH_ENABLED=true: Enable Ralph Loop
 * - RALPH_MAX_ITERATIONS=20: Maximum iterations
 * - RALPH_COMPLETION_MARKER=COMPLETE: Custom completion marker
 * - PIPELINE_SKIP=true: Skip pipeline check
 * - VERIFY_TODOS=false: Disable TODO check
 * - VERIFY_TESTS=true: Run tests before exit
 * - VERIFY_BUILD=true: Run build before exit
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==================== Configuration ====================

const CONFIG = {
  // Ralph Loop settings
  ralph: {
    enabled: process.env.RALPH_ENABLED === 'true',
    maxIterations: parseInt(process.env.RALPH_MAX_ITERATIONS) || 20,
    completionMarker: process.env.RALPH_COMPLETION_MARKER || 'COMPLETE',
    customPrompt: process.env.RALPH_PROMPT || null,
    stateFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'ralph-state.json')
  },
  // Pipeline settings
  pipeline: {
    enabled: process.env.PIPELINE_SKIP !== 'true',
    stateFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'pipeline-state.json')
  },
  // Verification settings
  verify: {
    checkTodos: process.env.VERIFY_TODOS !== 'false',
    runTests: process.env.VERIFY_TESTS === 'true',
    runBuild: process.env.VERIFY_BUILD === 'true',
    testCommand: process.env.TEST_COMMAND || 'npm test',
    buildCommand: process.env.BUILD_COMMAND || 'npm run build'
  }
};

// ==================== Ralph Loop Module ====================

const COMPLETION_PATTERNS = [
  /<promise>[\s\S]*?COMPLETE[\s\S]*?<\/promise>/i,
  /TASK_COMPLETE/,
  /\[COMPLETE\]/,
  /task\s*complete/i,
  /all\s*tasks.*complete/i
];

function checkTodoCompletion(content) {
  const inProgressCount = (content.match(/"status"\s*:\s*"in_progress"/g) || []).length;
  const pendingCount = (content.match(/"status"\s*:\s*"pending"/g) || []).length;
  const completedCount = (content.match(/"status"\s*:\s*"completed"/g) || []).length;

  if (completedCount > 0 && inProgressCount === 0 && pendingCount === 0) {
    return { complete: true, reason: `All todos complete (${completedCount})` };
  }

  if (completedCount > 0 || inProgressCount > 0 || pendingCount > 0) {
    return {
      complete: false,
      reason: `Todos incomplete - completed: ${completedCount}, in_progress: ${inProgressCount}, pending: ${pendingCount}`
    };
  }

  return { complete: false, reason: 'No todos, checking text markers' };
}

function loadRalphState() {
  try {
    if (fs.existsSync(CONFIG.ralph.stateFile)) {
      const state = JSON.parse(fs.readFileSync(CONFIG.ralph.stateFile, 'utf8'));
      if (Date.now() - state.startTime > 60 * 60 * 1000) {
        return { iterations: 0, startTime: Date.now() };
      }
      return state;
    }
  } catch (e) { /* ignore */ }
  return { iterations: 0, startTime: Date.now() };
}

function saveRalphState(state) {
  try {
    fs.writeFileSync(CONFIG.ralph.stateFile, JSON.stringify(state, null, 2));
  } catch (e) { /* ignore */ }
}

function resetRalphState() {
  try {
    if (fs.existsSync(CONFIG.ralph.stateFile)) {
      fs.unlinkSync(CONFIG.ralph.stateFile);
    }
  } catch (e) { /* ignore */ }
}

function checkRalphCompletion(data) {
  const content = JSON.stringify(data);

  // 1. Todo status check (priority)
  const todoResult = checkTodoCompletion(content);
  if (todoResult.complete) {
    return { complete: true, reason: todoResult.reason };
  }

  // 2. Custom marker check
  if (content.includes(CONFIG.ralph.completionMarker)) {
    return { complete: true, reason: `Custom marker "${CONFIG.ralph.completionMarker}"` };
  }

  // 3. Default pattern check
  const patternMatch = COMPLETION_PATTERNS.some(pattern => pattern.test(content));
  if (patternMatch) {
    return { complete: true, reason: 'Text pattern match' };
  }

  return { complete: false, reason: todoResult.reason };
}

function handleRalphLoop(data) {
  // Check stop_hook_active to prevent infinite loop
  if (data.stop_hook_active) {
    console.error('\n⚠️  [RALPH LOOP] stop_hook_active detected - allowing termination\n');
    resetRalphState();
    return { blocked: false };
  }

  const state = loadRalphState();
  const result = checkRalphCompletion(data);

  if (result.complete) {
    console.error(`\n✅ [RALPH LOOP] Completion detected: ${result.reason} (${state.iterations} iterations)`);
    resetRalphState();
    return { blocked: false };
  }

  if (state.iterations >= CONFIG.ralph.maxIterations) {
    console.error(`\n⚠️  [RALPH LOOP] Max iterations (${CONFIG.ralph.maxIterations}) reached`);
    resetRalphState();
    return { blocked: false };
  }

  state.iterations++;
  saveRalphState(state);

  console.error(`\n🔄 [RALPH LOOP] Iteration ${state.iterations}/${CONFIG.ralph.maxIterations}`);
  console.error(`   ${result.reason}`);
  console.error('   Continuing work...\n');

  let reason = `[Ralph Loop ${state.iterations}/${CONFIG.ralph.maxIterations}] Completion marker not found. Please continue work. Output "${CONFIG.ralph.completionMarker}" when complete.`;
  if (CONFIG.ralph.customPrompt) {
    reason += `\n\nTask instruction: ${CONFIG.ralph.customPrompt}`;
  }

  return { blocked: true, reason };
}

// ==================== Self-Verification Pipeline Module ====================
// Core Philosophy: All outputs (code, plans, designs) MUST be verified by another agent
// This ensures quality through cross-validation, not just tests

function loadPipelineState() {
  try {
    if (fs.existsSync(CONFIG.pipeline.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.pipeline.stateFile, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return null;
}

function resetPipelineState() {
  try {
    if (fs.existsSync(CONFIG.pipeline.stateFile)) {
      fs.unlinkSync(CONFIG.pipeline.stateFile);
    }
  } catch (e) { /* ignore */ }
}

/**
 * Get missing verification steps based on what was produced
 * - Code changes → require code reviewer (heimdall)
 * - Plans created → require plan reviewer (loki)
 * - Any significant output → require at least one verification
 */
function getMissingVerificationSteps(state) {
  const missing = [];
  const verificationStatus = state.verificationStatus || state.pipelineStatus || {};

  // Code was modified → needs code review
  if (state.codeModified && !verificationStatus.codeReviewer && !verificationStatus.heimdall) {
    missing.push({
      step: 'code-reviewer (heimdall)',
      reason: 'Code was modified - another agent must review for quality, bugs, and security',
      agent: 'heimdall'
    });
  }

  // Plan was created → needs plan review
  if (state.planCreated && !verificationStatus.planReviewer && !verificationStatus.loki) {
    missing.push({
      step: 'plan-reviewer (loki)',
      reason: 'Plan was created - another agent must review for flaws and risks',
      agent: 'loki'
    });
  }

  // Significant changes without any verification
  if ((state.codeModified || state.planCreated) && !verificationStatus.anyVerification) {
    // Check if at least one verification agent was used
    const verificationAgents = ['code-reviewer', 'heimdall', 'loki', 'test-writer', 'tyr', 'oracle', 'odin'];
    const hasVerification = verificationAgents.some(agent => verificationStatus[agent]);

    if (!hasVerification && missing.length === 0) {
      missing.push({
        step: 'any-verifier',
        reason: 'Significant changes were made without any verification by another agent',
        agent: 'heimdall or loki'
      });
    }
  }

  return missing;
}

function handlePipelineEnforcer() {
  const state = loadPipelineState();

  // No state or nothing to verify - allow
  if (!state || (!state.codeModified && !state.planCreated)) {
    return { blocked: false };
  }

  // Check if working directory changed (cross-repo issue fix)
  if (state.workingDirectory && state.workingDirectory !== process.cwd()) {
    resetPipelineState();
    return { blocked: false };
  }

  // Stale state check (more than 1 hour)
  if (Date.now() - state.lastModified > 60 * 60 * 1000) {
    resetPipelineState();
    return { blocked: false };
  }

  const missing = getMissingVerificationSteps(state);

  if (missing.length > 0) {
    console.error('\n');
    console.error('╔════════════════════════════════════════════════════════════════╗');
    console.error('║  SELF-VERIFICATION REQUIRED - Session termination blocked      ║');
    console.error('╠════════════════════════════════════════════════════════════════╣');
    console.error('║                                                                ║');
    console.error('║  Core Principle: All outputs must be verified by another agent ║');
    console.error('║  "Trust, but verify" - Every output needs a second opinion     ║');
    console.error('║                                                                ║');
    console.error('║  Missing verification:                                         ║');
    missing.forEach(item => {
      console.error(`║    ➤ ${item.step.padEnd(56)}║`);
      console.error(`║      ${item.reason.substring(0, 54).padEnd(58)}║`);
    });
    console.error('║                                                                ║');

    if (state.codeModified && state.filesModified) {
      console.error('║  Modified files:                                               ║');
      state.filesModified.slice(0, 3).forEach(file => {
        const basename = path.basename(file);
        console.error(`║    - ${basename.substring(0, 56).padEnd(58)}║`);
      });
      if (state.filesModified.length > 3) {
        console.error(`║    ... and ${(state.filesModified.length - 3)} more files`.padEnd(65) + '║');
      }
    }

    console.error('║                                                                ║');
    console.error('║  Required action:                                              ║');
    console.error('║    Use Task tool to delegate verification to another agent    ║');
    console.error('║    Example: Task(subagent_type="heimdall", ...)                ║');
    console.error('║                                                                ║');
    console.error('║  Skip (not recommended): PIPELINE_SKIP=true                    ║');
    console.error('║                                                                ║');
    console.error('╚════════════════════════════════════════════════════════════════╝');
    console.error('\n');

    const missingList = missing.map(m => m.agent).join(', ');
    return {
      blocked: true,
      reason: `Self-verification incomplete. Your work needs to be reviewed by another agent (${missingList}). Use Task tool to delegate verification.`
    };
  }

  console.error('[VERIFICATION] All outputs verified by another agent. Session can end.');
  resetPipelineState();
  return { blocked: false };
}

// ==================== Stop Verify Module ====================

function checkUnfinishedTodos(data) {
  const content = JSON.stringify(data);
  const todoPatterns = [
    /\[ \]/g,
    /TODO:/gi,
    /FIXME:/gi,
    /in_progress/g
  ];

  let issues = [];
  for (const pattern of todoPatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push(`${pattern.source}: ${matches.length} found`);
    }
  }

  return issues;
}

function runCommand(command) {
  try {
    execSync(command, { stdio: 'pipe', timeout: 60000 });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function handleVerification(data) {
  let warnings = [];

  // 1. Check incomplete TODOs
  if (CONFIG.verify.checkTodos) {
    const todoIssues = checkUnfinishedTodos(data);
    if (todoIssues.length > 0) {
      warnings.push('Incomplete work found:');
      warnings = warnings.concat(todoIssues.map(i => `  - ${i}`));
    }
  }

  // 2. Run tests
  if (CONFIG.verify.runTests) {
    const testResult = runCommand(CONFIG.verify.testCommand);
    if (!testResult.success) {
      warnings.push(`Tests failed: ${CONFIG.verify.testCommand}`);
    }
  }

  // 3. Verify build
  if (CONFIG.verify.runBuild) {
    const buildResult = runCommand(CONFIG.verify.buildCommand);
    if (!buildResult.success) {
      warnings.push(`Build failed: ${CONFIG.verify.buildCommand}`);
    }
  }

  // Output warnings (non-blocking)
  if (warnings.length > 0) {
    console.error('\n=== Pre-session termination verification ===');
    warnings.forEach(w => console.error(w));
    console.error('=============================================\n');
  }

  return { warnings };
}

// ==================== Main ====================

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

    // 1. Ralph Loop check (if enabled)
    if (CONFIG.ralph.enabled) {
      const ralphResult = handleRalphLoop(data);
      if (ralphResult.blocked) {
        const response = {
          decision: 'block',
          reason: ralphResult.reason
        };
        console.log(JSON.stringify(response));
        process.exit(2);
        return;
      }
    }

    // 2. Pipeline check (if enabled and code was modified)
    if (CONFIG.pipeline.enabled) {
      const pipelineResult = handlePipelineEnforcer();
      if (pipelineResult.blocked) {
        const response = {
          decision: 'block',
          reason: pipelineResult.reason
        };
        console.log(JSON.stringify(response));
        process.exit(2);
        return;
      }
    }

    // 3. Verification (warnings only, non-blocking)
    handleVerification(data);

    // All checks passed
    console.log(JSON.stringify(data));
    process.exit(0);

  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
