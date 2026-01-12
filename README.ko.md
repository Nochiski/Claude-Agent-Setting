# Claude Agent Setting

Claude Code를 위한 자기검증 파이프라인 & 에이전트 시스템

[English README](./README.md)

## 핵심 철학

> **"모든 출력물은 다른 에이전트의 검증을 거쳐야 한다"**
>
> 코드든 계획이든, 한 에이전트가 만든 결과물은 반드시 다른 에이전트가 검증합니다.

| 출력물 유형 | 검증 에이전트 | 검증 내용 |
|------------|--------------|----------|
| 코드 변경 | `heimdall` | 품질, 버그, 보안 |
| 계획 수립 | `loki` | 완전성, 실현 가능성, 리스크 |

## 빠른 설치

```bash
# 저장소 클론
git clone https://github.com/Nochiski/Claude-Agent-Setting.git
cd Claude-Agent-Setting

# Windows (PowerShell)
.\install.ps1

# Linux / macOS
bash install.sh
```

## 설치 내용

- **9개 에이전트**: 전문 서브에이전트
- **9개 스킬**: 다양한 작업 모드를 위한 슬래시 명령어
- **훅**: 품질, 모니터링, 오케스트레이션 자동화
- **MCP 서버**: Context7, Figma, GitHub, ast-grep

## 에이전트 (9개)

| 에이전트 | 별칭 | 모델 | 역할 |
|---------|-----|------|------|
| **odin** | oracle | Opus | 아키텍처, 전략, 기술 결정 |
| **huginn** | explore | Haiku | 빠른 코드베이스 탐색 (읽기 전용) |
| **heimdall** | code-reviewer | Sonnet | 코드 리뷰, 보안 감사 |
| **mimir** | librarian | Sonnet | 문서 검색, 리서치 |
| **forseti** | debugger | Sonnet | 버그 분석, 에러 추적 |
| **freya** | frontend-designer | Sonnet | UI/UX, Figma → 코드 |
| **tyr** | test-writer | Sonnet | 테스트 코드 작성 |
| **baldur** | refactorer | Sonnet | 코드 리팩토링 |
| **loki** | plan-reviewer | Opus | 계획 검토, 리스크 탐지 |

### 사용법
```
"odin에게 이 아키텍처 검토 요청해"
"heimdall에게 이 코드 리뷰 맡겨"
"loki에게 이 계획 검토 받아"
```

이름과 별칭 모두 사용 가능:
```
Task(subagent_type="heimdall", ...)  # 기본 (권장)
Task(subagent_type="code-reviewer", ...)  # 별칭 (지원)
```

## 스킬 (9개)

| 스킬 | 설명 |
|-----|------|
| `/sisyphus` | 투두 추적 기능이 있는 멀티 에이전트 오케스트레이션 |
| `/ultrawork` | 병렬 에이전트로 최대 성능 모드 |
| `/deepsearch` | 코드베이스 종합 검색 |
| `/ralph-loop` | 검증 완료까지 끈질기게 반복 |
| `/plan` | 전략적 계획 세션 |
| `/review` | loki와 계획 검토 |
| `/orchestrator` | 복잡한 다단계 작업 조율 |
| `/analyze` | 심층 조사 및 근본 원인 분석 |
| `/ast-grep` | AST 기반 코드 패턴 검색 |

## 훅

`hooks/` 디렉토리에 기능별로 정리:

```
hooks/
├── orchestrator/          # 오케스트레이션
│   ├── keyword-detector.js    # 매직 키워드 감지 (ultrawork, search 등)
│   └── stop-orchestrator.js   # 통합 중지 핸들러
├── pipeline/              # 자기검증 파이프라인
│   └── tracker.js             # 코드/계획 수정 추적
├── monitoring/            # 모니터링
│   ├── agent-logger.js        # 에이전트 사용 로깅 (UUID 기반)
│   └── context-monitor.js     # 컨텍스트 윈도우 모니터링
├── quality/               # 품질
│   ├── auto-format.js         # 편집 후 자동 포맷
│   ├── pre-commit-test.js     # 커밋 전 테스트
│   └── edit-recovery.js       # 편집 에러 복구 힌트
└── utils/                 # 유틸리티
    ├── rules-injector.js      # 프로젝트 규칙 주입
    ├── readme-reminder.js     # README 업데이트 알림
    ├── agent-reminder.js      # 에이전트 위임 알림
    └── empty-response.js      # 빈 응답 감지
```

