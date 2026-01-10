# Claude Code Agents

Automatic setup tool for Claude Code subagents.

Applies **8 subagents**, **MCP servers**, and **15 automation hooks** to your local Claude Code environment.

[한국어 README](./README.ko.md)

## Quick Install

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/claude_agents.git
cd claude_agents

# Windows (PowerShell)
.\install.ps1

# Linux / macOS
bash install.sh
```

The install script will:
- Create `~/.claude/` directory
- Backup existing `settings.json`
- Copy agents, hooks, skills, and MCP configuration

## Subagents (8)

| Agent | Model | Role |
|-------|-------|------|
| **oracle** | Opus | Architecture design, strategic advice, technical decisions |
| **explore** | Haiku | Fast codebase exploration (READ-ONLY) |
| **code-reviewer** | Sonnet | Code review, bug/security review |
| **frontend-designer** | Sonnet | Figma → code conversion |
| **librarian** | Sonnet | Documentation search, research, project structure analysis |
| **debugger** | Sonnet | Bug analysis, error tracking, log interpretation |
| **test-writer** | Sonnet | Test code writing (unit, integration, e2e) |
| **refactorer** | Sonnet | Code refactoring, structure improvement |

### Usage Examples
```
"Ask oracle to review this architecture"
"Review this PR with code-reviewer"
"Write tests with test-writer"
"Analyze this error with debugger"
```

### Role Selection Guide

| Situation | Choice |
|-----------|--------|
| Error message/stack trace present | `debugger` |
| PR review, code quality check | `code-reviewer` |
| Project structure/file exploration | `librarian` |
| Structure changes, pattern application | `refactorer` |

See [agents.md](./agents.md) for details.

## MCP Servers (4)

| MCP | Purpose | Authentication |
|-----|---------|----------------|
| **Context7** | Latest library documentation lookup | Not required |
| **Figma** | Figma design data retrieval | `FIGMA_API_KEY` required |
| **GitHub** | Repository, issue, PR access | `gh auth login` or PAT |
| **ast-grep** | AST-based structural code search | Not required |

### GitHub MCP Setup (Recommended: OAuth)
```bash
# OAuth login with gh CLI
gh auth login

# Set token as environment variable
export GITHUB_PERSONAL_ACCESS_TOKEN=$(gh auth token)
```

### Figma MCP Setup
```bash
export FIGMA_API_KEY="your-figma-api-key"
```

### ast-grep MCP Setup
```bash
# Install ast-grep CLI
brew install ast-grep  # macOS
cargo install ast-grep # or via Rust

