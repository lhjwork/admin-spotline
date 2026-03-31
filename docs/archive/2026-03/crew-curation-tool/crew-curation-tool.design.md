# Design: Crew Curation Tool — 크루 큐레이션 도구 개선 (Phase 2A)

| Item | Detail |
|------|--------|
| Feature | crew-curation-tool (Phase 2A: Quick Spot + Bulk) |
| Plan Reference | `docs/01-plan/features/crew-curation-tool.plan.md` |
| Created | 2026-03-28 |
| Status | Design |

---

## 1. Implementation Checklist

### Step 1: Utility (PlaceInfo → CreateSpotRequest 변환)

| # | Item | File | Type | Description |
|---|------|------|------|-------------|
| 1-1 | placeToSpotRequest | `src/utils/placeConverter.ts` | new | PlaceInfo → CreateSpotRequest 자동 변환 함수. title, address, area, category, placeId 자동 매핑 |

### Step 2: Quick Spot 등록 UI

| # | Item | File | Type | Description |
|---|------|------|------|-------------|
| 2-1 | QuickSpotForm | `src/components/curation/QuickSpotForm.tsx` | new | Place 선택 후 crewNote + tags만 입력하는 간소화 폼. PlaceInfo props 받아 자동 채움 필드 표시 |
| 2-2 | PlaceSearchResultCard 개선 | `src/components/curation/PlaceSearchResultCard.tsx` | modify | 체크박스 + "바로 등록" 버튼 추가. bulkMode prop 지원 |
| 2-3 | PlaceSearchPanel 개선 | `src/components/curation/PlaceSearchPanel.tsx` | modify | bulkMode prop 추가. 다중 선택 시 선택 카운트 표시. onBulkSelect 콜백 |

### Step 3: Bulk 큐레이션 모드

| # | Item | File | Type | Description |
|---|------|------|------|-------------|
| 3-1 | BulkCurationPanel | `src/components/curation/BulkCurationPanel.tsx` | new | 선택된 Place 목록 + 개별/일괄 crewNote 입력 + 일괄 등록 버튼. bulkCreate API 연결 |
| 3-2 | BulkResultToast | `src/components/curation/BulkResultToast.tsx` | new | 일괄 등록 결과 토스트. 성공/실패 건수 표시 |

### Step 4: SpotCuration 페이지 리팩토링

| # | Item | File | Type | Description |
|---|------|------|------|-------------|
| 4-1 | SpotCuration 리팩토링 | `src/pages/SpotCuration.tsx` | modify | Quick Spot 모드(기본) + Bulk 모드 토글. PlaceSearchPanel → QuickSpotForm/BulkCurationPanel 연결 |

### Step 5: Dashboard 통계 강화

| # | Item | File | Type | Description |
|---|------|------|------|-------------|
| 5-1 | AreaHeatmap | `src/components/dashboard/AreaHeatmap.tsx` | new | 20개 지역 × Spot 수 히트맵 그리드. 색상 강도로 밀도 표현 |
| 5-2 | CategoryPieChart | `src/components/dashboard/CategoryPieChart.tsx` | new | SpotCategory별 분포 파이차트. recharts 활용 |
| 5-3 | CurationGoalDetail | `src/components/dashboard/CurationGoalDetail.tsx` | new | 지역별 목표 달성률 상세 (목표 지역 7개 × 목표 Spot 수) |
| 5-4 | Dashboard 개선 | `src/pages/Dashboard.tsx` | modify | AreaHeatmap + CategoryPieChart + CurationGoalDetail 추가 |

**총 파일: 10개** (new 6 + modify 4)

---

## 2. Detailed Specifications

### 2.1 PlaceInfo → CreateSpotRequest 변환 (`src/utils/placeConverter.ts`)

