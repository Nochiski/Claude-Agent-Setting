# Comprehensive Project Rules Template

이 파일은 프로젝트에 적용할 수 있는 종합 규칙 템플릿입니다.
필요한 섹션만 선택하여 프로젝트의 `CLAUDE.md`에 통합하세요.

---

# Architecture Knowledge Base (README / docs Policy)
- 프로젝트 공통 개념/규칙/패턴/용어/디자인 결정은 "Knowledge Base"로서
  현재 리포지토리의 README(또는 /docs 디렉토리)에 누적 관리한다.
  - 폴더별(주제별)로 문서를 분리한다(예: docs/backend/, docs/async/, docs/logging/, docs/device-io/, docs/api-style/, docs/testing/, docs/deployment/).
  - 각 문서에는 최소한: 개념 설명, 표준 패턴(Do/Don't), 코드 예시, 체크리스트를 포함한다.

- 새로운 하위 개념(예: 특정 장치/프로토콜/프레임워크/도메인)이 생기면,
  - README에는 요약 + 링크(목차)를 추가하고,
  - 상세는 docs/<topic>/ 아래 문서로 분리한다.
  - "언제 이 문서를 참조해야 하는지(적용 범위)"를 문서 상단에 명시한다.

- 코드 작성/수정/리뷰 시에는 항상 다음 우선순위를 따른다:
  1) 현재 코드의 기존 패턴/구조
  2) README/docs에 정의된 표준 패턴
  - 문서와 충돌하는 변경은 금지한다. 불가피하면 PR 설명에
    "충돌 지점 + 변경 이유 + 문서 업데이트"를 포함한다.

- 새로운 패턴 도입 또는 기존 패턴을 깨는 변경이 있으면,
  - 코드 변경과 함께 README/docs 업데이트를 반드시 포함한다.
  - 문서 업데이트 없이 코드만 바꾸는 PR은 불완전한 것으로 간주한다.

- 답변/패치에는 항상 관련 README/docs 참조 위치를 포함한다:
  - 예: "참조: docs/async/cancellation.md", "참조: README > Logging 섹션"
  - 문서가 아직 없으면, 추가해야 할 문서 파일 경로와 목차 항목을 제안한다.

# Versioning Policy
- 기본 버저닝 규칙:
  - 작은 변경(버그픽스/작은 기능 추가/리팩토링 등)은 patch를 올린다: 0.0.1씩 증가.
  - 큰 규모 수정(설계 변경, 호환성 영향, 대규모 기능 추가/모듈 구조 변경 등)은 minor를 올린다: 0.1.0 증가(필요 시 누적 반영).

- 버전 변경이 필요해 보이면, 답변/PR 제안에 반드시 포함한다:
  - "이번 변경은 patch(0.0.1) / minor(0.1.0) 중 무엇이 맞는지"를 판단 근거와 함께 제안한다.
  - API/동작/설정 변경이 있으면 CHANGELOG 또는 릴리즈 노트(최소 bullet) 업데이트를 함께 제안한다.

- 프로젝트에 기존 버전 파일(pyproject.toml/package.json/assembly info 등)이 있으면 그 방식을 우선한다.


# Communication
- 기본 응답 언어: 한국어. (코드/식별자/커밋 메시지는 영어 OK)
- 답변 형식: 결론 → 근거 → (대안 1개) → 다음 액션 순서로 간결하게.
- 모호하면 "가정"을 먼저 명시하고 진행한다. 진행이 막히는 핵심 정보만 질문 1~2개로 제한한다.
- 항상 실행 가능한 다음 액션(명령어/파일 경로/수정 위치)을 포함한다.
- 장황한 설명/옵션 나열 금지. 선택지는 최대 2개까지만 제시한다.

# Code generation & edits (global)
- 프로젝트의 기존 패턴/구조/의존성을 최우선으로 따른다. 불필요한 리팩토링/재포맷 금지.
- 변경은 "최소 diff" 원칙: 필요한 파일만 수정한다. 새 파일은 꼭 필요할 때만 만들고 이유/역할을 1줄로 적는다.
- 새로운 라이브러리/툴 추가는 금지. 반드시 "기존 의존성으로 가능한 대안"을 먼저 제시한다.
  - 불가피한 경우에만: 이유 + 설치 방법 + 롤백 방법을 함께 제공한다.
- 답변 구성은 가능하면: (1) 변경 요약 (2) 코드/패치 (3) 검증 방법(테스트/실행 커맨드).

# Security / Reliability (핵심)
- Secret/Key/Token/PII 하드코딩 및 로깅 금지. 환경변수/시크릿 사용이 기본.
- async 내부 블로킹 호출 금지. 네트워크/외부 I/O는 기본적으로 timeout을 포함한다.
- 리소스 정리(연결/락/파일)는 try/finally 또는 (async) context manager로 보장한다.
- 예외는 구체적으로 잡고(broad except 지양), 에러 로그에는 원인 예외(chain)를 유지한다.

# Python (if applicable)
- 타입 힌트 필수. 공용 API는 docstring에 Args/Returns/Raises를 명시한다.
- Pydantic / dataclass로 입출력 타입을 명확히 한다(프로젝트 기존 패턴 우선).
- assert로 런타임 검증하지 말고 명시적 예외(ValueError/RuntimeError 등) 사용.
- 외부 Device(TCP/Serial) 통신 테스트는 항상 Mock 처리(실장치 의존 금지).
- 실장치 실행 예제는 "실행 가능한 python 파일"로 제공한다.

# TypeScript/React/Next (if applicable)
- any 금지(불가피하면 이유 + 대안 타입 제시). 먼저 타입을 설계한다.
- React는 함수형 컴포넌트 + 명확한 props 타입 사용.
- 에러/로딩/빈 상태를 빠뜨리지 않는다.

# When you propose a solution
- "가장 추천 1안" + "심플 대안 1안"만 제시한다.
- 가능하면 재현/검증 스텝(테스트/실행 커맨드/기대 결과)을 포함한다.
- API 변경 시 관련 문서(.env.example, README/docs 등) 업데이트를 함께 포함한다.
