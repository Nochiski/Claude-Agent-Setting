# Claude Code Hooks System

자가 검증(Self-Verification) 파이프라인과 지능형 오케스트레이션을 위한 훅 시스템입니다.

## 핵심 철학

> **"모든 출력물은 다른 에이전트의 검증을 거쳐야 한다"**
>
> 코드든 계획이든, 한 에이전트가 만든 결과물은 반드시 다른 에이전트가 검증합니다.
> 이를 통해 품질을 보장하고, 실수를 줄이며, 더 나은 결과물을 만듭니다.

## 디렉토리 구조

```
hooks/
├── orchestrator/           # 오케스트레이션 핵심 훅
│   ├── keyword-detector.js # 키워드 감지 및 모드 활성화
│   └── stop-orchestrator.js# 세션 종료 통합 관리
├── pipeline/               # 자가 검증 파이프라인
│   └── tracker.js          # 출력물 및 검증 상태 추적
├── monitoring/             # 모니터링
│   ├── agent-logger.js     # 에이전트 사용 로깅
│   └── context-monitor.js  # 컨텍스트 윈도우 모니터링
├── quality/                # 품질 관리
│   ├── auto-format.js      # 자동 코드 포맷팅
│   ├── pre-commit-test.js  # 커밋 전 테스트 실행
│   └── edit-recovery.js    # Edit 에러 복구 힌트
└── utils/                  # 유틸리티
    ├── rules-injector.js   # 프로젝트 규칙 자동 주입
    ├── readme-reminder.js  # README 업데이트 리마인더
    ├── agent-reminder.js   # 에이전트 위임 리마인더
    └── empty-response.js   # 빈 응답 감지
```

## 훅 상세 설명

### 🎭 orchestrator/ (오케스트레이션)

#### keyword-detector.js
**이벤트**: `UserPromptSubmit`

사용자 입력에서 매직 키워드를 감지하고 해당 모드를 활성화합니다.

| 키워드 | 모드 | 동작 |
|--------|------|------|
| `ultrawork`, `ulw` | 울트라워크 | 병렬 에이전트 오케스트레이션 활성화 |
| `search`, `find` | 검색 | 병렬 검색 모드 활성화 |
| `analyze`, `debug` | 분석 | 심층 분석 모드 활성화 |
| `plan`, `roadmap` | 계획 | 전략적 계획 모드 활성화 |
| `review`, `check` | 검토 | 비평적 검토 모드 활성화 |

#### stop-orchestrator.js
**이벤트**: `Stop`

세션 종료 시 실행되며 3가지 검사를 통합 관리합니다:

1. **Ralph Loop**: TODO가 완료될 때까지 자동 반복 (`RALPH_ENABLED=true`)
2. **Self-Verification**: 출력물이 검증되었는지 확인
3. **Verification Warnings**: 미완료 작업 경고 (비차단)

```
세션 종료 시도
    ↓
[Ralph Loop] TODO 완료 체크
    ↓
[Self-Verification] 검증 에이전트 호출 여부 체크
    ↓
[Warnings] 미완료 작업 경고
    ↓
세션 종료 허용/차단
```

### 🔄 pipeline/ (자가 검증 파이프라인)

#### tracker.js
**이벤트**: `PostToolUse` (Edit, Write, Task)

출력물과 검증 상태를 추적합니다:

- **코드 수정 추적**: Edit/Write로 코드 파일 수정 시 기록
- **계획 수정 추적**: 계획 파일 수정 시 기록
- **검증 에이전트 추적**: heimdall, loki 등 검증 에이전트 호출 시 기록

검증 에이전트 목록:
- 코드 검증: `heimdall` (code-reviewer), `tyr` (test-writer)
- 계획 검증: `loki` (plan-reviewer), `odin` (oracle)

### 📊 monitoring/ (모니터링)

#### agent-logger.js
**이벤트**: `PreToolUse`, `PostToolUse` (Task)

모든 에이전트 호출을 로깅합니다:

- UUID 기반 추적으로 병렬 에이전트 시간 측정 정확도 향상
- 통계 집계 (호출 수, 평균 실행 시간)
- 상세 로그 (전체 프롬프트 기록)

로그 파일:
- `~/.claude/agent-usage.log`: 간단한 로그
- `~/.claude/agent-usage-stats.json`: 통계
- `~/.claude/agent-usage-detailed.jsonl`: 상세 기록

#### context-monitor.js
**이벤트**: `PostToolUse` (all tools)

컨텍스트 윈도우 사용량을 추적하고 임계값 도달 시 경고합니다.

### ✨ quality/ (품질 관리)