```typescript
import type { PlaceInfo, CreateSpotRequest } from "../types/v2";
import { mapPlaceCategoryToSpotCategory, extractAreaFromAddress } from "../constants";

export function placeToSpotRequest(place: PlaceInfo, crewNote?: string, tags?: string[]): CreateSpotRequest {
  return {
    title: place.name,
    address: place.address,
    latitude: 0,        // Place API에 좌표가 없으면 0 (SpotFormPanel에서 주소 검색으로 보완)
    longitude: 0,
    area: extractAreaFromAddress(place.address),
    category: mapPlaceCategoryToSpotCategory(place.category),
    source: "CREW",
    crewNote: crewNote || undefined,
    tags: tags || [],
    naverPlaceId: place.provider === "naver" ? place.placeId : undefined,
    kakaoPlaceId: place.provider === "kakao" ? place.placeId : undefined,
  };
}
```

### 2.2 QuickSpotForm (`src/components/curation/QuickSpotForm.tsx`)

```typescript
interface QuickSpotFormProps {
  place: PlaceInfo;
  onSubmit: (data: CreateSpotRequest) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}
```

**Layout**:
```
┌─────────────────────────────────────────┐
│ 📍 카페 이름 (자동)          [취소]     │
│ 성수동 123-45 (자동)                     │
│ 카테고리: 카페 (자동) | 지역: 성수 (자동)│
├─────────────────────────────────────────┤
│ crewNote *                               │
│ ┌─────────────────────────────────────┐ │
│ │ 한줄 추천 코멘트 입력...             │ │
│ └─────────────────────────────────────┘ │
│ 태그                                     │
│ ┌─────────────────────────────────────┐ │
│ │ 성수카페, 디저트 (콤마 구분)        │ │
│ └─────────────────────────────────────┘ │
│                              [등록하기]  │
└─────────────────────────────────────────┘
```

**동작**:
- Place 정보는 읽기 전용 표시 (title, address, category, area)
- crewNote 필수 입력 (textarea, 100자 이내 권장)
- tags 선택 입력 (콤마 구분 문자열)
- "등록하기" 클릭 → `placeToSpotRequest(place, crewNote, tags)` → `spotAPI.create()`
- 성공 시 onCancel 호출 + 성공 토스트

### 2.3 PlaceSearchResultCard 개선 (`modify`)

**추가 props**:
```typescript
interface PlaceSearchResultCardProps {
  place: PlaceInfo;
  onSelect: (place: PlaceInfo) => void;
  selected?: boolean;
  bulkMode?: boolean;           // NEW: 체크박스 표시 여부
  checked?: boolean;            // NEW: 체크 상태
  onCheckChange?: (checked: boolean) => void;  // NEW: 체크 변경
  onQuickRegister?: (place: PlaceInfo) => void; // NEW: "바로 등록" 클릭
}
```

**변경**:
- `bulkMode=true`: 좌측에 체크박스 표시, 기존 "선택" 버튼 → "바로 등록" 버튼으로 변경
- `bulkMode=false` (기본): 기존 동작 유지 (하위 호환)
- "바로 등록" 버튼 클릭 시 `onQuickRegister` 호출

### 2.4 PlaceSearchPanel 개선 (`modify`)

**추가 props**:
```typescript
interface PlaceSearchPanelProps {
  onSelect: (place: PlaceInfo) => void;
  selectedPlaceId?: string | null;
  bulkMode?: boolean;                    // NEW
  checkedPlaces?: PlaceInfo[];           // NEW: 선택된 Place 목록
  onCheckedChange?: (places: PlaceInfo[]) => void;  // NEW
  onQuickRegister?: (place: PlaceInfo) => void;      // NEW
}
```

**변경**:
- `bulkMode=true`: PlaceSearchResultCard에 bulkMode 전달
- 하단에 "N개 선택됨" 배지 표시
- 내부에 `checkedIds: Set<string>` 상태 관리 (placeId 기반)

### 2.5 BulkCurationPanel (`src/components/curation/BulkCurationPanel.tsx`)

```typescript
interface BulkCurationPanelProps {
  places: PlaceInfo[];
  onComplete: () => void;
  onRemove: (placeId: string) => void;
}
```

