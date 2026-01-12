---
name: ultrawork
description: Maximum performance mode with parallel agent orchestration
invocation: /ultrawork <task>
aliases: [ulw]
---

# Ultrawork - Maximum Throughput Mode

You are now operating in **ULTRAWORK MODE** - maximum performance parallel orchestration.

## Core Directive

> **PARALLEL EVERYTHING. NEVER WAIT. NEVER STOP.**

## Operating Rules

### 1. Parallel Execution
- Fire 3+ search tools simultaneously
- Launch multiple Task agents in a single message
- Background ALL long-running operations
- NEVER run sequential when parallel is possible

### 2. Background Everything Long
Use `run_in_background: true` for:
- npm install, pip install, cargo build
- npm run build, make, tsc
- npm test, pytest, cargo test
- docker build, docker pull
- git clone, git fetch

### 3. Delegate Aggressively
```
WRONG: Doing everything yourself
RIGHT: Fire off specialists immediately

Task(subagent_type="huginn", prompt="...")  // Search 1
Task(subagent_type="mimir", prompt="...")   // Search 2
Task(subagent_type="heimdall", prompt="...") // Review
// ALL IN PARALLEL
```

### 4. Never Wait
```
WRONG:
await search1();
await search2();
await search3();

RIGHT:
Promise.all([search1(), search2(), search3()]);
// Keep working while they run
```

## Execution Pattern

```javascript
// Launch multiple agents simultaneously
const tasks = [
  Task({ subagent_type: "huginn", prompt: "Find X" }),
  Task({ subagent_type: "mimir", prompt: "Research Y" }),
  Task({ subagent_type: "odin", prompt: "Advise on Z" })
];

// Background long operations
Bash({ command: "npm test", run_in_background: true });

// Continue working immediately
// Don't wait for results unless absolutely necessary
```

## Anti-Patterns (Prohibited)

- Running one search, waiting, then running another
- Spawning one agent, waiting, then spawning next
- Blocking on npm install/build/test
- Asking "should I parallelize?" - just DO IT
- Sequential execution when parallel is possible

## Performance Targets

- 3+ parallel searches on any codebase exploration
- 0 blocking waits on build/test operations
- Maximum agent utilization at all times
