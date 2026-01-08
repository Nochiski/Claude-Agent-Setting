# Claude Code 서브에이전트

`.claude/agents/` 폴더의 커스텀 서브에이전트 정의

## 서브에이전트 목록

| 에이전트 | 모델 | 역할 | 도구 |
|---------|------|------|------|
| **oracle** | Opus | 아키텍처, 전략, 기술 의사결정 | Read, Glob, Grep, WebSearch, WebFetch |
| **code-reviewer** | Sonnet | 코드 리뷰, 버그/보안 검토 | Read, Glob, Grep, Bash |
| **planner** | Opus | 구현 계획 수립, 작업 분해 | Read, Glob, Grep, WebSearch |
| **frontend-designer** | Sonnet | Figma → 코드 변환 | Read, Edit, Write, Bash, Figma MCP |
| **librarian** | Sonnet | 문서 탐색, 리서치 | Read, Glob, Grep, WebSearch, WebFetch, Context7 MCP |
| **debugger** | Sonnet | 버그 분석, 에러 추적, 로그 해석 | Read, Glob, Grep, Bash, LSP, Edit |
| **formatter** | Haiku | 코드 포매팅, 스타일 정리, 린팅 | Read, Edit, Glob, Grep, Bash |
| **test-writer** | Sonnet | 테스트 코드 작성 (unit, integration, e2e) | Read, Glob, Grep, Edit, Write, Bash |
| **refactorer** | Sonnet | 코드 리팩토링, 구조 개선 | Read, Glob, Grep, Edit, Write, Bash, LSP |

## 서브에이전트 파일 구조

```yaml
---
name: agent-name
description: 에이전트 설명
model: opus | sonnet | haiku
tools:
  - Read
  - Glob
  - Grep
  - mcp__context7  # MCP 도구
---

# 시스템 프롬프트

에이전트의 역할과 행동 지침...
```

## 사용 방법

### 1. Task 도구로 호출 (자동)
Claude가 필요 시 자동으로 적절한 서브에이전트 호출

### 2. 명시적 요청
```
"oracle에게 이 아키텍처 리뷰 요청해줘"
"code-reviewer로 이 PR 검토해줘"
"planner로 구현 계획 세워줘"
```

### 3. 병렬 실행
서브에이전트는 독립적으로 실행되어 병렬 처리 가능

## 서브에이전트 vs 스킬

| | 서브에이전트 | 스킬 |
|---|-------------|------|
| **실행** | 별도 프로세스 | 같은 컨텍스트 |
| **컨텍스트** | 독립 (격리됨) | 공유 |
| **용도** | 병렬 작업, 전문 분석 | 프롬프트 템플릿 |
| **위치** | `.claude/agents/` | `.claude/commands/` |

## 커스텀 서브에이전트 추가

1. `.claude/agents/`에 마크다운 파일 생성
2. YAML frontmatter로 설정 정의
3. 본문에 시스템 프롬프트 작성
4. Claude Code 재시작

## 모델 선택 가이드

| 모델 | 용도 | 비용 |
|------|------|------|
| **opus** | 복잡한 추론, 아키텍처 결정 | 높음 |
| **sonnet** | 일반 작업, 코드 리뷰 | 중간 |
| **haiku** | 빠른 탐색, 단순 작업 | 낮음 |

## MCP 의존성

일부 에이전트는 MCP(Model Context Protocol) 서버에 의존합니다.

### 의존성 목록

| 에이전트 | MCP | 용도 | 필수 여부 |
|---------|-----|------|----------|
| **frontend-designer** | figma | Figma 디자인 데이터 조회 | 선택 (없으면 수동 입력) |
| **librarian** | context7 | 최신 라이브러리 문서 조회 | 선택 (없으면 WebSearch 사용) |
| **code-reviewer** | github | GitHub PR/이슈 조회 | 선택 (gh CLI로 대체 가능) |

### MCP 설치 방법

1. `mcp/mcp.json`을 `~/.claude/` 또는 프로젝트 `.claude/`에 복사
2. 환경 변수 설정 (필요시):
   ```bash
   # Figma MCP 사용 시
   export FIGMA_ACCESS_TOKEN="your-figma-token"

   # GitHub MCP 사용 시 (방법 1: gh CLI OAuth - 권장)
   gh auth login
   export GITHUB_PERSONAL_ACCESS_TOKEN=$(gh auth token)

   # GitHub MCP 사용 시 (방법 2: PAT 직접 설정)
   export GITHUB_PERSONAL_ACCESS_TOKEN="your-github-token"
   ```
3. Claude Code 재시작

### MCP 없이 사용

MCP가 설치되지 않아도 에이전트는 동작합니다:
- **frontend-designer**: Figma URL 대신 디자인 스펙을 텍스트로 제공
- **librarian**: WebSearch/WebFetch로 문서 검색

## 참고

- [Claude Code Subagents 문서](https://code.claude.com/docs/en/sub-agents)
- [awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
