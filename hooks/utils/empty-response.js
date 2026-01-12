#!/usr/bin/env node
/**
 * Empty Task Response Detector Hook
 * Detects empty responses from Task (subagent) during PostToolUse events
 *
 * Features:
 * - Detects empty responses from Task tool
 * - Provides warning messages and retry hints
 */

const readline = require('readline');

// Patterns considered as empty response
const EMPTY_PATTERNS = [
  /^\s*$/,                           // Whitespace only
  /^(undefined|null)$/i,             // undefined/null
  /^no\s+(result|output|response)/i, // "no result" etc.
  /^error:/i,                        // Starts with error
  /^failed/i                         // Starts with failed
];

function isEmptyResponse(result) {
  if (!result) return true;
  const str = typeof result === 'string' ? result : JSON.stringify(result);
  if (str.length < 10) return true;
  return EMPTY_PATTERNS.some(pattern => pattern.test(str.trim()));
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

    // Only check Task tool
    if (data.tool_name === 'Task') {
      const result = data.tool_result;
      const subagentType = data.tool_input?.subagent_type || 'unknown';

      if (isEmptyResponse(result)) {
        console.error(`\n⚠️  [EMPTY TASK RESPONSE] Subagent '${subagentType}' returned an empty response.`);
        console.error('   Possible causes:');
        console.error('   - Unclear prompt');
        console.error('   - Subagent failed to complete task');
        console.error('   - Timeout or error occurred');
        console.error('   Recommended action: Retry with a more specific prompt.\n');

        // Add warning to tool_result
        data.tool_result = (data.tool_result || '') +
          '\n\n<system-warning>Subagent returned an empty response. Consider retrying with a more specific prompt.</system-warning>';
      }
    }

    // Return data
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
