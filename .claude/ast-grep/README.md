# ast-grep Rules Library

Pre-defined rules for security and code quality analysis.

## Directory Structure

```
ast-grep/
├── sgconfig.yaml       # Main configuration
└── rules/
    ├── security/       # Security vulnerability rules
    └── quality/        # Code quality rules
```

## Security Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `security/xss-innerhtml` | error | Detect innerHTML with dynamic content |
| `security/sql-injection` | error | Detect SQL string concatenation |
| `security/no-eval` | error | Detect eval() and Function() |
| `security/hardcoded-secrets` | error | Detect hardcoded API keys/passwords |
| `security/command-injection` | error | Detect dangerous shell execution |

## Quality Rules

| Rule | Severity | Description |
|------|----------|-------------|
| `quality/no-console-log` | warning | Detect console.log statements |
| `quality/no-any-type` | warning | Detect TypeScript `any` usage |
| `quality/unhandled-promise` | warning | Detect promises without .catch() |

## Usage

### Via Agent Tools
```
# Using code-reviewer or debugger agents
search_by_rule(rule_id="security/xss-innerhtml")
```

### Via CLI
```bash
# Run all rules
ast-grep scan --config ~/.claude/ast-grep/sgconfig.yaml

# Run specific rule
ast-grep scan --rule security/xss-innerhtml.yaml
```

## Adding Custom Rules

1. Create a YAML file in the appropriate `rules/` subdirectory
2. Follow the ast-grep rule format:

```yaml
id: category/rule-name
language: javascript
severity: error|warning|hint
message: "Short description of the issue"
note: "Explanation and suggested fix"
rule:
  pattern: your_pattern_here
```

3. Test your rule:
```bash
ast-grep test --config sgconfig.yaml
```

## References

- [ast-grep Rule Guide](https://ast-grep.github.io/guide/rule-config.html)
- [ast-grep Pattern Syntax](https://ast-grep.github.io/guide/pattern-syntax.html)
