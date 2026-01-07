# Project Rules for Claude

이 파일은 프로젝트 루트에 배치하면 Claude Code가 자동으로 읽습니다.

## 사용법

1. 이 템플릿을 프로젝트 루트에 `CLAUDE.md`로 복사
2. 프로젝트에 맞게 내용 수정
3. Claude Code가 자동으로 규칙 적용

---

# 프로젝트 규칙 템플릿

## API 설계 규칙

### 엔드포인트 구조
- Prefix: `/api/v1/`
- 리소스 기반 URL 설계
- 비동기 작업: POST로 시작 → task_id 반환 → `GET /status/{task_id}`로 확인

### Request/Response
- Pydantic schema 필수 (`api/schemas/`)
- 검증 에러: 422 Unprocessable Entity + 구체적 필드 에러
- 성공 응답: 200 OK + 결과 데이터

### 에러 처리
- HTTPException 사용
- detail 필드에 에러 메시지 또는 구조화된 에러 정보
- 적절한 HTTP 상태 코드 (400, 404, 408, 422, 500 등)

## 코드 구조

### Dependency Injection
```python
from framework.hw_interface.base.hw_interface_manager import hw_interface_manager

async def my_task():
    robot = hw_interface_manager.get("YaskawaRobot")
    await robot.connect()
    try:
        await robot.run_job("MY_JOB")
    finally:
        await robot.disconnect()
```

### Task 작성
```python
from task.base_schema import BaseSchema
from task.registry import register_task

class MyTaskInput(BaseSchema):
    param: str

class MyTaskOutput(BaseSchema):
    result: str

@register_task
async def my_task(inp: MyTaskInput) -> MyTaskOutput:
    return MyTaskOutput(result=f"processed: {inp.param}")
```

## 테스트 전략

| 폴더 | 용도 | CI |
|------|------|-----|
| `tests/ci/` | Mock 기반, 외부 의존성 없음 | O |
| `tests/manual/` | 실제 하드웨어 필요 | X |

## API 변경 시

1. `api_docs/scripts/export_openapi.py` 실행
2. Breaking change → 버전업 (`pyproject.toml` + `api/main.py`)