# Install uv (for MCP server)
brew install uv  # macOS
pip install uv   # or via pip
```

**Features:**
- AST-based code pattern matching (more accurate than text search)
- Pre-defined security rules (XSS, SQL injection, eval, secrets)
- Pre-defined quality rules (console.log, any type, unhandled promises)
- Used by `code-reviewer` and `debugger` agents

See [.claude/ast-grep/README.md](./.claude/ast-grep/README.md) for rules documentation.

## Hooks (15)

| Hook | Event | Function |
|------|-------|----------|
| `rules-injector.js` | UserPromptSubmit | **Auto-inject README + project rules** |
| `pre-commit-test.js` | PreToolUse | Run tests before commit |
| `auto-format.js` | PostToolUse | Auto-format code |
| `readme-reminder.js` | PostToolUse | README update reminder |
| `edit-error-recovery.js` | PostToolUse | Edit error recovery hints |
| `empty-task-response-detector.js` | PostToolUse | Detect empty subagent responses |
| `context-window-monitor.js` | PostToolUse | Context usage monitoring |
| `agent-usage-reminder.js` | PostToolUse | Agent delegation reminder |
| `agent-usage-logger-pre.js` | PreToolUse | **Track agent start time** |
| `agent-usage-logger.js` | PostToolUse | **Log agent usage with duration** |
| `pipeline-tracker.js` | PostToolUse | **Track code modifications for pipeline** |
| `pipeline-enforcer.js` | Stop | **Block exit if pipeline incomplete** |
| `stop-verify.js` | Stop | Verification on session end |
| `ralph-loop.js` | Stop | **Auto-loop execution (Ralph Wiggum)** |
| `comment-checker.js` | PostToolUse | Prevent excessive comments |

### Pipeline Enforcement
`pipeline-tracker.js` + `pipeline-enforcer.js` enforce the mandatory code review pipeline.

When you modify code files (.js, .ts, .py, etc.), the hooks track this and require you to run:
1. `code-reviewer` - Review for bugs/security
2. `test-writer` - Verify/write tests

Session termination is blocked until all pipeline steps are complete.

### Agent Usage Logging
`agent-usage-logger-pre.js` + `agent-usage-logger.js` track all subagent invocations for usage analysis.

**Log files** (in `~/.claude/`):
- `agent-usage.log` - Simple log with timestamp, agent, duration
- `agent-usage-stats.json` - Aggregated statistics (call count, avg duration)
- `agent-usage-detailed.jsonl` - Full prompt history for analysis

```bash
# Skip pipeline enforcement (not recommended)
set PIPELINE_SKIP=true
```

### Ralph Loop (Auto-Loop Execution)
`ralph-loop.js` blocks session termination until todos are complete, automatically continuing work.

```bash
# Enable with environment variables
set RALPH_ENABLED=true           # Enable feature
set RALPH_MAX_ITERATIONS=20      # Maximum iterations
```

**Completion condition**: Auto-terminates when all TodoWrite items reach `completed` status.

### README Auto-Injection
`rules-injector.js` automatically injects the project's `README.md` into context on prompt submission.

See [hooks/README.md](./hooks/README.md) for details.

## Project Rules (Cursor Compatible)

Place rule files at project root for automatic context injection:

```bash
# Supported files (priority order)
README.md          # Project description (auto-injected)
CLAUDE.md          # Claude rules
.claude/rules.md
.cursorrules       # Cursor compatible
.cursor/rules.md
```

Template: [templates/CLAUDE.md](./templates/CLAUDE.md)

## Recommended Workflow

```
[Plan mode] → Discuss plan → [Auto-accept] → 1-shot completion
```

1. **Enter Plan mode**: `Shift+Tab` twice
2. **Discuss plan**: Analyze requirements, define change scope
3. **Switch to execution mode**: `Shift+Tab` once (Auto-accept)
4. **1-shot execution**: Good plan = complete in one go

## Project Structure

```
claude_agents/
├── .claude/
│   ├── settings.local.json   # Claude Code settings (MCP, hooks)
│   ├── CLAUDE.md             # Agent orchestration rules
│   ├── agents/               # Subagent definitions (8)
│   │   ├── oracle.md
│   │   ├── explore.md
│   │   ├── code-reviewer.md
│   │   ├── frontend-designer.md
│   │   ├── librarian.md
│   │   ├── debugger.md
│   │   ├── test-writer.md
│   │   └── refactorer.md
│   └── ast-grep/             # AST-based code analysis rules
│       ├── sgconfig.yaml
│       └── rules/
│           ├── security/     # XSS, SQL injection, eval, etc.
│           └── quality/      # console.log, any type, etc.
├── hooks/                    # Event-based hooks
├── skills/                   # Slash commands
├── mcp/
│   └── mcp.json              # MCP server configuration
├── templates/
│   └── CLAUDE.md             # Project rules template
├── agents.md                 # Subagent detailed docs
├── install.ps1               # Windows install
└── install.sh                # Unix install
```

## Manual Installation

```bash
# Copy settings file
cp .claude/settings.local.json ~/.claude/settings.json

# Copy agents
cp -r .claude/agents/* ~/.claude/agents/

# Copy CLAUDE.md
cp .claude/CLAUDE.md ~/.claude/CLAUDE.md

# Copy hooks
cp -r hooks/* ~/.claude/hooks/

# Copy skills
cp -r skills/* ~/.claude/skills/
```

## References

- [Claude Code Subagents Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Context7 MCP](https://github.com/upstash/context7)
- [Figma MCP](https://github.com/GLips/Figma-Context-MCP)
- [GitHub MCP](https://github.com/modelcontextprotocol/servers)
- [ast-grep](https://ast-grep.github.io/)
- [ast-grep MCP](https://github.com/ast-grep/ast-grep-mcp)