### 자기검증 파이프라인

코드를 수정하면 파이프라인이 추적하고 리뷰를 강제합니다:

```
코드 작성 (Edit/Write)
       ↓
[tracker.js] 수정 기록
       ↓
세션 종료 시도
       ↓
[stop-orchestrator.js]
  └─ heimdall 리뷰 여부 확인 → 미리뷰 시 블록
       ↓
heimdall 코드 리뷰
       ↓
세션 종료 허용 ✅
```

### 키워드 감지

매직 키워드가 특수 모드를 활성화합니다:

| 키워드 | 모드 | 효과 |
|-------|------|------|
| `ultrawork`, `ulw` | Ultrawork | 병렬 에이전트 오케스트레이션 |
| `search`, `find` | Search | 강화된 병렬 검색 |
| `analyze`, `debug` | Analyze | 심층 분석 모드 |
| `plan`, `roadmap` | Planning | 전략적 계획 모드 |
| `review`, `check` | Review | 비판적 검토 모드 |

## MCP 서버

| MCP | 용도 | 설정 |
|-----|------|------|
| **Context7** | 라이브러리 문서 | 자동 |
| **Figma** | 디자인 데이터 | `FIGMA_API_KEY` |
| **GitHub** | 저장소/PR 접근 | `gh auth login` |
| **ast-grep** | AST 코드 검색 | ast-grep CLI 설치 |

### ast-grep 설정

```bash
# CLI 설치
brew install ast-grep  # macOS
winget install ast-grep.ast-grep  # Windows

# uv 설치 (MCP 서버용)
pip install uv
```

## 프로젝트 구조

```
Claude-Agent-Setting/
├── .claude/
│   ├── settings.local.json   # 설정 (훅, MCP)
│   ├── CLAUDE.md             # 오케스트레이션 규칙
│   ├── agents/               # 9개 에이전트
│   │   ├── odin.md
│   │   ├── huginn.md
│   │   ├── heimdall.md
│   │   ├── mimir.md
│   │   ├── forseti.md
│   │   ├── freya.md
│   │   ├── tyr.md
│   │   ├── baldur.md
│   │   └── loki.md
│   ├── skills/               # 9개 스킬
│   └── ast-grep/             # AST 규칙
├── hooks/                    # 정리된 훅
│   ├── orchestrator/
│   ├── pipeline/
│   ├── monitoring/
│   ├── quality/
│   └── utils/
├── mcp/
│   └── mcp.json
├── install.ps1               # Windows 설치
└── install.sh                # Unix 설치
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|-----|-------|------|
| `RALPH_ENABLED` | false | Ralph Loop 활성화 |
| `RALPH_MAX_ITERATIONS` | 20 | 최대 반복 횟수 |
| `PIPELINE_SKIP` | false | 검증 파이프라인 건너뛰기 |
| `TEST_STRICT` | false | 테스트 실패 시 커밋 블록 |

## 수동 설치

```bash
# ~/.claude/에 모두 복사
cp .claude/settings.local.json ~/.claude/settings.json
cp -r .claude/agents ~/.claude/
cp -r .claude/skills ~/.claude/
cp .claude/CLAUDE.md ~/.claude/
cp -r hooks ~/.claude/
```

## 참고 자료

- [Claude Code 문서](https://docs.anthropic.com/en/docs/claude-code)
- [ast-grep](https://ast-grep.github.io/)
- [MCP 서버](https://github.com/modelcontextprotocol/servers)
