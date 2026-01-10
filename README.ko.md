# Claude Code Agents

Claude Code 서브에이전트 자동 설정 도구

로컬 Claude Code 환경에 **8개 서브에이전트**, **MCP 서버**, **15개 자동화 훅**을 일괄 적용합니다.

## 빠른 설치

```bash
# 레포지토리 클론
git clone https://github.com/YOUR_USERNAME/claude_agents.git
cd claude_agents

# Windows (PowerShell)
.\install.ps1

# Linux / macOS
bash install.sh
```

설치 스크립트 수행 작업:
- `~/.claude/` 디렉토리 생성
- 기존 `settings.json` 백업
- 에이전트, 훅, 스킬, MCP 설정 복사

## 서브에이전트 (8개)

| 에이전트 | 모델 | 역할 |
|---------|------|------|
| **oracle** | Opus | 아키텍처 설계, 전략 조언, 기술 의사결정 |
| **explore** | Haiku | 코드베이스 빠른 탐색 (READ-ONLY) |
| **code-reviewer** | Sonnet | 코드 리뷰, 버그/보안 검토 |
| **frontend-designer** | Sonnet | Figma → 코드 변환 |
| **librarian** | Sonnet | 문서 탐색, 리서치, 프로젝트 구조 파악 |
| **debugger** | Sonnet | 버그 분석, 에러 추적, 로그 해석 |
| **test-writer** | Sonnet | 테스트 코드 작성 (unit, integration, e2e) |
| **refactorer** | Sonnet | 코드 리팩토링, 구조 개선 |

### 사용 예시
```
"oracle에게 아키텍처 리뷰해달라고 해"
"code-reviewer로 이 PR 검토해줘"
"test-writer로 테스트 작성해줘"
"debugger로 이 에러 분석해줘"
```

### 역할 구분 가이드

| 상황 | 선택 |
|------|------|
| 에러 메시지/스택 트레이스 있음 | `debugger` |
| PR 리뷰, 코드 품질 검토 | `code-reviewer` |
| 프로젝트 구조/파일 탐색 | `librarian` |
| 구조 변경, 패턴 적용 | `refactorer` |

자세한 내용은 [agents.md](./agents.md) 참조

## MCP 서버 (4개)

| MCP | 용도 | 인증 |
|-----|------|------|
| **Context7** | 최신 라이브러리 문서 조회 | 불필요 |
| **Figma** | Figma 디자인 데이터 조회 | `FIGMA_API_KEY` 필요 |
| **GitHub** | 리포지토리, 이슈, PR 조회 | `gh auth login` 또는 PAT |
| **ast-grep** | AST 기반 코드 검색 | 불필요 |

### GitHub MCP 설정 (권장: OAuth)
```bash
# gh CLI로 OAuth 로그인
gh auth login

# 토큰을 환경변수로 설정
export GITHUB_PERSONAL_ACCESS_TOKEN=$(gh auth token)
```

### Figma MCP 설정
```bash
export FIGMA_API_KEY="your-figma-api-key"
```

### ast-grep MCP 설정
```bash
# ast-grep CLI 설치
brew install ast-grep  # macOS
cargo install ast-grep # Rust 사용 시

# uv 설치 (MCP 서버용)
brew install uv  # macOS
pip install uv   # pip 사용 시
```

## Hooks (15개)

| 훅 | 이벤트 | 기능 |
|----|--------|------|
| `rules-injector.js` | UserPromptSubmit | **README + 프로젝트 규칙 자동 주입** |
| `pre-commit-test.js` | PreToolUse | 커밋 전 테스트 실행 |
| `auto-format.js` | PostToolUse | 코드 자동 포매팅 |
| `readme-reminder.js` | PostToolUse | README 업데이트 리마인드 |
| `edit-error-recovery.js` | PostToolUse | Edit 에러 복구 힌트 |
| `empty-task-response-detector.js` | PostToolUse | 서브에이전트 빈 응답 감지 |
| `context-window-monitor.js` | PostToolUse | 컨텍스트 사용량 모니터링 |
| `agent-usage-reminder.js` | PostToolUse | 에이전트 위임 리마인드 |
| `agent-usage-logger-pre.js` | PreToolUse | **에이전트 시작 시간 기록** |
| `agent-usage-logger.js` | PostToolUse | **에이전트 사용 로깅 (시간 포함)** |
| `pipeline-tracker.js` | PostToolUse | **코드 수정 파이프라인 추적** |
| `pipeline-enforcer.js` | Stop | **파이프라인 미완료 시 종료 차단** |
| `stop-verify.js` | Stop | 세션 종료 시 검증 |
| `ralph-loop.js` | Stop | **자동 반복 실행 (Ralph Wiggum)** |
| `comment-checker.js` | PostToolUse | 과도한 주석 방지 |

