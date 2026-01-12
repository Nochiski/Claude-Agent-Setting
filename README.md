# Claude Agent Setting

Self-Verification Pipeline & Norse Mythology Agents for Claude Code.

[한국어 README](./README.ko.md)

## Core Philosophy

> **"Every output must be verified by another agent"**
>
> Code or plans - everything created by one agent must be reviewed by another.

| Output Type | Verification Agent | What It Checks |
|-------------|-------------------|----------------|
| Code changes | `heimdall` | Quality, bugs, security |
| Plans | `loki` | Completeness, feasibility, risks |

## Quick Install

```bash
# Clone repository
git clone https://github.com/Nochiski/Claude-Agent-Setting.git
cd Claude-Agent-Setting

# Windows (PowerShell)
.\install.ps1

# Linux / macOS
bash install.sh
```

## What Gets Installed

- **9 Norse Agents**: Specialized subagents named after Norse mythology
- **9 Skills**: Slash commands for different work modes
- **Hooks**: Automation for quality, monitoring, and orchestration
- **MCP Servers**: Context7, Figma, GitHub, ast-grep

## Agents (9) - Norse Mythology Theme

| Agent | Alias | Model | Role |
|-------|-------|-------|------|
| **odin** | oracle | Opus | Architecture, strategy, technical decisions |
| **huginn** | explore | Haiku | Fast codebase exploration (READ-ONLY) |
| **heimdall** | code-reviewer | Sonnet | Code review, security audit |
| **mimir** | librarian | Sonnet | Documentation search, research |
| **forseti** | debugger | Sonnet | Bug analysis, error tracking |
| **freya** | frontend-designer | Sonnet | UI/UX, Figma → code |
| **tyr** | test-writer | Sonnet | Test code writing |
| **baldur** | refactorer | Sonnet | Code refactoring |
| **loki** | plan-reviewer | Opus | Plan review, risk detection |

### Usage
```
"Ask odin to review this architecture"
"Have heimdall review this code"
"Get loki to review this plan"
```

Both Norse names and aliases work:
```
Task(subagent_type="heimdall", ...)  # Norse (preferred)
Task(subagent_type="code-reviewer", ...)  # Alias (supported)
```

## Skills (9)

| Skill | Description |
|-------|-------------|
| `/sisyphus` | Multi-agent orchestration with todo tracking |
| `/ultrawork` | Maximum performance parallel mode |
| `/deepsearch` | Comprehensive codebase search |
| `/ralph-loop` | Relentless completion until verified done |
| `/plan` | Strategic planning session |
| `/review` | Plan review with loki |
| `/orchestrator` | Complex multi-step task coordination |
| `/analyze` | Deep investigation and root cause analysis |
| `/ast-grep` | AST-based code pattern search |

## Hooks

Organized by function in `hooks/` directory:

```
hooks/
├── orchestrator/          # Orchestration
│   ├── keyword-detector.js    # Magic keyword detection (ultrawork, search, etc.)
│   └── stop-orchestrator.js   # Unified stop handler
├── pipeline/              # Self-Verification Pipeline
│   └── tracker.js             # Track code/plan modifications
├── monitoring/            # Monitoring
│   ├── agent-logger.js        # Agent usage logging (UUID-based)
│   └── context-monitor.js     # Context window monitoring
├── quality/               # Quality
│   ├── auto-format.js         # Auto-format after edits
│   ├── pre-commit-test.js     # Test before commit
│   └── edit-recovery.js       # Edit error recovery hints
└── utils/                 # Utilities
    ├── rules-injector.js      # Project rules injection
    ├── readme-reminder.js     # README update reminder
    ├── agent-reminder.js      # Agent delegation reminder
    └── empty-response.js      # Empty response detection
```

### Self-Verification Pipeline

When you modify code, the pipeline tracks it and enforces review:

```
Code written (Edit/Write)
       ↓
[tracker.js] Records modification
       ↓
Session end attempt
       ↓
[stop-orchestrator.js]
  └─ Check if heimdall reviewed → Block if not
       ↓
heimdall reviews code
       ↓
Session end allowed ✅
```

### Keyword Detection

Magic keywords activate special modes:

| Keyword | Mode | Effect |
|---------|------|--------|
| `ultrawork`, `ulw` | Ultrawork | Parallel agent orchestration |
| `search`, `find` | Search | Enhanced parallel search |
| `analyze`, `debug` | Analyze | Deep analysis mode |
| `plan`, `roadmap` | Planning | Strategic planning mode |
| `review`, `check` | Review | Critical review mode |

## MCP Servers

| MCP | Purpose | Setup |
|-----|---------|-------|
| **Context7** | Library documentation | Auto |
| **Figma** | Design data | `FIGMA_API_KEY` |
| **GitHub** | Repo/PR access | `gh auth login` |
| **ast-grep** | AST code search | Install ast-grep CLI |

### ast-grep Setup

```bash
# Install CLI
brew install ast-grep  # macOS
winget install ast-grep.ast-grep  # Windows

# Install uv (for MCP server)
pip install uv
```

## Project Structure

```
Claude-Agent-Setting/
├── .claude/
│   ├── settings.local.json   # Settings (hooks, MCP)
│   ├── CLAUDE.md             # Orchestration rules
│   ├── agents/               # 9 Norse agents
│   │   ├── odin.md
│   │   ├── huginn.md
│   │   ├── heimdall.md
│   │   ├── mimir.md
│   │   ├── forseti.md
│   │   ├── freya.md
│   │   ├── tyr.md
│   │   ├── baldur.md
│   │   └── loki.md
│   ├── skills/               # 9 skills
│   └── ast-grep/             # AST rules
├── hooks/                    # Organized hooks
│   ├── orchestrator/
│   ├── pipeline/
│   ├── monitoring/
│   ├── quality/
│   └── utils/
├── mcp/
│   └── mcp.json
├── install.ps1               # Windows install
└── install.sh                # Unix install
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RALPH_ENABLED` | false | Enable Ralph Loop |
| `RALPH_MAX_ITERATIONS` | 20 | Max iterations |
| `PIPELINE_SKIP` | false | Skip verification pipeline |
| `TEST_STRICT` | false | Block commit on test failure |

## Manual Installation

```bash
# Copy everything to ~/.claude/
cp .claude/settings.local.json ~/.claude/settings.json
cp -r .claude/agents ~/.claude/
cp -r .claude/skills ~/.claude/
cp .claude/CLAUDE.md ~/.claude/
cp -r hooks ~/.claude/
```

## References

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [ast-grep](https://ast-grep.github.io/)
- [MCP Servers](https://github.com/modelcontextprotocol/servers)
