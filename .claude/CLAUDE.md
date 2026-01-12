# Agent Orchestration Rules

You have access to specialized subagents. **Automatically delegate** tasks to the appropriate agent.

## Core Philosophy: Self-Verification Pipeline

> **"모든 출력물은 다른 에이전트의 검증을 거쳐야 한다"**
>
> 코드든 계획이든, 한 에이전트가 만든 결과물은 반드시 다른 에이전트가 검증합니다.

| 출력물 유형 | 검증 에이전트 | 검증 내용 |
|------------|--------------|----------|
| 코드 수정 | `heimdall` | 코드 품질, 버그, 보안 취약점 |
| 계획 수립 | `loki` | 완전성, 실현 가능성, 리스크 |

## Available Subagents (Norse Mythology)

| Agent | Alias | Use When |
|-------|-------|----------|
| `odin` | oracle | Architecture decisions, tech stack choices, strategic planning |
| `huginn` | explore | Quick codebase navigation, file discovery, pattern search (READ-ONLY) |
| `heimdall` | code-reviewer | Code review, PR reviews, security audits, bug hunting |
| `freya` | frontend-designer | UI implementation, Figma-to-code, component creation |
| `mimir` | librarian | Documentation lookup, API research, finding code examples |
| `forseti` | debugger | Bug analysis, error tracking, log interpretation |
| `tyr` | test-writer | Test code writing (unit, integration, e2e), TDD |
| `baldur` | refactorer | Code refactoring, structure improvement |
| `loki` | plan-reviewer | Plan review, critical analysis, risk detection |

### Alias Compatibility

Both Norse names and legacy aliases work:
```
Task(subagent_type="heimdall", ...)  # Norse name (preferred)
Task(subagent_type="code-reviewer", ...)  # Legacy alias (supported)
```

## Auto-Delegation Rules

### Use `odin` when:
- User asks about architecture or system design
- Evaluating technology choices
- Large-scale refactoring decisions
- "Is this good design?", "Which approach is better?"

### Use `huginn` when:
- Need to find files quickly
- Searching for patterns in codebase
- Understanding project structure
- "Where is X implemented?", "Find files related to Y"

### Use `heimdall` when:
- User asks to review code or PR
- Looking for bugs or security issues
- Code quality assessment
- **After code changes** (self-verification)
- "Review this code", "Check for bugs"

### Use `freya` when:
- UI/UX implementation tasks
- Figma links are provided
- Component styling work
- "Implement this design", "Create component"

### Use `mimir` when:
- Need to research documentation
- Finding implementation examples
- API usage questions
- "How to use this library?", "Find examples"

### Use `forseti` when:
- Error messages or stack traces appear
- User reports a bug or unexpected behavior
- Log analysis needed
- "Why this error?", "Find this bug", "Analyze logs"

### Use `tyr` when:
- Test code needs to be written
- TDD approach requested
- Test coverage improvement needed
- "Write tests", "Add tests", "Improve coverage"

### Use `baldur` when:
- Code refactoring requested
- Code structure improvement needed
- Duplicate code removal
- "Refactor", "Improve code", "Remove duplicates"

### Use `loki` when:
- Plan review requested
- Critical analysis of proposals
- Risk assessment needed
- **After plan creation** (self-verification)
- "Review this plan", "What could go wrong?"

## Role Disambiguation

### Bug-related: `heimdall` vs `forseti`
| Situation | Choice |
|-----------|--------|
| Error message/stack trace present | `forseti` |
| Runtime error, "why not working?" | `forseti` |
| PR review, code quality check | `heimdall` |
| "Check for bugs" (preventive) | `heimdall` |

### Code analysis: `mimir` vs `heimdall`
| Situation | Choice |
|-----------|--------|
| Project structure/file navigation | `mimir` |
| External library documentation | `mimir` |
| Specific code quality/bug review | `heimdall` |
| Security vulnerability analysis | `heimdall` |