**Layout**:
```
┌─────────────────────────────────────────┐
│ 일괄 등록 (3개 선택)                     │
├─────────────────────────────────────────┤
│ 기본 crewNote (선택)                     │
│ ┌─────────────────────────────────────┐ │
│ │ 모든 Spot에 적용할 기본 코멘트       │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ☑ 카페 A — 성수 · 카페                  │
│   crewNote: [_____________]  [✕ 제거]  │
│ ☑ 카페 B — 성수 · 카페                  │
│   crewNote: [_____________]  [✕ 제거]  │
│ ☑ 바 C — 을지로 · 바                    │
│   crewNote: [_____________]  [✕ 제거]  │
├─────────────────────────────────────────┤
│ [전체 취소]              [3개 일괄 등록] │
└─────────────────────────────────────────┘
```

**동작**:
- 개별 crewNote 미입력 시 기본 crewNote 적용
- "일괄 등록" 클릭 → `placeToSpotRequest()` × N → `spotAPI.bulkCreate(requests)`
- 결과: BulkResultToast로 성공/실패 건수 표시
- 전체 성공 시 onComplete 호출 + 선택 초기화

### 2.6 BulkResultToast (`src/components/curation/BulkResultToast.tsx`)

```typescript
interface BulkResultToastProps {
  total: number;
  success: number;
  onClose: () => void;
}
```

- 성공: 녹색 배경. "N개 Spot이 등록되었습니다"
- 부분 실패: 노란색 배경. "N개 성공, M개 실패"
- 전체 실패: 빨간색 배경. "등록에 실패했습니다"
- 3초 후 자동 사라짐 또는 X 버튼

### 2.7 SpotCuration 리팩토링 (`modify`)

**현재**: SpotFormPanel (전체 수동 입력) + 카카오맵 확인

**개선**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Spot 큐레이션                                                    │
│ [Quick 모드] [Bulk 모드] [수동 입력]    ← 모드 탭               │
├───────────────────────────────┬─────────────────────────────────┤
│ Place 검색                    │ Quick: QuickSpotForm            │
│ ┌───────────────────────────┐ │ Bulk: BulkCurationPanel         │
│ │ PlaceSearchPanel          │ │ 수동: SpotFormPanel (기존 유지)  │
│ │ (bulkMode=현재모드)        │ │                                 │
│ └───────────────────────────┘ │                                 │
└───────────────────────────────┴─────────────────────────────────┘
```

**모드**:
- `quick` (기본): Place 검색 → 카드 "바로 등록" 클릭 → 우측에 QuickSpotForm
- `bulk`: Place 검색 → 체크박스 다중 선택 → 우측에 BulkCurationPanel
- `manual`: 기존 SpotFormPanel (주소 검색 → 전체 필드 수동 입력) + 카카오맵

**상태**:
```typescript
type CurationMode = "quick" | "bulk" | "manual";
const [mode, setMode] = useState<CurationMode>("quick");
const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null>(null);  // quick mode
const [checkedPlaces, setCheckedPlaces] = useState<PlaceInfo[]>([]);         // bulk mode
```

### 2.8 Dashboard 통계 컴포넌트

#### AreaHeatmap (`src/components/dashboard/AreaHeatmap.tsx`)

```typescript
interface AreaHeatmapProps {
  areaCounts: { area: string; count: number }[];
}
```

- AREAS 20개 지역을 4×5 그리드로 표시
- 색상: count에 비례 (0=gray-100, 1-5=blue-100, 6-20=blue-300, 21+=blue-500)
- 각 셀: 지역명 + count

#### CategoryPieChart (`src/components/dashboard/CategoryPieChart.tsx`)

```typescript
interface CategoryPieChartProps {
  categoryCounts: { category: string; label: string; count: number }[];
}
```

- recharts PieChart 사용 (이미 dependencies에 있음)
- SPOT_CATEGORIES 라벨 사용
- 색상: 카테고리별 고유색 배정

#### CurationGoalDetail (`src/components/dashboard/CurationGoalDetail.tsx`)

```typescript
interface CurationGoalDetailProps {
  goals: { area: string; target: number; current: number }[];
  totalTarget: number;
  totalCurrent: number;
}
```

- 목표 지역 7개 (성수, 을지로, 연남, 홍대, 이태원, 한남, 종로)
- 각 지역별 프로그레스 바 + N/M 표시
- 전체 목표 달성률 (총 300 Spot 기준)

#### Dashboard 개선 (`modify`)

**추가 데이터 쿼리**:
- 전체 20개 지역 Spot 수 (현재 5개 → 20개)
- 카테고리별 Spot 수: 10개 카테고리 각각 `spotAPI.getList({ category, page:1, size:1 })`

**레이아웃 추가 (기존 하단)**:
```
┌─────────────────────────────────────────────────┐
│ 기존: 총 Spot/Route 카드 + CurationProgress     │
├─────────────────┬───────────────────────────────┤
│ AreaHeatmap     │ CategoryPieChart              │
│ (20개 지역)     │ (10개 카테고리)                │
├─────────────────┴───────────────────────────────┤
│ CurationGoalDetail                               │
│ (목표 지역 7개 달성률)                            │
└─────────────────────────────────────────────────┘
```

---

## 3. Data Flow

### Quick Spot Flow
```
PlaceSearchPanel → onQuickRegister(place) → setSelectedPlace(place)
  → QuickSpotForm(place) → crewNote 입력 → placeToSpotRequest()
  → spotAPI.create() → 성공 → invalidateQueries → selectedPlace = null
