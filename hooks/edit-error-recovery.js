#!/usr/bin/env node
/**
 * Edit Error Recovery Hook
 * Detects Edit tool errors and provides recovery hints during PostToolUse events
 *
 * Features:
 * - Detects "old_string not found" errors
 * - Provides similar string hints
 * - Detects whitespace/newline issues
 */

const readline = require('readline');
const fs = require('fs');

// 에러 패턴
const ERROR_PATTERNS = {
  notFound: /old_string.*not found|could not find|no match/i,
  notUnique: /not unique|multiple matches|ambiguous/i,
  fileNotExist: /file.*not exist|no such file/i
};

function analyzeEditError(data) {
  const result = data.tool_result || '';
  const oldString = data.tool_input?.old_string || '';
  const filePath = data.tool_input?.file_path || '';

  const issues = [];
  const hints = [];

  // old_string not found error
  if (ERROR_PATTERNS.notFound.test(result)) {
    issues.push('old_string not found in file');

    // Check if file exists
    if (filePath && fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check whitespace issues
        if (oldString.includes('  ') || oldString.includes('\t')) {
          hints.push('old_string contains consecutive spaces or tabs. Check actual file indentation.');
        }

        // Check newline issues
        if (oldString.includes('\r\n') && !content.includes('\r\n')) {
          hints.push('Newline format mismatch: old_string uses CRLF(\\r\\n) but file uses LF(\\n).');
        } else if (oldString.includes('\n') && !oldString.includes('\r\n') && content.includes('\r\n')) {
          hints.push('Newline format mismatch: old_string uses LF(\\n) but file uses CRLF(\\r\\n).');
        }

        // Search for similar strings (based on first line)
        const firstLine = oldString.split(/[\r\n]/)[0].trim();
        if (firstLine.length > 10) {
          const lines = content.split(/\r?\n/);
          const similar = lines.find(line =>
            line.includes(firstLine.substring(0, 20)) ||
            firstLine.includes(line.trim().substring(0, 20))
          );
          if (similar) {
            hints.push(`Similar line found: "${similar.trim().substring(0, 50)}..."`);
          }
        }

        // Case sensitivity issue
        if (content.toLowerCase().includes(oldString.toLowerCase()) &&
            !content.includes(oldString)) {
          hints.push('Case mismatch detected. Use exact case.');
        }

      } catch (e) {
        // Ignore file read failure
      }
    }

    if (hints.length === 0) {
      hints.push('Re-read the file and copy the exact string.');
      hints.push('Ensure indentation and whitespace match exactly.');
    }
  }

  // not unique error
  if (ERROR_PATTERNS.notUnique.test(result)) {
    issues.push('old_string appears multiple times in file');
    hints.push('Include more context (surrounding lines) to make it unique.');
    hints.push('Or use replace_all: true option.');
  }

  // file not exist error
  if (ERROR_PATTERNS.fileNotExist.test(result)) {
    issues.push('File does not exist');
    hints.push('Verify the file path is correct.');
    hints.push('Use Glob tool to find the file location first.');
  }

  return { issues, hints };
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

    // When Edit tool has an error
    if (data.tool_name === 'Edit') {
      const result = data.tool_result || '';
      const hasError = Object.values(ERROR_PATTERNS).some(p => p.test(result));

      if (hasError) {
        const { issues, hints } = analyzeEditError(data);

        if (issues.length > 0 || hints.length > 0) {
          console.error('\n🔧 [EDIT ERROR RECOVERY]');

          if (issues.length > 0) {
            console.error('   Issues:');
            issues.forEach(i => console.error(`   - ${i}`));
          }

          if (hints.length > 0) {
            console.error('   Hints:');
            hints.forEach(h => console.error(`   - ${h}`));
          }

          console.error('');

          // Add hints to tool_result
          data.tool_result = result +
            '\n\n<edit-recovery-hint>\n' +
            hints.map(h => `- ${h}`).join('\n') +
            '\n</edit-recovery-hint>';
        }
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
