#!/usr/bin/env node
/**
 * README Reminder Hook
 * Checks if README update is needed after code changes
 *
 * Trigger conditions:
 * - New file creation
 * - API endpoint changes
 * - Configuration file changes
 * - Major feature additions/changes
 */

const path = require('path');
const readline = require('readline');

// File patterns that may require README update
const SIGNIFICANT_PATTERNS = [
  /^src\/api\//,           // API changes
  /^src\/routes\//,        // Route changes
  /^config\//,             // Config changes
  /package\.json$/,        // Dependency changes
  /\.env\.example$/,       // Environment variable changes
  /Dockerfile$/,           // Docker config
  /docker-compose/,        // Docker Compose
  /\.github\/workflows/,   // CI/CD changes
  /schema/,                // Schema changes
  /migration/,             // DB migrations
];

// Keywords indicating new feature addition
const NEW_FEATURE_KEYWORDS = [
  'new feature',
  'add endpoint',
  'create api',
  'implement',
];

function shouldRemind(filePath, toolInput) {
  // Pattern matching
  const relativePath = filePath.replace(/\\/g, '/');
  for (const pattern of SIGNIFICANT_PATTERNS) {
    if (pattern.test(relativePath)) {
      return true;
    }
  }

  // Detect new file creation (Write tool)
  if (toolInput && !toolInput.old_string && toolInput.content) {
    return true;
  }

  return false;
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

    // Only process Edit or Write tools
    if (data.tool_name === 'Edit' || data.tool_name === 'Write') {
      const filePath = data.tool_input?.file_path || '';

      // Ignore README itself
      if (filePath.toLowerCase().includes('readme')) {
        console.log(JSON.stringify(data));
        return;
      }

      if (shouldRemind(filePath, data.tool_input)) {
        // Add reminder to result
        if (data.tool_result) {
          data.tool_result += '\n\n<readme-reminder>This change may need to be reflected in README.md. Update README if there are new features, API changes, or config changes.</readme-reminder>';
        }
      }
    }

    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Hook error:', e.message);
    process.exit(1);
  }
}

main();