```

### Bulk Flow
```
PlaceSearchPanel → onCheckedChange(places) → setCheckedPlaces(places)
  → BulkCurationPanel(places) → 개별 crewNote 입력
  → placeToSpotRequest() × N → spotAPI.bulkCreate(requests)
  → BulkResultToast → onComplete → checkedPlaces = []
```

---

## 4. Existing Code Reuse

| Existing | Reused In | Notes |
|----------|-----------|-------|
| `PlaceSearchResultCard` | Step 2-2 (modify) | 체크박스 + 바로 등록 추가 |
| `PlaceSearchPanel` | Step 2-3 (modify) | bulkMode 지원 |
| `SpotFormPanel` | SpotCuration manual mode | 기존 그대로 유지 |
| `CurationProgress` | Dashboard | 기존 유지 |
| `spotAPI.create()` | QuickSpotForm | 기존 API |
| `spotAPI.bulkCreate()` | BulkCurationPanel | 기존 API (UI 없었음) |
| `mapPlaceCategoryToSpotCategory()` | placeConverter | 기존 유틸리티 |
| `extractAreaFromAddress()` | placeConverter | 기존 유틸리티 |
| recharts | CategoryPieChart | 기존 dependency |

---

## 5. Implementation Order

```
Step 1: Utility            → placeConverter.ts (1-1)
Step 2: Quick Spot         → QuickSpotForm + PlaceSearchResultCard + PlaceSearchPanel 개선 (2-1 ~ 2-3)
Step 3: Bulk Mode          → BulkCurationPanel + BulkResultToast (3-1 ~ 3-2)
Step 4: Page Integration   → SpotCuration 리팩토링 (4-1)
Step 5: Dashboard          → AreaHeatmap + CategoryPieChart + CurationGoalDetail + Dashboard 개선 (5-1 ~ 5-4)
```

각 Step 완료 후 `pnpm build` 검증.

---

## 6. Error & Empty States

| Scenario | UI |
|----------|-----|
| Place 검색 결과 없음 | "검색 결과가 없습니다" (기존 유지) |
| Quick Spot 등록 실패 | QuickSpotForm 하단 에러 메시지 |
| Bulk 등록 부분 실패 | BulkResultToast 노란색 "N개 성공, M개 실패" |
| Bulk 전체 실패 | BulkResultToast 빨간색 + 재시도 안내 |
| 카테고리 매핑 실패 | "OTHER" fallback (기존 동작) |
| area 추출 실패 | area 빈 문자열 → QuickSpotForm에서 수동 선택 드롭다운 |
