---
name: analyze
description: Perform deep analysis and investigation
invocation: /analyze <target>
---

# Deep Analysis Mode

You are now in **ANALYZE MODE** - thorough investigation and root cause analysis.

## When to Use

- Complex bugs with unclear root cause
- Performance issues
- Architecture decisions
- Security concerns
- "Why does this happen?"

## Analysis Framework

### 1. Gather Evidence (Parallel)

```
# Launch multiple investigators
Task(subagent_type="huginn", prompt="Find all code related to {target}")
Task(subagent_type="mimir", prompt="Research known issues with {target}")
Task(subagent_type="forseti", prompt="Analyze error patterns in {target}")
```

### 2. Build Context

| Question | Method |
|----------|--------|
| What is the current behavior? | Direct observation |
| What is the expected behavior? | Requirements/docs |
| When did it start? | git log, history |
| What changed recently? | git diff |
| Who/what is affected? | Impact analysis |

### 3. Root Cause Analysis

Use the "5 Whys" technique:
```
Problem: X is failing
Why? → Because Y happens
Why? → Because Z is misconfigured
Why? → Because A was changed
Why? → Because B was updated
Why? → ROOT CAUSE FOUND
```

### 4. Hypothesis Testing

For each hypothesis:
1. Predict what you'd see if true
2. Test the prediction
3. Confirm or reject
4. Document findings

## Analysis Output Format

```markdown
## Analysis: {target}

### Summary
[1-2 sentence conclusion]

### Findings

#### Symptom
[What's observed]

#### Root Cause
[Why it's happening]

#### Evidence
- Evidence 1: [description] (`file:line`)
- Evidence 2: [description] (`file:line`)

### Impact Assessment
- Severity: Critical / High / Medium / Low
- Scope: [What's affected]
- Urgency: [When it needs fixing]

### Recommendations
1. Immediate action
2. Short-term fix
3. Long-term solution

### Related Files
| File | Relevance |
|------|-----------|
| path/file.ts | Contains bug |

### References
- [Link to relevant doc]
- [Related issue/PR]
```

## Analysis Types

### Bug Analysis (forseti)
```
Task(subagent_type="forseti", prompt="Analyze this bug:
Error: {error}
Stack trace: {trace}
Steps to reproduce: {steps}")
```

### Performance Analysis
```
Task(subagent_type="huginn", prompt="Find hot paths in {module}")
Task(subagent_type="heimdall", prompt="Review {code} for performance issues")
```

### Security Analysis
```
Task(subagent_type="heimdall", prompt="Security audit of {code}")
```

### Architecture Analysis
```
Task(subagent_type="odin", prompt="Evaluate architecture of {system}")
```

## Anti-Patterns

- Jumping to conclusions without evidence
- Single-source analysis
- Ignoring related code
- Treating symptoms, not causes
