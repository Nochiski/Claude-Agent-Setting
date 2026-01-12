---
name: ast-grep
description: AST-based code search and analysis
invocation: /ast-grep <pattern>
aliases: [ast, pattern-search]
---

# AST-Grep - Structural Code Analysis

You are now using **AST-GREP MODE** - find code patterns using AST (Abstract Syntax Tree).

## Why AST-Grep?

| Method | Limitation | AST-Grep |
|--------|-----------|----------|
| Grep | Text-based, false positives | Structure-aware, precise |
| Regex | Complex patterns break | Handles any syntax |
| Manual | Time-consuming | Instant, comprehensive |

## Available MCP Tools

```javascript
// Find code by pattern
mcp__ast-grep__find_code({
  pattern: "console.log($MSG)",  // $MSG = wildcard
  lang: "javascript"
})

// Search by predefined rule
mcp__ast-grep__search_by_rule({
  rule_id: "security/xss-innerhtml"
})

// List all available rules
mcp__ast-grep__get_all_rules()
```

## Pattern Syntax

### Basic Patterns
```
// Exact match
console.log("hello")

// Single wildcard ($NAME)
console.log($MSG)              // matches any argument
function $NAME() { }           // matches any function name

// Multiple wildcards ($$ARGS)
console.log($$ARGS)            // matches any number of arguments
function $NAME($$PARAMS) { }   // matches any parameters

// Statement sequence ($$$)
try { $$$ } catch($E) { $$$ }  // matches try-catch with any body
```

### Common Search Patterns

#### JavaScript/TypeScript
```javascript
// Find all console.log
"console.log($MSG)"

// Find async functions
"async function $NAME($$PARAMS) { $$$ }"

// Find React useState hooks
"const [$STATE, $SETTER] = useState($INIT)"

// Find Promise without catch
"$PROMISE.then($HANDLER)"

// Find eval (security)
"eval($CODE)"

// Find innerHTML (XSS risk)
"$EL.innerHTML = $VALUE"
```

#### Python
```python
# Find all print statements
"print($MSG)"

# Find except without specific exception
"except: $$$"

# Find SQL string formatting (injection risk)
"cursor.execute($SQL % $ARGS)"
"cursor.execute(f\"$SQL\")"

# Find open without context manager
"open($FILE)"
```

## Predefined Rules

### Security Rules
| Rule ID | Description |
|---------|-------------|
| `security/xss-innerhtml` | innerHTML XSS vulnerability |
| `security/sql-injection` | SQL string concatenation |
| `security/no-eval` | eval() and Function() usage |
| `security/hardcoded-secrets` | Hardcoded API keys/passwords |
| `security/command-injection` | Dangerous exec/spawn |

### Quality Rules
| Rule ID | Description |
|---------|-------------|
| `quality/no-console-log` | console.log in production |
| `quality/no-any-type` | TypeScript `any` usage |
| `quality/unhandled-promise` | Promises without catch |

## Usage Examples

### 1. Security Audit
```
"Find all security vulnerabilities in this codebase"

→ Run these in parallel:
- search_by_rule("security/xss-innerhtml")
- search_by_rule("security/sql-injection")
- search_by_rule("security/no-eval")
- search_by_rule("security/hardcoded-secrets")
```

### 2. Code Quality Check
```
"Find all TypeScript any types"

→ find_code(pattern="$VAR: any", lang="typescript")
→ OR search_by_rule("quality/no-any-type")
```

### 3. Migration/Refactoring
```
"Find all old API calls to migrate"

→ find_code(pattern="oldApi.$METHOD($$ARGS)", lang="javascript")
```

### 4. Dead Code Detection
```
"Find unused exports"

→ find_code(pattern="export function $NAME", lang="typescript")
→ Compare with find_code(pattern="import { $NAME }")
```

## Delegation

For comprehensive AST analysis, delegate to specialists:

```
Task(subagent_type="heimdall", prompt="Use ast-grep to audit this code for security issues")
Task(subagent_type="forseti", prompt="Use ast-grep to find the bug pattern in...")
```

## Anti-Patterns

- Using grep when ast-grep would be more accurate
- Not using wildcards effectively
- Forgetting to specify language
- Not checking predefined rules first
