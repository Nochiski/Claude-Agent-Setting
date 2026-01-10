#!/usr/bin/env node
/**
 * Pipeline Enforcer Hook
 * Blocks session termination if code was modified but pipeline wasn't completed
 *
 * Checks:
 * - If code was modified (codeModified: true)
 * - If pipeline agents were called (code-reviewer, test-writer)
 * - Blocks with exit code 2 if pipeline incomplete
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  stateFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'pipeline-state.json'),
  skipEnvVar: 'PIPELINE_SKIP'
};

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return null;
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

function getMissingSteps(pipelineStatus) {
  const missing = [];
  if (!pipelineStatus.codeReviewer) missing.push('code-reviewer');
  if (!pipelineStatus.testWriter) missing.push('test-writer');
  return missing;
}

async function main() {
  // Check skip environment variable
  if (process.env[CONFIG.skipEnvVar] === 'true') {
    console.error('[PIPELINE] Skipped via PIPELINE_SKIP=true');
    process.exit(0);
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

    // No state or no code modified - allow exit
    if (!state || !state.codeModified) {
      console.log(JSON.stringify(data));
      process.exit(0);
    }

    // Check if state is stale (more than 1 hour)
    if (Date.now() - state.lastModified > 60 * 60 * 1000) {
      resetState();
      console.log(JSON.stringify(data));
      process.exit(0);
    }

    // Check pipeline completion
    const missing = getMissingSteps(state.pipelineStatus);

    if (missing.length > 0) {
      console.error('\n');
      console.error('╔════════════════════════════════════════════════════════════════╗');
      console.error('║  PIPELINE INCOMPLETE - Session termination blocked             ║');
      console.error('╠════════════════════════════════════════════════════════════════╣');
      console.error('║                                                                ║');
      console.error('║  Code was modified but required pipeline steps were skipped:  ║');
      console.error('║                                                                ║');
      missing.forEach(step => {
        console.error(`║    - ${step.padEnd(58)}║`);
      });
      console.error('║                                                                ║');
      console.error('║  Modified files:                                               ║');
      state.filesModified.slice(0, 5).forEach(file => {
        const basename = path.basename(file);
        console.error(`║    - ${basename.substring(0, 56).padEnd(58)}║`);
      });
      if (state.filesModified.length > 5) {
        console.error(`║    ... and ${(state.filesModified.length - 5)} more files`.padEnd(65) + '║');
      }
      console.error('║                                                                ║');
      console.error('║  Required action:                                              ║');
      console.error('║    Run the missing pipeline agents before ending session.     ║');
      console.error('║                                                                ║');
      console.error('║  To skip (not recommended):                                    ║');
      console.error('║    Set PIPELINE_SKIP=true environment variable                ║');
      console.error('║                                                                ║');
      console.error('╚════════════════════════════════════════════════════════════════╝');
      console.error('\n');

      // Block session termination
      process.exit(2);
    }

    // Pipeline complete - reset state and allow exit
    console.error('[PIPELINE] All pipeline steps completed. Session can end.');
    resetState();
    console.log(JSON.stringify(data));
    process.exit(0);

  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