### Pipeline Enforcement (파이프라인 강제)
`pipeline-tracker.js` + `pipeline-enforcer.js`가 필수 코드 리뷰 파이프라인을 강제합니다.

코드 파일(.js, .ts, .py 등)을 수정하면 훅이 이를 추적하고 다음 실행을 요구합니다:
1. `code-reviewer` - 버그/보안 리뷰
2. `test-writer` - 테스트 확인/작성

모든 파이프라인 단계가 완료될 때까지 세션 종료가 차단됩니다.

### Agent Usage Logging (에이전트 사용 로깅)
`agent-usage-logger-pre.js` + `agent-usage-logger.js`가 모든 서브에이전트 호출을 추적합니다.

**로그 파일** (`~/.claude/` 내):
- `agent-usage.log` - 간단 로그 (타임스탬프, 에이전트, 소요시간)
- `agent-usage-stats.json` - 집계 통계 (호출 횟수, 평균 소요시간)
- `agent-usage-detailed.jsonl` - 전체 프롬프트 기록 (분석용)

```bash
# 파이프라인 강제 건너뛰기 (비권장)
set PIPELINE_SKIP=true
```

### Ralph Loop (자동 반복 실행)
`ralph-loop.js`는 Todo가 완료될 때까지 세션 종료를 차단하여 자동으로 작업을 계속합니다.

```bash
# 환경변수로 활성화
set RALPH_ENABLED=true           # 기능 활성화
set RALPH_MAX_ITERATIONS=20      # 최대 반복 횟수
```

**완료 조건**: TodoWrite의 모든 항목이 `completed` 상태가 되면 자동 종료

### README 자동 주입
`rules-injector.js`가 프롬프트 제출 시 프로젝트의 `README.md`를 컨텍스트에 자동 주입합니다.

자세한 내용은 [hooks/README.md](./hooks/README.md) 참조

## 프로젝트 규칙 (Cursor 호환)

프로젝트 루트에 규칙 파일을 두면 자동으로 컨텍스트에 주입됩니다:

```bash
# 지원 파일 (우선순위 순)
README.md          # 프로젝트 설명 (자동 주입)
CLAUDE.md          # Claude 규칙
.claude/rules.md
.cursorrules       # Cursor 호환
.cursor/rules.md
```

템플릿: [templates/CLAUDE.md](./templates/CLAUDE.md)

## 권장 워크플로우

```
[Plan 모드] → 계획 협의 → [Auto-accept] → 1-shot 완성
```

1. **Plan 모드 진입**: `Shift+Tab` 두 번
2. **계획 협의**: 요구사항 분석, 변경 범위 정의
3. **실행 모드 전환**: `Shift+Tab` 한 번 (Auto-accept)
4. **1-shot 실행**: 좋은 계획 = 한 번에 완성

## 프로젝트 구조

```
claude_agents/
├── .claude/
│   ├── settings.local.json   # Claude Code 설정 (MCP, hooks 포함)
│   ├── CLAUDE.md             # 에이전트 오케스트레이션 규칙
│   ├── agents/               # 서브에이전트 정의 (8개)
│   │   ├── oracle.md
│   │   ├── explore.md
│   │   ├── code-reviewer.md
│   │   ├── frontend-designer.md
│   │   ├── librarian.md
│   │   ├── debugger.md
│   │   ├── test-writer.md
│   │   └── refactorer.md
│   └── ast-grep/             # AST 기반 코드 분석 규칙
│       ├── sgconfig.yaml
│       └── rules/
│           ├── security/     # XSS, SQL injection, eval 등
│           └── quality/      # console.log, any type 등
├── hooks/                    # 이벤트 기반 훅
├── skills/                   # 슬래시 커맨드
├── mcp/
│   └── mcp.json              # MCP 서버 설정
├── templates/
│   └── CLAUDE.md             # 프로젝트 규칙 템플릿
├── agents.md                 # 서브에이전트 상세 문서
├── install.ps1               # Windows 설치
└── install.sh                # Unix 설치
```

## 수동 설치

```bash
# 설정 파일 복사
cp .claude/settings.local.json ~/.claude/settings.json

# 에이전트 복사
cp -r .claude/agents/* ~/.claude/agents/

# CLAUDE.md 복사
cp .claude/CLAUDE.md ~/.claude/CLAUDE.md

# 훅 복사
cp -r hooks/* ~/.claude/hooks/

# 스킬 복사
cp -r skills/* ~/.claude/skills/
```

## 참고 자료

- [Claude Code Subagents 문서](https://docs.anthropic.com/en/docs/claude-code)
- [Context7 MCP](https://github.com/upstash/context7)
- [Figma MCP](https://github.com/GLips/Figma-Context-MCP)
- [GitHub MCP](https://github.com/modelcontextprotocol/servers)
- [ast-grep](https://ast-grep.github.io/)
- [ast-grep MCP](https://github.com/ast-grep/ast-grep-mcp)
