# Agent Orchestration Rules

You have access to specialized subagents. **Automatically delegate** tasks to the appropriate agent.

## Available Subagents

| Agent | Use When |
|-------|----------|
| `oracle` | Architecture decisions, tech stack choices, complex design reviews, strategic planning |
| `code-reviewer` | Code review requests, PR reviews, security audits, bug hunting |
| `planner` | Implementation planning, task breakdown, project scoping |
| `frontend-designer` | UI implementation, Figma-to-code, component creation |
| `librarian` | Documentation lookup, API research, finding code examples |
| `debugger` | Bug analysis, error tracking, log interpretation, stack trace analysis |
| `formatter` | Code formatting, style fixes, import organization, lint fixes |
| `test-writer` | Test code writing (unit, integration, e2e), TDD, coverage improvement |
| `refactorer` | Code refactoring, structure improvement, pattern application |

## Auto-Delegation Rules

### Use `oracle` when:
- User asks about architecture or system design
- Evaluating technology choices
- Large-scale refactoring decisions
- "이게 좋은 설계야?", "어떤 방식이 나을까?"

### Use `code-reviewer` when:
- User asks to review code or PR
- Looking for bugs or security issues
- Code quality assessment
- "이 코드 리뷰해줘", "버그 있는지 봐줘"

### Use `planner` when:
- User describes a feature to implement
- Breaking down complex tasks
- "이거 어떻게 구현하지?", "계획 세워줘"

### Use `frontend-designer` when:
- UI/UX implementation tasks
- Figma links are provided
- Component styling work
- "이 디자인 구현해줘", "컴포넌트 만들어줘"

### Use `librarian` when:
- Need to research documentation
- Finding implementation examples
- API usage questions
- 프로젝트 구조 확인/분석
- 폴더 구조 탐색
- 파일 목록 조회
- 코드베이스 전체 파악
- "이 라이브러리 어떻게 써?", "예시 찾아줘"
- "구조 확인해줘", "폴더 확인해봐", "어떤 파일이 있어"

### Use `debugger` when:
- Error messages or stack traces appear
- User reports a bug or unexpected behavior
- Log analysis needed
- "왜 에러나?", "이 버그 찾아줘", "로그 분석해줘"

### Use `formatter` when:
- Code needs formatting or style fixes
- Import organization needed
- Lint errors to fix
- "코드 정리해줘", "포매팅해줘", "import 정리해줘"

### Use `test-writer` when:
- Test code needs to be written
- TDD approach requested
- Test coverage improvement needed
- "테스트 작성해줘", "테스트 추가해줘"
- "unit test", "커버리지 올려줘"

### Use `refactorer` when:
- Code refactoring requested
- Code structure improvement needed
- Duplicate code removal
- "리팩토링해줘", "코드 개선해줘"
- "중복 제거", "구조 개선"

## Role Disambiguation (역할 구분)

비슷한 역할의 에이전트 선택 기준:

### 버그 관련: `code-reviewer` vs `debugger`
| 상황 | 선택 |
|------|------|
| 에러 메시지/스택 트레이스 있음 | `debugger` |
| "왜 안 돼?", 런타임 에러 | `debugger` |
| PR 리뷰, 코드 품질 검토 | `code-reviewer` |
| "버그 있는지 봐줘" (예방적) | `code-reviewer` |

### 코드 분석: `librarian` vs `code-reviewer`
| 상황 | 선택 |
|------|------|
| 프로젝트 구조/파일 탐색 | `librarian` |
| 외부 라이브러리 문서 조사 | `librarian` |
| 특정 코드의 품질/버그 검토 | `code-reviewer` |
| 보안 취약점 분석 | `code-reviewer` |

### 코드 수정: `formatter` vs `refactorer`
| 상황 | 선택 |
|------|------|
| 들여쓰기, 스타일, import 정리 | `formatter` |
| 린트 에러 수정 | `formatter` |
| 구조 변경, 패턴 적용 | `refactorer` |
| 중복 제거, 함수 분리 | `refactorer` |

## Delegation Pattern

When delegating, use the Task tool with the appropriate subagent:

```
Task(subagent_type="oracle", prompt="Review this architecture...")
Task(subagent_type="code-reviewer", prompt="Review this code for bugs...")
```

## Parallel Execution (병렬 실행)

독립적인 작업은 여러 서브에이전트를 병렬로 실행하여 효율성을 높입니다.

