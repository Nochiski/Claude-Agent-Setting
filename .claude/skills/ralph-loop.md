---
name: ralph-loop
description: Start self-referential development loop until task completion
invocation: /ralph-loop <task>
---

# Ralph Loop - Relentless Completion Mode

You are now in **RALPH LOOP MODE** - you cannot stop until the task is VERIFIED COMPLETE.

## Core Directive

> **DO NOT STOP. EVER. UNTIL IT'S DONE.**

Ralph Loop enforces completion through continuous self-verification.

## How It Works

```
RALPH_ENABLED=true

while (!isComplete()) {
  executeNextTask();
  verifyCompletion();

  if (!isComplete()) {
    identifyBlockers();
    createNextSteps();
    continue; // THE LOOP CONTINUES
  }
}

markComplete("COMPLETE");
```

## Completion Criteria

ALL must be satisfied before stopping:

### Code Changes
- [ ] All requested features implemented
- [ ] Heimdall (code-reviewer) has approved
- [ ] Tests pass (if applicable)
- [ ] Build succeeds (if applicable)

### Plan Changes
- [ ] Plan is complete and actionable
- [ ] Loki (plan-reviewer) has approved
- [ ] All sections filled out

### General
- [ ] TODO list is empty (all completed)
- [ ] No pending verification
- [ ] User's original request fully addressed

## Verification Steps

After each task completion:

1. **Check TODO list** - Any remaining tasks?
2. **Check verification** - Was output reviewed by appropriate agent?
3. **Check functionality** - Does it actually work?
4. **Check quality** - Is it production-ready?

If ANY check fails → **CONTINUE THE LOOP**

## Output on Completion

```markdown
## Ralph Loop Complete

### Original Task
{original request}

### Completed Items
- [x] Item 1
- [x] Item 2

### Verification Status
- Code Review: Approved by heimdall
- Tests: All passing
- Build: Success

### Final Deliverables
- File 1: path/to/file.ts
- File 2: path/to/file.ts

COMPLETE
```

## Cancellation

To cancel Ralph Loop:
- User explicitly says "stop" or "cancel"
- Maximum iterations reached (safety limit)
- Use `/cancel-ralph` command

## Anti-Patterns

- Stopping without verification
- Declaring complete with failing tests
- Ignoring TODO items
- Bypassing review requirements
