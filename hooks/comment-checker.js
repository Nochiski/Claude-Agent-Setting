#!/usr/bin/env node
/**
 * Comment Checker Hook
 * Checks if excessive comments were added after Edit tool usage
 */

const readline = require('readline');

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

    // Check comment ratio in Edit tool's new_string
    if (data.tool_input && data.tool_input.new_string) {
      const content = data.tool_input.new_string;
      const lines = content.split('\n');
      const commentLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('//') ||
               trimmed.startsWith('#') ||
               trimmed.startsWith('*') ||
               trimmed.startsWith('/*');
      });

      const commentRatio = commentLines.length / lines.length;

      if (commentRatio > 0.5 && lines.length > 5) {
        console.error(`Warning: High comment ratio (${(commentRatio * 100).toFixed(1)}%)`);
      }
    }

    // Return data as-is (no blocking)
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
