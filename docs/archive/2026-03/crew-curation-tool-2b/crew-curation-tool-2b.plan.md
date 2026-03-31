# crew-curation-tool-2b Plan

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | Route Builder에서 Spot 순서 변경이 ChevronUp/Down 버튼만 가능하여 비효율적이고, 도보 시간을 수동 입력해야 하며, 거리 정보가 없어 Route 품질 판단이 어려움 |
| **Solution** | dnd-kit 드래그 앤 드롭 정렬, Haversine 기반 자동 거리/도보시간 계산, Route 요약 정보 자동 집계 |
| **Function UX Effect** | Spot 순서를 드래그로 직관적 변경, 거리/시간이 자동 표시되어 입력 부담 감소, Route 전체 소요시간과 거리를 한눈에 파악 |
| **Core Value** | 크루의 Route 구성 시간 단축 및 데이터 정확성 향상으로 런칭 목표(15~20 Route) 달성 가속 |

## 1. 배경 및 목적

Phase 2A(crew-curation-tool)에서 Quick Spot + Bulk 큐레이션을 구현 완료했다.
Phase 2B에서는 Route Builder UX를 개선하여 크루가 Route를 더 빠르고 정확하게 구성할 수 있게 한다.

### 현재 문제점

1. **순서 변경 불편**: ChevronUp/ChevronDown 버튼으로만 이동 가능 → 5개 이상 Spot에서 비효율
2. **도보 시간 수동 입력**: walkingTimeToNext를 크루가 추정해서 입력 → 부정확
3. **거리 정보 부재**: distanceToNext 필드가 타입에 존재하나 활용하지 않음
4. **Route 요약 없음**: 총 소요시간, 총 거리를 한눈에 볼 수 없음

## 2. 범위

### In-Scope
- RouteSpotList 드래그 앤 드롭 정렬 (dnd-kit)
- Haversine 공식으로 Spot 간 직선거리 자동 계산
- 거리 기반 도보시간 자동 추정 (80m/min 기준)
- Route 요약 패널 (총 거리, 총 시간, Spot 수)
- 자동 계산값 수동 오버라이드 가능

### Out-of-Scope
- 카카오/네이버 도보 경로 API 연동 (실제 도보 경로)
- 지도 위 Route 시각화 (Phase 3 이후)
- Route 편집 기능 (기존 Route 수정)

## 3. 기술 스택

- **dnd-kit**: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (드래그 앤 드롭)
- **Haversine**: 순수 JS 유틸 함수 (외부 라이브러리 불필요)
- 기존 스택: React 18, react-query v3, Tailwind 3

## 4. 구현 항목

| # | 파일 | 설명 | 신규/수정 |
|---|------|------|-----------|
| 1 | `src/utils/geo.ts` | Haversine 거리 계산 + 도보시간 추정 유틸 | 신규 |
| 2 | `src/components/curation/RouteSpotList.tsx` | dnd-kit 드래그 정렬로 교체 + 자동 거리/시간 표시 | 수정 |
| 3 | `src/components/curation/RouteSummary.tsx` | Route 요약 패널 (총 거리, 총 시간, Spot 수) | 신규 |
| 4 | `src/pages/RouteBuilder.tsx` | RouteSummary 추가 + 자동 계산 로직 연결 | 수정 |

## 5. 구현 순서

1. **Step 1**: `geo.ts` — Haversine 유틸 함수
2. **Step 2**: `RouteSpotList.tsx` — dnd-kit 드래그 정렬 + 자동 거리/시간 표시
3. **Step 3**: `RouteSummary.tsx` — Route 요약 패널
4. **Step 4**: `RouteBuilder.tsx` — 통합 (자동 계산 + 요약 패널)

## 6. 성공 기준

- Spot 드래그로 순서 변경 가능
- Spot 간 거리(m)와 도보시간(분)이 자동 표시
- Route 전체 총 거리/시간이 요약 패널에 표시
- 자동 계산값을 수동으로 오버라이드 가능
- 기존 수동 입력 방식도 유지 (fallback)
