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

## 훅 작성 규칙

1. 훅은 stdin으로 JSON 데이터를 받음
2. stdout으로 수정된 데이터 반환
3. 종료 코드 0: 계속 진행
4. 종료 코드 1: 작업 차단

## 참고

- 훅은 동기적으로 실행됨
- PreToolUse에서 무거운 작업 피하기
- 에러 핸들링 필수
