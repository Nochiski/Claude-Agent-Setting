#!/usr/bin/env node
/**
 * Pipeline Tracker Hook
 * Tracks code modifications and pipeline execution status during PostToolUse events
 *
 * Tracks:
 * - Edit/Write on code files → marks codeModified
 * - Task calls to code-reviewer/test-writer → updates pipeline status
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  stateFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'pipeline-state.json'),
  // Code file extensions that trigger pipeline requirement
  codeExtensions: ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.kt', '.c', '.cpp', '.h', '.cs', '.rb', '.php'],
  // Config/doc files that skip pipeline
  skipExtensions: ['.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.md', '.txt', '.rst', '.html', '.css', '.scss', '.svg'],
  skipFiles: ['package.json', 'tsconfig.json', 'pyproject.toml', '.env', '.gitignore', 'README.md']
};

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      const state = JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
      // Reset if more than 1 hour elapsed
      if (Date.now() - state.lastModified > 60 * 60 * 1000) {
        return createFreshState();
      }
      return state;
    }
  } catch (e) {
    // ignore
  }
  return createFreshState();
}

function createFreshState() {
  return {
    codeModified: false,
    filesModified: [],
    pipelineStatus: {
      codeReviewer: false,
      testWriter: false
    },
    lastModified: Date.now()
  };
}

function saveState(state) {
  try {
    state.lastModified = Date.now();
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (e) {
    // ignore
  }
}

function isCodeFile(filePath) {
  if (!filePath) return false;
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  // Skip specific files
  if (CONFIG.skipFiles.includes(basename)) return false;

  // Skip non-code extensions
  if (CONFIG.skipExtensions.includes(ext)) return false;

  // Check if code extension
  return CONFIG.codeExtensions.includes(ext);
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

    // DEBUG: Log PostToolUse data structure to diagnose pipeline tracking issues
    // See: https://github.com/Nochiski/Claude-Agent-Setting/issues/7
    if (process.env.PIPELINE_DEBUG === 'true') {
      console.error('[PIPELINE-DEBUG] =============================');
      console.error('[PIPELINE-DEBUG] tool_name:', data.tool_name);
      console.error('[PIPELINE-DEBUG] has tool_input:', !!data.tool_input);
      console.error('[PIPELINE-DEBUG] tool_input:', JSON.stringify(data.tool_input || {}, null, 2));
      console.error('[PIPELINE-DEBUG] all keys:', Object.keys(data).join(', '));
      console.error('[PIPELINE-DEBUG] =============================');
    }

    const state = loadState();
    let stateChanged = false;

    // Track Edit/Write on code files
    if (data.tool_name === 'Edit' || data.tool_name === 'Write') {
      const filePath = data.tool_input?.file_path || '';

      if (isCodeFile(filePath)) {
        state.codeModified = true;
        if (!state.filesModified.includes(filePath)) {
          state.filesModified.push(filePath);
        }
        stateChanged = true;
        console.error(`[PIPELINE] Code file modified: ${path.basename(filePath)}`);
      }
    }

    // Track Task calls to pipeline agents
    if (data.tool_name === 'Task') {
      const subagentType = data.tool_input?.subagent_type || '';

      if (subagentType === 'code-reviewer') {
        state.pipelineStatus.codeReviewer = true;
        stateChanged = true;
        console.error('[PIPELINE] code-reviewer executed ✓');
      } else if (subagentType === 'test-writer') {
        state.pipelineStatus.testWriter = true;
        stateChanged = true;
        console.error('[PIPELINE] test-writer executed ✓');
      }
    }

    if (stateChanged) {
      saveState(state);
    }

    // Pass through data
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