### Strategic: `odin` vs `loki`
| Situation | Choice |
|-----------|--------|
| Create architecture/plan | `odin` |
| Review existing plan | `loki` |
| "What should we do?" | `odin` |
| "What's wrong with this plan?" | `loki` |

## Self-Verification Workflow

### Code Changes
```
1. Write/Edit code
2. Delegate to heimdall for review
3. Fix issues found
4. Proceed only after heimdall approval
```

### Plan Creation
```
1. Create plan (or delegate to odin)
2. Delegate to loki for review
3. Address concerns raised
4. Execute only after loki approval
```

## Parallel Execution

### Parallelizable Combinations
| Combination | Use Scenario |
|-------------|--------------|
| `heimdall` + `tyr` | Review code while writing tests |
| `odin` + `mimir` | Architecture review + documentation research |
| `forseti` + `mimir` | Bug analysis + related doc search |

### Sequential Execution Required
| Order | Reason |
|-------|--------|
| Code → `heimdall` | Verify before proceeding |
| Plan → `loki` | Validate before execution |
| `heimdall` → `baldur` | Refactor based on review |
| `forseti` → `tyr` | Write regression tests after bug fix |

## Delegation Pattern

```
# Using Norse names (preferred)
Task(subagent_type="odin", prompt="Review this architecture...")
Task(subagent_type="heimdall", prompt="Review this code for bugs...")

# Using legacy aliases (supported)
Task(subagent_type="oracle", prompt="Review this architecture...")
Task(subagent_type="code-reviewer", prompt="Review this code...")
```

## Output Format Guide

All subagents follow this common structure:

```markdown
## [Agent Name] Results

### Summary
[1-2 line core content]

### Details
[Main content - agent-specific format]

### Action Items (if applicable)
- [ ] Item 1
- [ ] Item 2

### References (if applicable)
- Related file: `path/to/file.ts:123`
```

## Subagent Result Trust Rules

### Core Principle
**Trust subagent results and do not redo the same work.**

### Trust Criteria
| Subagent Response | Main Agent Action |
|-------------------|-------------------|
| "Re-verification: Not needed" | Use result as-is |
| "Confidence: Certain" | Adopt without additional checks |
| "Confidence: Partially certain" | Additional questions if needed |
| "Confidence: Needs verification" | Re-verification allowed |

### Required Actions
- **Summarize and present subagent results to user**
- Include key findings, action items, file references

### Prohibited Actions
- Re-searching files mimir already explored
- Re-reading code that heimdall already reviewed
- Ignoring subagent results and starting from scratch

## ast-grep for Code Analysis

### When to Use
Use ast-grep MCP tools (`mcp__ast-grep__*`) for:
- Security vulnerability scanning
- Code pattern detection
- Quality checks (console.log, any type, etc.)

### Tool Availability Check
Before using ast-grep tools, check if available:
```
mcp__ast-grep__get_all_rules()
```

### If ast-grep is NOT Available
If `mcp__ast-grep__*` tools fail or are not available, inform the user:

```
╔══════════════════════════════════════════════════════════════════╗
║  ast-grep MCP is not installed                                   ║
║                                                                  ║
║  ast-grep enables AST-based code analysis for:                   ║
║  • Security vulnerability detection                              ║
║  • Code pattern matching                                         ║
║  • Quality rule enforcement                                      ║
║                                                                  ║
║  To install:                                                     ║
║  1. Install ast-grep CLI:                                        ║
║     macOS:   brew install ast-grep                               ║
║     Windows: winget install ast-grep.ast-grep                    ║
║     Rust:    cargo install ast-grep                              ║
║                                                                  ║
║  2. Install uv (for MCP server):                                 ║
║     pip install uv                                               ║
║                                                                  ║
║  3. Restart Claude Code                                          ║
╚══════════════════════════════════════════════════════════════════╝
```

Continue with regular Grep if ast-grep is unavailable.

## Important

- Delegate proactively without being asked
- Use subagents for their specialized expertise
- Main agent coordinates, subagents execute
- **Trust subagent results - do not redo their work**
- **Always verify outputs through self-verification pipeline**
- **Guide users to install ast-grep if not available**