#### auto-format.js
**이벤트**: `PostToolUse` (Edit, Write)

파일 수정 후 자동으로 포맷터를 실행합니다:

| 언어 | 포맷터 |
|------|--------|
| JS/TS | prettier, eslint --fix |
| Python | black, ruff format |
| Go | gofmt -w |
| Rust | rustfmt |

#### pre-commit-test.js
**이벤트**: `PreToolUse` (Bash - git commit)

git commit 실행 전 테스트를 자동으로 실행합니다.

#### edit-recovery.js
**이벤트**: `PostToolUse` (Edit)

Edit 도구 에러 발생 시 복구 힌트를 제공합니다.

### 🛠 utils/ (유틸리티)

#### rules-injector.js
**이벤트**: `UserPromptSubmit`

프로젝트 규칙 파일을 자동으로 주입합니다.

우선순위:
1. `CLAUDE.md`
2. `.claude/rules.md`
3. `.cursorrules`

#### readme-reminder.js
**이벤트**: `PostToolUse` (Edit, Write)

중요 파일 변경 시 README 업데이트를 리마인드합니다.

#### agent-reminder.js
**이벤트**: `PostToolUse` (Glob, Grep, Read, Edit)

반복적인 탐색 작업 시 에이전트 위임을 권장합니다.

#### empty-response.js
**이벤트**: `PostToolUse` (Task)

서브에이전트가 빈 응답을 반환했을 때 경고합니다.

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `RALPH_ENABLED` | false | Ralph Loop 활성화 |
| `RALPH_MAX_ITERATIONS` | 20 | 최대 반복 횟수 |
| `RALPH_COMPLETION_MARKER` | COMPLETE | 완료 마커 |
| `PIPELINE_SKIP` | false | 검증 파이프라인 스킵 |
| `VERIFY_TODOS` | true | TODO 체크 활성화 |
| `VERIFY_TESTS` | false | 테스트 실행 |
| `VERIFY_BUILD` | false | 빌드 검증 |
| `AGENT_REMINDER` | true | 에이전트 리마인더 활성화 |

## 상태 파일

| 파일 | 용도 |
|------|------|
| `~/.claude/pipeline-state.json` | 파이프라인 상태 (출력물, 검증) |
| `~/.claude/ralph-state.json` | Ralph Loop 반복 상태 |
| `~/.claude/agent-pending.json` | 진행 중인 에이전트 추적 |
| `~/.claude/agent-usage-stats.json` | 에이전트 사용 통계 |
| `~/.claude/context-state.json` | 컨텍스트 사용량 |

## 자가 검증 흐름

```
코드 작성 (Edit/Write)
       ↓
[tracker.js] codeModified = true 기록
       ↓
세션 종료 시도
       ↓
[stop-orchestrator.js]
  └─ 검증 에이전트(heimdall) 호출 여부 확인
  └─ 미호출 시 → 세션 차단 🚫
       ↓
heimdall(code-reviewer) 실행
       ↓
[tracker.js] verificationStatus.heimdall = true
       ↓
세션 종료 시도
       ↓
[stop-orchestrator.js]
  └─ 검증 완료 확인 ✓
       ↓
세션 종료 허용 ✅
```

## 훅 설정 방법

`.claude/settings.local.json`에 hooks 섹션 추가:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          { "type": "command", "command": "node hooks/orchestrator/keyword-detector.js" },
          { "type": "command", "command": "node hooks/utils/rules-injector.js" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node hooks/quality/pre-commit-test.js" }]
      },
      {
        "matcher": "Task",
        "hooks": [{ "type": "command", "command": "node hooks/monitoring/agent-logger.js" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "node hooks/quality/auto-format.js" },
          { "type": "command", "command": "node hooks/quality/edit-recovery.js" }
        ]
      },
      {
        "matcher": "Edit|Write|Task",
        "hooks": [{ "type": "command", "command": "node hooks/pipeline/tracker.js" }]
      },
      {
        "matcher": "Task",
        "hooks": [{ "type": "command", "command": "node hooks/monitoring/agent-logger.js" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "node hooks/orchestrator/stop-orchestrator.js" }]
      }
    ]
  }
}
```

## 훅 작성 규칙

1. 훅은 stdin으로 JSON 데이터를 받음
2. stdout으로 수정된 데이터 반환
3. 종료 코드 0: 계속 진행
4. 종료 코드 2: 작업 차단 (block)
5. 종료 코드 1: 에러

## 참고

- 훅은 동기적으로 실행됨
- PreToolUse에서 무거운 작업 피하기
- 에러 핸들링 필수
