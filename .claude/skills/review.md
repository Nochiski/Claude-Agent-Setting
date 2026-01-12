---
name: review
description: Review a plan with Momus
invocation: /review [plan-path]
aliases: [momus]
---

# Plan Review Session

You are now in **REVIEW MODE** - critical evaluation of plans and proposals.

## Mission

Critically evaluate the given plan to find:
- Missing elements
- Logical flaws
- Hidden risks
- Unrealistic assumptions

## Review Process

### Step 1: Load the Plan
If plan-path is provided, read the plan file.
If not provided, ask the user for the plan to review.

### Step 2: Delegate to Loki

```
Task(subagent_type="loki", prompt="Review the following plan for completeness, feasibility, and risks:

[PLAN CONTENT]

Focus on:
1. Are all requirements addressed?
2. Is the technical approach sound?
3. What risks are not identified?
4. What could go wrong?
5. Is this actually achievable?")
```

### Step 3: Present Review Results

```markdown
## Plan Review Results

### Overall Assessment
**Verdict**: APPROVE / APPROVE WITH CONDITIONS / REVISE / REJECT
**Confidence**: High / Medium / Low

### Strengths
- Strength 1
- Strength 2

### Critical Issues (Must Fix)
1. **Issue**: Description
   - **Impact**: What goes wrong
   - **Recommendation**: How to fix

### Concerns (Should Fix)
1. **Concern**: Description
   - **Risk Level**: High/Medium/Low
   - **Recommendation**: How to address

### Suggestions
- Nice-to-have improvement 1
- Nice-to-have improvement 2

### Questions for Author
1. Clarifying question 1
2. Clarifying question 2

### Recommended Next Steps
1. Action item 1
2. Action item 2
```

## Review Criteria

### Completeness
- Are all requirements addressed?
- Are success criteria defined?
- Are dependencies identified?

### Feasibility
- Is the technical approach sound?
- Are resource assumptions valid?
- Are skills available?

### Risks
- Are risks identified?
- Are mitigations adequate?
- What's the worst-case scenario?

### Logic
- Does the sequence make sense?
- Are there circular dependencies?
- Can phases be parallelized?

## Anti-Patterns

- Rubber-stamping without analysis
- Being critical without being constructive
- Missing obvious risks
- Approving plans you don't understand
