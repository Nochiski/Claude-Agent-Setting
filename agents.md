# Claude Code Subagents

Custom subagent definitions in the `.claude/agents/` folder.

[한국어 문서](./agents.ko.md)

## Subagent List

| Agent | Model | Role | Tools |
|-------|-------|------|-------|
| **oracle** | Opus | Architecture, strategy, technical decisions | Read, Glob, Grep, WebSearch, WebFetch |
| **code-reviewer** | Sonnet | Code review, bug/security review | Read, Glob, Grep, Bash |
| **planner** | Opus | Implementation planning, task breakdown | Read, Glob, Grep, WebSearch |
| **frontend-designer** | Sonnet | Figma → code conversion | Read, Edit, Write, Bash, Figma MCP |
| **librarian** | Sonnet | Documentation search, research | Read, Glob, Grep, WebSearch, WebFetch, Context7 MCP |
| **debugger** | Sonnet | Bug analysis, error tracking, log interpretation | Read, Glob, Grep, Bash, LSP, Edit |
| **formatter** | Haiku | Code formatting, style cleanup, linting | Read, Edit, Glob, Grep, Bash |
| **test-writer** | Sonnet | Test code writing (unit, integration, e2e) | Read, Glob, Grep, Edit, Write, Bash |
| **refactorer** | Sonnet | Code refactoring, structure improvement | Read, Glob, Grep, Edit, Write, Bash, LSP |

## Subagent File Structure

```yaml
---
name: agent-name
description: Agent description
model: opus | sonnet | haiku
tools:
  - Read
  - Glob
  - Grep
  - mcp__context7  # MCP tools
---

# System Prompt

Agent role and behavior guidelines...
```

## Usage

### 1. Call via Task Tool (Automatic)
Claude automatically calls appropriate subagents when needed.

### 2. Explicit Request
```
"Ask oracle to review this architecture"
"Review this PR with code-reviewer"
"Create implementation plan with planner"
```

### 3. Parallel Execution
Subagents run independently, enabling parallel processing.

## Subagents vs Skills

| | Subagents | Skills |
|---|-----------|--------|
| **Execution** | Separate process | Same context |
| **Context** | Independent (isolated) | Shared |
| **Use case** | Parallel work, expert analysis | Prompt templates |
| **Location** | `.claude/agents/` | `.claude/commands/` |

## Adding Custom Subagents

1. Create markdown file in `.claude/agents/`
2. Define settings with YAML frontmatter
3. Write system prompt in body
4. Restart Claude Code

## Model Selection Guide

| Model | Use Case | Cost |
|-------|----------|------|
| **opus** | Complex reasoning, architecture decisions | High |
| **sonnet** | General tasks, code review | Medium |
| **haiku** | Fast exploration, simple tasks | Low |

## MCP Dependencies

Some agents depend on MCP (Model Context Protocol) servers.

### Dependency List

| Agent | MCP | Purpose | Required |
|-------|-----|---------|----------|
| **frontend-designer** | figma | Figma design data retrieval | Optional (manual input without) |
| **librarian** | context7 | Latest library docs lookup | Optional (uses WebSearch without) |
| **code-reviewer** | github | GitHub PR/issue access | Optional (gh CLI alternative) |

### MCP Installation

1. Copy `mcp/mcp.json` to `~/.claude/` or project `.claude/`
2. Set environment variables (if needed):
   ```bash
   # For Figma MCP
   export FIGMA_ACCESS_TOKEN="your-figma-token"

   # For GitHub MCP (Method 1: gh CLI OAuth - Recommended)
   gh auth login
   export GITHUB_PERSONAL_ACCESS_TOKEN=$(gh auth token)

   # For GitHub MCP (Method 2: Direct PAT)
   export GITHUB_PERSONAL_ACCESS_TOKEN="your-github-token"
   ```
3. Restart Claude Code

### Using Without MCP

Agents work without MCP installed:
- **frontend-designer**: Provide design spec as text instead of Figma URL
- **librarian**: Search docs with WebSearch/WebFetch

## References

- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents)
- [awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
