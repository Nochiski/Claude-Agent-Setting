# Claude Code Hooks

이벤트 기반 자동화 훅 설정

## 사용 가능한 훅 이벤트

| 이벤트 | 설명 | 용도 |
|--------|------|------|
| `PreToolUse` | 도구 실행 전 | 입력 검증, 실행 차단 |
| `PostToolUse` | 도구 실행 후 | 출력 가공, 로깅 |
| `UserPromptSubmit` | 사용자 프롬프트 제출 시 | 컨텍스트 주입 |
| `Stop` | 세션 종료 시 | 정리 작업 |

## 훅 설정 방법

`.claude/settings.local.json`에 hooks 섹션 추가:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": ["node hooks/pre-bash.js"]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": ["node hooks/post-edit.js"]
      }
    ]
  }
}
```

## 포함된 훅

### 1. 규칙 주입 (rules-injector.js) ⭐
**이벤트**: UserPromptSubmit

프로젝트 규칙 파일을 자동으로 컨텍스트에 주입

지원 파일 (우선순위 순):
- `CLAUDE.md`
- `.claude/rules.md`
- `.cursorrules` (Cursor 호환)
- `.cursor/rules.md`

### 2. 자동 포매팅 (auto-format.js) ⭐
**이벤트**: PostToolUse (Edit, Write)

Edit/Write 후 자동으로 코드 포매터 실행

| 언어 | 포매터 |
|------|--------|
| JS/TS | prettier, eslint --fix |
| Python | black, ruff |
| Go | gofmt |
| Rust | rustfmt |

### 3. 세션 종료 검증 (stop-verify.js)
**이벤트**: Stop

세션 종료 시 자동 검증:
- 미완료 TODO 체크
- 테스트 실행 (환경변수 설정 시)
- 빌드 검증 (환경변수 설정 시)

```bash
# 환경변수로 설정
export VERIFY_TESTS=true
export TEST_COMMAND="npm test"
export VERIFY_BUILD=true
export BUILD_COMMAND="npm run build"
```

### 4. README 리마인더 (readme-reminder.js) ⭐
**이벤트**: PostToolUse (Edit, Write)

주요 변경 시 README 업데이트 리마인드

트리거 조건:
- API/라우트 변경
- 설정 파일 변경
- 새 파일 생성
- Docker/CI 설정 변경

### 5. 주석 체크 (comment-checker.js)
**이벤트**: PostToolUse (Edit)

AI가 과도한 주석을 추가하지 않도록 검사

### 6. 커밋 전 테스트 (pre-commit-test.js)
**이벤트**: PreToolUse (Bash)

git commit 명령 실행 전 테스트 자동 실행

### 7. Edit 에러 복구 (edit-error-recovery.js)
**이벤트**: PostToolUse (Edit)

Edit 도구 에러 발생 시 복구 힌트 제공

### 8. 빈 Task 응답 감지 (empty-task-response-detector.js)
**이벤트**: PostToolUse (Task)

서브에이전트가 빈 응답을 반환하면 경고

### 9. 컨텍스트 윈도우 모니터 (context-window-monitor.js)
**이벤트**: PostToolUse

토큰 사용량을 추적하고 임계값 도달 시 알림

### 10. 에이전트 사용 리마인더 (agent-usage-reminder.js)
**이벤트**: PostToolUse

반복적인 탐색 작업 시 에이전트 위임 리마인드

### 11. Pipeline Tracker (pipeline-tracker.js) ⭐
**이벤트**: PostToolUse (Edit, Write, Task)

코드 파일 수정을 추적하고 파이프라인 에이전트 실행 상태를 기록

추적 대상:
- Edit/Write로 코드 파일(.js, .ts, .py 등) 수정 → `codeModified: true`
- Task로 code-reviewer, test-writer, formatter 실행 → 해당 단계 완료

### 12. Pipeline Enforcer (pipeline-enforcer.js) ⭐
**이벤트**: Stop

코드가 수정되었으나 파이프라인이 완료되지 않으면 세션 종료 차단

```bash
# 건너뛰기 (비권장)
set PIPELINE_SKIP=true
```

### 13. Ralph Loop (ralph-loop.js) ⭐
**이벤트**: Stop

Todo가 완료될 때까지 세션 종료를 차단하여 자동 반복 실행

```bash
# 활성화
set RALPH_ENABLED=true
set RALPH_MAX_ITERATIONS=20
```

## 훅 작성 규칙

1. 훅은 stdin으로 JSON 데이터를 받음
2. stdout으로 수정된 데이터 반환
3. 종료 코드 0: 계속 진행
4. 종료 코드 1: 작업 차단

## 참고

- 훅은 동기적으로 실행됨
- PreToolUse에서 무거운 작업 피하기
- 에러 핸들링 필수