### 병렬 실행 가능 조합
| 조합 | 사용 시나리오 |
|------|--------------|
| `code-reviewer` + `test-writer` | 코드 리뷰하면서 테스트 작성 |
| `oracle` + `librarian` | 아키텍처 검토 + 문서 조사 |
| `planner` + `librarian` | 구현 계획 + 기술 조사 |
| `debugger` + `librarian` | 버그 분석 + 관련 문서 검색 |
| `formatter` + `test-writer` | 코드 정리 + 테스트 추가 |

### 순차 실행 필요 (직렬)
| 순서 | 이유 |
|------|------|
| `planner` → `frontend-designer` | 계획 완료 후 구현 |
| `code-reviewer` → `refactorer` | 리뷰 결과 반영하여 리팩토링 |
| `debugger` → `test-writer` | 버그 수정 후 회귀 테스트 작성 |

### 사용 예시
```
# 병렬 실행 (한 번에 여러 Task 호출)
Task(subagent_type="code-reviewer", prompt="...")
Task(subagent_type="test-writer", prompt="...")

# 순차 실행 (결과 기다린 후 다음 실행)
result = Task(subagent_type="planner", prompt="...")
Task(subagent_type="frontend-designer", prompt=f"Based on plan: {result}...")
```

## Output Format Guide (출력 형식 가이드)

모든 서브에이전트는 다음 공통 구조를 따릅니다:

```markdown
## [에이전트명] 결과

### 요약
[1-2줄 핵심 내용]

### 상세
[본문 내용 - 에이전트별 고유 형식]

### 액션 아이템 (해당시)
- [ ] 항목 1
- [ ] 항목 2

### 참고 (해당시)
- 관련 파일: `path/to/file.ts:123`
- 출처: [링크]
```

## Version Impact Rule (버전 영향 규칙)

**모든 코드 변경 제안 시 버전 영향을 판단하고 제시:**

### 판단 기준
| 변경 유형 | 버전 | 예시 |
|----------|------|------|
| 버그 수정, 내부 리팩토링 | patch (0.0.1) | 로직 수정, 성능 개선 |
| 새 기능, API/옵션 추가 | minor (0.1.0) | 엔드포인트 추가 |
| Breaking change | major (1.0.0) | API 삭제, 시그니처 변경 |

### 출력 형식
```markdown
### 버전 영향
- 권장: patch/minor/major (0.0.1)
- 근거: [판단 이유]

### CHANGELOG 제안 (API/동작/설정 변경시)
- Added/Changed/Fixed/Removed: [설명]
```

### 규칙
- 프로젝트에 버전 파일(pyproject.toml, package.json 등)이 있으면 그 방식 우선
- API/동작/설정 변경 시 CHANGELOG 업데이트 제안 필수

## Subagent Result Trust Rules (서브에이전트 결과 신뢰 규칙)

### 핵심 원칙
**서브에이전트의 결과를 신뢰하고 동일 작업을 재수행하지 않는다.**

### 신뢰 기준
| 서브에이전트 응답 | 메인 에이전트 행동 |
|------------------|-------------------|
| "재검증 필요: 불필요" | 결과를 그대로 사용, 재탐색 금지 |
| "신뢰도: ✅ 확실" | 추가 확인 없이 결과 채택 |
| "신뢰도: ⚠️ 부분 확실" | 필요시 추가 질문만 허용 |
| "신뢰도: ❓ 추가 확인 필요" | 재검증 수행 가능 |

### 금지 행동
- ❌ librarian이 탐색한 파일을 다시 Glob/Grep으로 검색
- ❌ code-reviewer가 리뷰한 코드를 다시 읽어서 확인
- ❌ 서브에이전트 결과를 무시하고 처음부터 재작업
- ❌ "확인을 위해" 동일 작업 반복

### 허용 행동
- ✅ 서브에이전트 결과를 사용자에게 요약/전달
- ✅ 결과 기반으로 다음 단계 진행
- ✅ 추가 정보가 필요하면 **다른** 서브에이전트에 위임
- ✅ 사용자가 명시적으로 재확인 요청 시에만 재탐색

### 불확실성 처리
서브에이전트 결과가 불충분하다고 판단되면:
1. 동일 서브에이전트에 **구체적인 추가 질문**으로 재위임
2. 직접 재작업하지 않음
3. 예: `Task(subagent_type="librarian", prompt="이전 탐색에서 X를 찾지 못했는데, Y 경로도 확인해줘")`

## Important

- Delegate proactively without being asked
- Use subagents for their specialized expertise
- Main agent coordinates, subagents execute
- **Trust subagent results - do not redo their work**
