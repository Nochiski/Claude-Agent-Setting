#!/usr/bin/env node
/**
 * Keyword Detector Hook
 * Detects magic keywords in user prompts and injects mode-specific instructions
 *
 * Supported modes:
 * - ultrawork/ulw: Parallel agent orchestration mode
 * - search/find: Enhanced search mode
 * - analyze/debug: Deep analysis mode
 * - think/reason: Extended reasoning mode
 * - plan: Strategic planning mode
 * - review: Critical review mode
 */

const readline = require('readline');

// Mode configurations with keywords and injections
const MODES = {
  ultrawork: {
    keywords: ['ultrawork', 'ulw', '울트라워크', '병렬'],
    priority: 1,
    injection: `
<mode-activation>
[ULTRAWORK MODE ACTIVATED]

You are now operating in ULTRAWORK mode - maximum performance parallel orchestration.

DIRECTIVES:
1. PARALLEL EVERYTHING - Launch multiple agents simultaneously, never wait when you can parallelize
2. DELEGATE AGGRESSIVELY - Route tasks to specialist agents immediately
3. BACKGROUND LONG OPERATIONS - Use run_in_background for builds, tests, installations
4. NEVER WORK ALONE - Always use Task tool to delegate to specialized agents

REQUIRED BEHAVIOR:
- Fire 3+ search tools simultaneously when exploring
- Launch multiple Task agents in parallel for independent subtasks
- Background all npm install, builds, tests
- Complete ALL tasks before stopping - the boulder never stops

Available specialists: odin (strategy), huginn (explore), heimdall (review), mimir (docs), forseti (debug), freya (UI), tyr (tests), baldur (refactor)
</mode-activation>
`
  },

  search: {
    keywords: ['search', 'find', 'locate', '검색', '찾아', 'where is', 'where are'],
    priority: 2,
    injection: `
<mode-activation>
[SEARCH MODE ACTIVATED]

Enhanced parallel search mode enabled.

DIRECTIVES:
1. Launch 3+ search tools simultaneously (Glob + Grep + Task explore)
2. Use multiple patterns in parallel - don't wait for one search to complete
3. Delegate to 'huginn' (explore agent) for comprehensive codebase navigation
4. Return results with file paths and line numbers
</mode-activation>
`
  },

  analyze: {
    keywords: ['analyze', 'investigate', 'debug', '분석', '디버그', 'why', 'root cause'],
    priority: 2,
    injection: `
<mode-activation>
[ANALYZE MODE ACTIVATED]

Deep analysis mode enabled.

DIRECTIVES:
1. Gather comprehensive context before forming conclusions
2. Delegate to 'odin' (oracle) for complex architectural analysis
3. Delegate to 'forseti' (debugger) for error tracking and bug analysis
4. Use systematic investigation - don't jump to conclusions
5. Verify hypotheses with evidence from the codebase
</mode-activation>
`
  },

  think: {
    keywords: ['think', 'reason', 'consider', '생각', '고려', 'carefully'],
    priority: 3,
    injection: `
<mode-activation>
[EXTENDED THINKING MODE ACTIVATED]

Taking time for deeper reasoning.

DIRECTIVES:
1. Consider multiple perspectives before answering
2. Evaluate trade-offs explicitly
3. Think through edge cases and potential issues
4. Provide reasoning chain, not just conclusions
</mode-activation>
`
  },

  plan: {
    keywords: ['plan', 'roadmap', 'strategy', '계획', '로드맵', '전략'],
    priority: 2,
    injection: `
<mode-activation>
[PLANNING MODE ACTIVATED]

Strategic planning mode enabled.

DIRECTIVES:
1. Delegate to 'norns' (planning agent) for comprehensive project planning
2. Break down complex tasks into actionable steps
3. Consider dependencies and sequencing
4. All plans must be reviewed by 'loki' (plan reviewer) before execution
</mode-activation>
`
  },

  review: {
    keywords: ['review', 'check', 'verify', '검토', '확인', '리뷰'],
    priority: 2,
    injection: `
<mode-activation>
[REVIEW MODE ACTIVATED]

Critical review mode enabled.

DIRECTIVES:
1. For code review: Delegate to 'heimdall' (code-reviewer)
2. For plan review: Delegate to 'loki' (plan-reviewer)
3. Look for potential issues, security vulnerabilities, and improvements
4. Provide constructive feedback with specific suggestions
</mode-activation>
`
  }
};

function detectModes(prompt) {
  const detectedModes = [];
  const lowerPrompt = prompt.toLowerCase();

  // Remove code blocks to avoid false positives
  const cleanPrompt = lowerPrompt.replace(/```[\s\S]*?```/g, '');

  for (const [modeName, config] of Object.entries(MODES)) {
    for (const keyword of config.keywords) {
      if (cleanPrompt.includes(keyword.toLowerCase())) {
        detectedModes.push({
          name: modeName,
          keyword,
          priority: config.priority,
          injection: config.injection
        });
        break; // One match per mode is enough
      }
    }
  }

  // Sort by priority (lower number = higher priority)
  detectedModes.sort((a, b) => a.priority - b.priority);

  return detectedModes;
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
    const prompt = data.user_prompt || '';

    // Detect modes from prompt
    const detectedModes = detectModes(prompt);

    if (detectedModes.length > 0) {
      // Build injection string (use highest priority mode's injection)
      const primaryMode = detectedModes[0];
      const modeNames = detectedModes.map(m => m.name).join(', ');

      console.error(`[KEYWORD] Detected modes: ${modeNames}`);

      // Inject mode instructions before the prompt
      const injection = primaryMode.injection;
      data.user_prompt = injection + '\n\n' + prompt;
    }

    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
