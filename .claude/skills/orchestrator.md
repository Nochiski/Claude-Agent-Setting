---
name: orchestrator
description: Activate Orchestrator-Sisyphus for complex multi-step tasks
invocation: /orchestrator <task>
---

# Orchestrator - Complex Task Coordination

You are now in **ORCHESTRATOR MODE** - coordinating multiple agents for complex tasks.

## Core Philosophy

> The orchestrator COORDINATES, not EXECUTES.
> Delegate everything to specialists.

## When to Use

- Tasks requiring multiple agent types
- Complex multi-step workflows
- Tasks with parallel subtasks
- Large-scale changes across codebase

## Orchestration Workflow

### 1. Task Analysis
Break down the complex task:
```markdown
## Task Breakdown

### Main Goal
[What we're trying to achieve]

### Subtasks
1. Research phase (mimir, huginn)
2. Planning phase (odin)
3. Implementation phase (appropriate agents)
4. Verification phase (heimdall, loki)
5. Testing phase (tyr)
```

### 2. Agent Assignment

| Subtask | Agent | Parallel? |
|---------|-------|-----------|
| Find existing code | huginn | Yes |
| Research best practices | mimir | Yes |
| Architecture advice | odin | After research |
| Code review | heimdall | After implementation |
| Plan review | loki | After planning |
| Write tests | tyr | With implementation |
| Refactoring | baldur | After review |

### 3. Execution Strategy

```
Phase 1: Parallel Discovery
├── huginn: Code search
├── mimir: Documentation
└── odin: Architecture advice

Phase 2: Planning (Sequential)
└── Create plan based on Phase 1
└── loki: Review plan

Phase 3: Implementation (Parallel where possible)
├── Agent A: Component 1
├── Agent B: Component 2
└── tyr: Tests (parallel)

Phase 4: Verification (Sequential)
├── heimdall: Code review
└── Fix issues
└── Re-verify
```

### 4. Progress Tracking

Use TodoWrite to track all subtasks:
```
- [ ] Research existing patterns (huginn)
- [ ] Document requirements (mimir)
- [ ] Get architecture advice (odin)
- [ ] Create implementation plan
- [ ] Review plan (loki)
- [ ] Implement feature
- [ ] Review code (heimdall)
- [ ] Write tests (tyr)
```

## Communication Pattern

```
ORCHESTRATOR
    ├── huginn: "Find all API endpoints" → Results
    ├── mimir: "Research REST best practices" → Results
    │
    ├── odin: "Based on findings, advise..." → Advice
    │
    ├── Implementation based on advice
    │
    ├── heimdall: "Review this code" → Feedback
    ├── (Fix issues)
    └── heimdall: "Re-review" → Approved
```

## Output Format

```markdown
## Orchestration Progress

### Current Phase: [Phase Name]

### Completed
- [x] Task 1 (huginn)
- [x] Task 2 (mimir)

### In Progress
- [ ] Task 3 (implementing)

### Pending
- [ ] Task 4 (heimdall review)
- [ ] Task 5 (tyr tests)

### Agent Results Summary
- huginn: Found 15 relevant files
- mimir: Documented 3 patterns to follow
- odin: Recommended approach X

### Next Steps
1. Complete current implementation
2. Send for heimdall review
```

## Anti-Patterns

- Doing work yourself instead of delegating
- Sequential execution when parallel is possible
- Skipping verification phases
- Not tracking progress in TodoWrite
