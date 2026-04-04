# crew-curation-tool-2b Completion Report

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | Route Builder UX 개선 (Phase 2B) |
| 시작일 | 2026-03-28 |
| 완료일 | 2026-03-28 |
| Match Rate | 96% |
| 파일 수 | 4개 (신규 2 + 수정 2) |
| 의존성 추가 | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities |

### Value Delivered

| 관점 | 결과 |
|------|------|
| **Problem** | Route Builder에서 Spot 순서 변경이 ChevronUp/Down만 가능, 도보시간 수동 입력, 거리 정보 부재 |
| **Solution** | dnd-kit 드래그 앤 드롭 정렬, Haversine 자동 거리/시간 계산, Route 요약 패널 |
| **Function UX Effect** | Spot 순서를 드래그로 직관적 변경, 거리/시간 자동 표시로 입력 부담 제거, Route 전체 소요시간 한눈에 파악 |
| **Core Value** | Route 구성 시간 ~60% 단축 추정, 데이터 정확성 향상으로 런칭 목표(15~20 Route) 달성 가속 |

## 1. 구현 내용

### 1.1 신규 파일

| 파일 | 설명 | LOC |
|------|------|-----|
| `src/utils/geo.ts` | Haversine 거리 계산 + 도보시간 추정 유틸 | ~55 |
| `src/components/curation/RouteSummary.tsx` | Route 요약 패널 (총 거리/시간/Spot수) | ~45 |

### 1.2 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/curation/SpotLineSpotList.tsx` | ChevronUp/Down → dnd-kit 드래그 정렬, 자동 거리/시간 배지 추가, 수동 오버라이드 지원 |
| `src/pages/RouteBuilder.tsx` | useMemo로 distances 자동 계산, RouteSummary 추가, submit 시 distanceToNext 포함 |

## 2. Gap Analysis 결과

- **Match Rate**: 96% (35항목 중 33 일치, 1 변경, 1 추가)
- **변경**: RouteSummary의 `estimatedTotalMin` prop → 내부 계산으로 변경 (prop drilling 감소)
- **추가**: geo.ts에 (0,0) 좌표 방어 로직 추가 (Place API에서 좌표 없는 경우 대응)

## 3. 빌드 상태

- vite build: 20 modules transformed 성공
- 기존 Partner 파일의 `@tanstack/react-query` import 에러 (Phase 2B 범위 외, Phase 8에서 해결 예정)

## 4. 다음 단계

- Archive 후 Feature 3/3 `qr-system-integration` 진행
