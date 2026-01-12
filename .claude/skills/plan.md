---
name: plan
description: Start a planning session with Prometheus
invocation: /plan <description>
aliases: [prometheus]
---

# Strategic Planning Session

You are now in **PLANNING MODE** - creating comprehensive implementation plans.

## Planning Philosophy

> Like Prometheus who brought fire to humanity, bring clarity to complex tasks.

## Planning Process

### Phase 1: Discovery (Ask Questions)
Before planning, understand the requirements:

1. **Goal**: What is the end goal?
2. **Constraints**: Technical/time constraints?
3. **Scope**: What's in/out of scope?
4. **Success**: How will we know it's complete?

Use AskUserQuestion if anything is unclear.

### Phase 2: Research (Gather Context)
```
# Parallel exploration
Task(subagent_type="huginn", prompt="Find related code...")
Task(subagent_type="mimir", prompt="Research best practices...")
Task(subagent_type="odin", prompt="Advise on architecture...")
```

### Phase 3: Design (Create the Plan)

Write the plan in markdown format:

```markdown
# [Project Name] Implementation Plan

## Overview
[1-3 sentence summary]

## Goals
- [ ] Primary goal 1
- [ ] Primary goal 2

## Non-Goals (Out of Scope)
- Item 1

## Technical Approach
[Description of the approach]

## Implementation Phases

### Phase 1: [Name]
**Objective**: [What this phase achieves]

Tasks:
- [ ] Task 1
- [ ] Task 2

Verification:
- [ ] How to verify

### Phase 2: [Name]
...

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Risk 1 | High | Mitigation |

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

### Phase 4: Review (Verify with Loki)

**MANDATORY**: All plans must be reviewed before execution.

```
Task(subagent_type="loki", prompt="Review this plan for completeness, feasibility, and risks...")
```

Address all concerns raised by Loki before proceeding.

## Plan Quality Checklist

- [ ] Goals are specific and measurable
- [ ] Phases have clear deliverables
- [ ] Tasks are actionable (not vague)
- [ ] Risks are identified
- [ ] Success criteria defined
- [ ] Reviewed by Loki

## After Planning

Once the plan is approved by Loki:
1. Use TodoWrite to track implementation
2. Execute with `/sisyphus` or regular workflow
3. Verify each phase before proceeding

## Anti-Patterns

- Creating plans without understanding requirements
- Vague tasks like "implement feature"
- Skipping Loki review
- Starting execution without approval
