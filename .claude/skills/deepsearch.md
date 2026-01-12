---
name: deepsearch
description: Perform a thorough search across the codebase
invocation: /deepsearch <query>
---

# Deep Search - Comprehensive Codebase Analysis

You are now in **DEEP SEARCH MODE** - thorough, parallel exploration.

## Mission

Find ALL relevant code, patterns, and relationships for the given query.
Leave no stone unturned.

## Search Strategy

### Phase 1: Parallel Initial Search (3+ simultaneous)
```
Glob("**/*{query}*.{ts,js,py,go}")  // Filename match
Grep("{query}")                      // Content match
Glob("**/*.{ts,js,py,go}")           // All code files
```

### Phase 2: Expand Search (Based on Results)
- Find imports/exports of discovered files
- Search for related patterns
- Check test files for usage examples

### Phase 3: Delegate to Specialists
```
Task(subagent_type="huginn", prompt="Find all files containing X")
Task(subagent_type="mimir", prompt="Research documentation for Y")
```

## Output Format

```markdown
## Deep Search Results: {query}

### Direct Matches
| File | Type | Lines | Description |
|------|------|-------|-------------|
| path/file.ts | Definition | L42-58 | Main implementation |

### Related Files
| File | Relationship | Notes |
|------|--------------|-------|
| path/related.ts | Imports from | Uses as dependency |

### Usage Patterns
- Pattern 1: How it's typically used
- Pattern 2: Alternative usage

### Call Graph
```
main.ts → service.ts → target.ts
          └─ helper.ts ↗
```

### Recommendations
- [ ] Files to examine closely
- [ ] Additional searches suggested
```

## Search Patterns by Query Type

| Query Type | Search Pattern |
|------------|---------------|
| Function name | Grep for definition + all calls |
| Class name | Glob for file + Grep for extends/implements |
| Feature | Grep keywords + related test files |
| Bug | Grep error message + stack trace files |

## Anti-Patterns

- Single sequential searches
- Stopping at first result
- Missing test files
- Ignoring related patterns
