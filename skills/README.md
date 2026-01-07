# Claude Code Skills

커스텀 슬래시 커맨드 스킬 모음

## 스킬이란?

슬래시 커맨드(`/skill-name`)로 실행할 수 있는 커스텀 명령어

## 스킬 구조

각 스킬은 markdown 파일로 정의:

```markdown
---
name: my-skill
description: 스킬 설명
---

# 스킬 프롬프트 내용

여기에 Claude가 실행할 지시사항 작성
```

## 스킬 위치

- 글로벌: `~/.claude/skills/`
- 프로젝트: `.claude/skills/`

## 예제 스킬

### /review - 코드 리뷰
```markdown
---
name: review
description: 현재 변경사항 코드 리뷰
---

git diff로 변경사항을 확인하고 다음 관점에서 리뷰해주세요:
1. 코드 품질
2. 잠재적 버그
3. 성능 이슈
4. 보안 취약점
```

### /commit - 커밋 메시지 생성
```markdown
---
name: commit
description: 변경사항 기반 커밋 메시지 생성
---

staged 변경사항을 분석하고 conventional commit 형식의
커밋 메시지를 생성해주세요.
```

## 스킬 만들기

1. `skills/` 디렉토리에 `.md` 파일 생성
2. frontmatter에 name, description 정의
3. 본문에 프롬프트 작성
4. Claude Code 재시작 후 `/skill-name`으로 사용
