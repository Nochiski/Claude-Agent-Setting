# Agent Orchestration Rules

You have access to specialized subagents. **Automatically delegate** tasks to the appropriate agent.

## Available Subagents

| Agent | Use When |
|-------|----------|
| `oracle` | Architecture decisions, tech stack choices, complex design reviews, strategic planning |
| `explore` | Quick codebase navigation, file discovery, pattern search (READ-ONLY, fast) |
| `code-reviewer` | Code review requests, PR reviews, security audits, bug hunting |
| `planner` | Implementation planning, task breakdown, project scoping |
| `frontend-designer` | UI implementation, Figma-to-code, component creation |
| `librarian` | Documentation lookup, API research, finding code examples |
| `debugger` | Bug analysis, error tracking, log interpretation, stack trace analysis |
| `formatter` | Code formatting, style fixes, import organization, lint fixes |
| `test-writer` | Test code writing (unit, integration, e2e), TDD, coverage improvement |
| `refactorer` | Code refactoring, structure improvement, pattern application |

## Auto-Delegation Rules

### Use `oracle` when:
- User asks about architecture or system design
- Evaluating technology choices
- Large-scale refactoring decisions
- "Is this good design?", "Which approach is better?"

### Use `explore` when:
- Need to find files quickly
- Searching for patterns in codebase
- Understanding project structure
- "Where is X implemented?", "Find files related to Y"

### Use `code-reviewer` when:
- User asks to review code or PR
- Looking for bugs or security issues
- Code quality assessment
- "Review this code", "Check for bugs"

### Use `planner` when:
- User describes a feature to implement
- Breaking down complex tasks
- "How to implement this?", "Make a plan"

### Use `frontend-designer` when:
- UI/UX implementation tasks
- Figma links are provided
- Component styling work
- "Implement this design", "Create component"

### Use `librarian` when:
- Need to research documentation
- Finding implementation examples
- API usage questions
- Project structure analysis
- "How to use this library?", "Find examples"

### Use `debugger` when:
- Error messages or stack traces appear
- User reports a bug or unexpected behavior
- Log analysis needed
- "Why this error?", "Find this bug", "Analyze logs"

### Use `formatter` when:
- Code needs formatting or style fixes
- Import organization needed
- Lint errors to fix
- "Clean up code", "Format", "Organize imports"

### Use `test-writer` when:
- Test code needs to be written
- TDD approach requested
- Test coverage improvement needed
- "Write tests", "Add tests", "Improve coverage"

### Use `refactorer` when:
- Code refactoring requested
- Code structure improvement needed
- Duplicate code removal
- "Refactor", "Improve code", "Remove duplicates"

## Role Disambiguation

Criteria for choosing between similar agents:

### Bug-related: `code-reviewer` vs `debugger`
| Situation | Choice |
|-----------|--------|
| Error message/stack trace present | `debugger` |
| Runtime error, "why not working?" | `debugger` |
| PR review, code quality check | `code-reviewer` |
| "Check for bugs" (preventive) | `code-reviewer` |

### Code analysis: `librarian` vs `code-reviewer`
| Situation | Choice |
|-----------|--------|
| Project structure/file navigation | `librarian` |
| External library documentation | `librarian` |
| Specific code quality/bug review | `code-reviewer` |
| Security vulnerability analysis | `code-reviewer` |

### Code modification: `formatter` vs `refactorer`
| Situation | Choice |
|-----------|--------|
| Indentation, style, import cleanup | `formatter` |
| Lint error fixes | `formatter` |
| Structure changes, pattern application | `refactorer` |
| Duplicate removal, function extraction | `refactorer` |

## Delegation Pattern

When delegating, use the Task tool with the appropriate subagent:

```
Task(subagent_type="oracle", prompt="Review this architecture...")
Task(subagent_type="code-reviewer", prompt="Review this code for bugs...")
```

## Parallel Execution

Run independent tasks with multiple subagents in parallel for efficiency.

### Parallelizable Combinations
| Combination | Use Scenario |
|-------------|--------------|
| `code-reviewer` + `test-writer` | Review code while writing tests |
| `oracle` + `librarian` | Architecture review + documentation research |
| `planner` + `librarian` | Implementation plan + technical research |
| `debugger` + `librarian` | Bug analysis + related doc search |
| `formatter` + `test-writer` | Code cleanup + add tests |

### Sequential Execution Required
| Order | Reason |
|-------|--------|
| `planner` → `frontend-designer` | Implement after plan complete |
| `code-reviewer` → `refactorer` | Refactor based on review results |
| `debugger` → `test-writer` | Write regression tests after bug fix |

### Usage Example
```
# Parallel execution (multiple Task calls at once)
Task(subagent_type="code-reviewer", prompt="...")
Task(subagent_type="test-writer", prompt="...")

# Sequential execution (wait for result, then next)
result = Task(subagent_type="planner", prompt="...")
Task(subagent_type="frontend-designer", prompt=f"Based on plan: {result}...")
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
- Source: [link]
```

## Version Impact Rule

**Assess and present version impact for all code change suggestions:**

### Criteria
| Change Type | Version | Example |
|-------------|---------|---------|
| Bug fix, internal refactoring | patch (0.0.1) | Logic fix, performance |
| New feature, API/option addition | minor (0.1.0) | New endpoint |
| Breaking change | major (1.0.0) | API removal, signature change |

### Output Format
```markdown
### Version Impact
- Recommended: patch/minor/major (0.0.1)
- Reason: [Justification]

### CHANGELOG Entry (for API/behavior/config changes)
- Added/Changed/Fixed/Removed: [Description]
```

### Rules
- If project has version files (pyproject.toml, package.json, etc.), follow that approach
- CHANGELOG update suggestion required for API/behavior/config changes

## Subagent Result Trust Rules

### Core Principle
**Trust subagent results and do not redo the same work.**

### Trust Criteria
| Subagent Response | Main Agent Action |
|-------------------|-------------------|
| "Re-verification: Not needed" | Use result as-is, no re-search |
| "Confidence: Certain" | Adopt result without additional checks |
| "Confidence: Partially certain" | Additional questions only if needed |
| "Confidence: Needs verification" | Re-verification allowed |

### Prohibited Actions
- Re-searching files librarian already explored
- Re-reading code that code-reviewer already reviewed
- Ignoring subagent results and starting from scratch
- Repeating same work "for verification"

### Required Actions (MUST do)
- **Summarize and present subagent results to user** - 서브에이전트 결과는 반드시 사용자에게 요약 전달
- 핵심 발견사항, 액션 아이템, 파일 참조를 포함하여 정리

### Result Presentation Format
서브에이전트 결과 수신 후 오케스트레이터가 제시할 형식:
```markdown
## [Subagent Type] Results Summary

### Key Findings
- [주요 발견사항 bullet points]

### Action Items (if any)
- [ ] 항목 1
- [ ] 항목 2

### Details
[핵심 정보만 압축하여 전달]
```

### Optional Actions
- Proceeding to next step based on results
- Delegating to **different** subagent for additional info
- Re-searching only when user explicitly requests

### Handling Uncertainty
When subagent results seem insufficient:
1. Re-delegate to same subagent with **specific additional questions**
2. Do not redo work directly
3. Example: `Task(subagent_type="librarian", prompt="Previous search didn't find X, please also check path Y")`

## Important

- Delegate proactively without being asked
- Use subagents for their specialized expertise
- Main agent coordinates, subagents execute
- **Trust subagent results - do not redo their work**

