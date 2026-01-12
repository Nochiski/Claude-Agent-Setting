#!/usr/bin/env node
/**
 * Self-Verification Pipeline Tracker
 * Tracks outputs (code, plans) and their verification status
 *
 * Core Philosophy: All outputs must be verified by another agent
 * - Code changes → tracked, requires heimdall (code-reviewer) verification
 * - Plan creation → tracked, requires loki (plan-reviewer) verification
 * - Verification agents → tracked to mark verification complete
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  stateFile: path.join(process.env.USERPROFILE || process.env.HOME, '.claude', 'pipeline-state.json'),
  // Code file extensions
  codeExtensions: ['.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.kt', '.c', '.cpp', '.h', '.cs', '.rb', '.php'],
  // Skip these (config/docs)
  skipExtensions: ['.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.md', '.txt', '.rst', '.html', '.css', '.scss', '.svg'],
  skipFiles: ['package.json', 'tsconfig.json', 'pyproject.toml', '.env', '.gitignore', 'README.md'],
  // Plan file patterns
  planPatterns: [/\.claude\/plans\//, /plan\.md$/i, /roadmap\.md$/i],
  // Verification agents (both old and new names)
  verificationAgents: {
    code: ['code-reviewer', 'heimdall', 'test-writer', 'tyr'],
    plan: ['loki', 'momus', 'oracle', 'odin'],
    any: ['code-reviewer', 'heimdall', 'test-writer', 'tyr', 'loki', 'momus', 'oracle', 'odin', 'norns']
  }
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
  } catch (e) { /* ignore */ }
  return createFreshState();
}

function createFreshState() {
  return {
    codeModified: false,
    planCreated: false,
    filesModified: [],
    plansModified: [],
    verificationStatus: {
      // Code verification
      codeReviewer: false,
      heimdall: false,
      testWriter: false,
      tyr: false,
      // Plan verification
      loki: false,
      momus: false,
      oracle: false,
      odin: false,
      // General
      anyVerification: false
    },
    lastModified: Date.now()
  };
}

function saveState(state) {
  try {
    state.lastModified = Date.now();
    const dir = path.dirname(CONFIG.stateFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
  } catch (e) { /* ignore */ }
}

function isCodeFile(filePath) {
  if (!filePath) return false;
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  if (CONFIG.skipFiles.includes(basename)) return false;
  if (CONFIG.skipExtensions.includes(ext)) return false;
  return CONFIG.codeExtensions.includes(ext);
}

function isPlanFile(filePath) {
  if (!filePath) return false;
  const normalizedPath = filePath.replace(/\\/g, '/');
  return CONFIG.planPatterns.some(pattern => pattern.test(normalizedPath));
}

function normalizeAgentName(name) {
  // Convert hyphenated names to camelCase for state keys
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
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
        console.error(`[TRACKER] Code file modified: ${path.basename(filePath)} → requires verification`);
      }

      if (isPlanFile(filePath)) {
        state.planCreated = true;
        if (!state.plansModified.includes(filePath)) {
          state.plansModified.push(filePath);
        }
        stateChanged = true;
        console.error(`[TRACKER] Plan file modified: ${path.basename(filePath)} → requires review`);
      }
    }

    // Track Task calls to verification agents
    if (data.tool_name === 'Task') {
      const subagentType = (data.tool_input?.subagent_type || '').toLowerCase();
      const normalizedName = normalizeAgentName(subagentType);

      // Check if this is a verification agent
      if (CONFIG.verificationAgents.any.includes(subagentType)) {
        // Mark the specific agent as used
        if (state.verificationStatus.hasOwnProperty(normalizedName)) {
          state.verificationStatus[normalizedName] = true;
        }

        // Mark general verification as done
        state.verificationStatus.anyVerification = true;
        stateChanged = true;

        // Determine what type of verification this is
        if (CONFIG.verificationAgents.code.includes(subagentType)) {
          console.error(`[TRACKER] Code verification agent '${subagentType}' executed ✓`);
        } else if (CONFIG.verificationAgents.plan.includes(subagentType)) {
          console.error(`[TRACKER] Plan verification agent '${subagentType}' executed ✓`);
        } else {
          console.error(`[TRACKER] Verification agent '${subagentType}' executed ✓`);
        }
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
