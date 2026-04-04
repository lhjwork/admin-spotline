# crew-curation-tool-2b Design

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | Route Builder UX 개선 (Phase 2B) |
| 파일 수 | 4개 (신규 2 + 수정 2) |
| 의존성 | @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities |

## 1. 파일별 상세 설계

### 1.1 `src/utils/geo.ts` (신규)

Haversine 공식을 사용한 두 좌표 간 직선거리 계산 유틸리티.

```typescript
// 두 좌표 간 직선거리(m)
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number;

// 거리(m) → 도보시간(분) 변환 (기본 80m/min)
export function estimateWalkingMinutes(
  distanceMeters: number,
  speedMPerMin?: number  // default: 80
): number;

// SpotLineSpotItem[] 기반 자동 계산
export function calculateRouteDistances(
  items: SpotLineSpotItem[]
): { distanceToNext: number | null; walkingTimeToNext: number | null }[];
```

- R = 6371000m (지구 반지름)
- Haversine: `a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)`
- `distance = 2R · atan2(√a, √(1-a))`
- 도보 속도: 80m/min (일반 성인 평균 ~4.8km/h)
- 마지막 Spot의 distanceToNext/walkingTimeToNext는 null

### 1.2 `src/components/curation/SpotLineSpotList.tsx` (수정)

dnd-kit 드래그 앤 드롭으로 교체.

**변경 사항:**
1. ChevronUp/ChevronDown 버튼 제거 → GripVertical 드래그 핸들로 교체
2. `@dnd-kit/core`의 DndContext + `@dnd-kit/sortable`의 SortableContext 적용
3. 각 Spot 카드를 `useSortable` hook으로 래핑
4. 자동 계산된 distanceToNext/walkingTimeToNext 표시 (읽기 전용 배지)
5. 수동 오버라이드: 배지 클릭 시 input으로 전환

**Props 변경:**
```typescript
interface SpotLineSpotListProps {
  items: SpotLineSpotItem[];
  onChange: (items: SpotLineSpotItem[]) => void;
  distances: { distanceToNext: number | null; walkingTimeToNext: number | null }[];
  // distances: geo.ts의 calculateRouteDistances() 결과
}
```

**레이아웃 (각 Spot 카드):**
```
┌──────────────────────────────────────────────┐
│ ☰  ① 성수동 카페   CAFE · 성수    [🗑 삭제] │
│    ├─ 추천시간: [14:00]  체류: [60]분         │
│    └─ → 다음까지: 350m · 도보 4분  [전환노트] │
└──────────────────────────────────────────────┘
```

- ☰ = GripVertical (드래그 핸들)
- "350m · 도보 4분" = 자동 계산값 (회색 배지), 클릭하면 수동 오버라이드
- 마지막 Spot에는 "→ 다음까지" 행 미표시

**SortableSpotCard 컴포넌트 (내부):**
- `useSortable({ id: item.spot.id })` 사용
- `attributes`, `listeners`를 드래그 핸들에 연결
- `transform`, `transition` 스타일 적용
- 드래그 중: `opacity-50` + `ring-2 ring-primary-300`

**DndContext 설정:**
- `sensors`: PointerSensor (activationConstraint: distance 5px)
- `collisionDetection`: closestCenter
- `onDragEnd`: activeId/overId로 arrayMove 후 order 재계산 + onChange 호출

### 1.3 `src/components/curation/RouteSummary.tsx` (신규)

Route 요약 정보를 보여주는 패널.

**Props:**
```typescript
interface RouteSummaryProps {
  spotCount: number;
  totalDistanceM: number;     // 총 거리(m)
  totalWalkingMin: number;    // 총 도보시간(분)
  totalStayMin: number;       // 총 체류시간(분) — items에서 stayDuration 합산
  estimatedTotalMin: number;  // 총 소요시간 = 도보 + 체류
}
```

**레이아웃:**
```
┌─────────────────────────────────────────────┐
│  📊 Route 요약                              │
│  ────────────────────────────────────────── │
│  Spot 5개 · 총 1.2km · 도보 15분 · 체류 3h │
│  예상 총 소요시간: 3시간 15분               │
└─────────────────────────────────────────────┘
```

- 거리: < 1000m → "350m", >= 1000m → "1.2km"
- 시간: < 60min → "15분", >= 60min → "3시간 15분"
- 배경: bg-blue-50, 텍스트: text-blue-900

### 1.4 `src/pages/RouteBuilder.tsx` (수정)

**변경 사항:**
1. `import { calculateRouteDistances, estimateWalkingMinutes } from "../utils/geo"` 추가
2. `useMemo`로 distances 자동 계산: items 변경 시 재계산
3. RouteSummary 컴포넌트 추가 (Route 메타데이터 폼 아래)
4. SpotLineSpotList에 `distances` prop 전달
5. submit 시 distanceToNext/walkingTimeToNext가 수동 오버라이드된 값 우선 사용

**자동 계산 흐름:**
```
items 변경 → useMemo(calculateRouteDistances(items)) → distances 배열 생성
  → SpotLineSpotList에 distances 전달 (표시용)
  → RouteSummary에 합산값 전달
  → submit 시: 수동 오버라이드 > 자동 계산값 > undefined
```

## 2. 구현 순서

| Step | 파일 | 설명 |
|------|------|------|
| 1 | `src/utils/geo.ts` | Haversine 유틸 |
| 2 | `src/components/curation/SpotLineSpotList.tsx` | dnd-kit 드래그 + 거리 표시 |
| 3 | `src/components/curation/RouteSummary.tsx` | 요약 패널 |
| 4 | `src/pages/RouteBuilder.tsx` | 통합 |

## 3. 의존성 설치

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## 4. 검증 기준

| # | 항목 | 기대 결과 |
|---|------|-----------|
| 1 | 드래그 정렬 | Spot 카드를 드래그하여 순서 변경, order 자동 재계산 |
| 2 | 거리 자동 계산 | 위도/경도 기반 직선거리(m) 자동 표시 |
| 3 | 도보시간 자동 | 거리 / 80m/min = 도보시간(분) 자동 표시 |
| 4 | 수동 오버라이드 | 자동 계산값 클릭 시 수동 입력으로 전환 |
| 5 | 요약 패널 | 총 거리/시간/Spot수 정확히 표시 |
| 6 | 빌드 성공 | vite build 에러 없음 |
