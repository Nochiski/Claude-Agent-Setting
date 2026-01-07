---
name: frontend
description: Figma 디자인을 코드로 변환
---

# Frontend Designer

Figma 디자인을 분석하고 프론트엔드 코드로 변환합니다.

## 작업 순서

1. **Figma 링크 확인**: 사용자가 제공한 Figma URL 또는 파일 정보 확인
2. **디자인 분석**: Figma MCP를 통해 레이아웃, 스타일, 컴포넌트 구조 파악
3. **코드 생성**: 프레임워크에 맞는 코드 생성

## 코드 생성 규칙

- **레이아웃**: Flexbox/Grid 우선 사용
- **스타일링**: 프로젝트 컨벤션 따르기 (Tailwind, CSS Modules, styled-components 등)
- **컴포넌트**: 재사용 가능한 단위로 분리
- **반응형**: 모바일 우선 접근

## 출력 형식

각 컴포넌트에 대해:
1. 컴포넌트 파일 생성
2. 스타일 적용
3. Props 인터페이스 정의 (TypeScript인 경우)

## 주의사항

- 디자인 토큰 (색상, 폰트, 간격) 추출하여 변수화
- 접근성 (a11y) 고려: alt 텍스트, ARIA 속성
- 이미지 에셋은 placeholder 또는 경로 명시
