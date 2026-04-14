# Design: Spot Duplicate Detection

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | 크루가 Place API에서 동일 장소를 다른 검색어로 검색해 중복 Spot 등록. 300개 Cold Start 목표에서 데이터 품질 저하 위험. |
| **Solution** | 등록된 Spot의 Place ID를 React Query로 캐싱하여 검색 결과에서 즉시 중복 표시. 등록 시 경고 다이얼로그, 대량 등록 시 자동 필터링. |
| **Function UX Effect** | 검색 결과에 "등록됨" 배지 즉시 표시. 중복 등록 시도 시 기존 Spot 정보 확인 가능. 대량 등록에서 중복 자동 제거 후 결과 리포트. |
| **Core Value** | 콘텐츠 품질 보장, 크루 효율성 향상, 중복 정리 비용 사전 방지. |

**Reference**: [Plan Document](../../01-plan/features/spot-duplicate-detection.plan.md)

---

## 1. Architecture Overview

### 1.1 Data Flow

```
[Spot DB] ──GET /api/v2/spots──→ [useRegisteredPlaceIds hook]
                                       │
                                  { naver: Set<string>, kakao: Set<string>,
                                    spotMap: Map<placeKey, SpotSummary> }
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
           PlaceSearchPanel    QuickSpotForm    BulkCurationPanel
           (FR-01: 배지표시)   (FR-02: 경고)    (FR-03: 자동필터)
```

### 1.2 Key Decision: Client-Side Cache

300개 수준의 Spot 데이터에서 전체 목록을 한 번 조회하여 Place ID Set을 구성하는 것이 실용적. Backend 전용 중복 체크 API 없이 기존 `GET /api/v2/spots` 활용.

---

## 2. Detailed Design

### 2.1 `useRegisteredPlaceIds` Hook (NEW)

**File**: `src/hooks/useRegisteredPlaceIds.ts`

```typescript
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { spotAPI } from "../services/v2/spotAPI";

interface SpotSummary {
  slug: string;
  title: string;
}

interface RegisteredPlaceIds {
  naver: Set<string>;
  kakao: Set<string>;
  /** Map<"naver-{placeId}" | "kakao-{placeId}", SpotSummary> */
  spotMap: Map<string, SpotSummary>;
}

export const REGISTERED_PLACE_IDS_KEY = ["registeredPlaceIds"];

export function useRegisteredPlaceIds() {
  const query = useQuery<RegisteredPlaceIds>({
    queryKey: REGISTERED_PLACE_IDS_KEY,
    queryFn: async () => {
      const res = await spotAPI.getList({ size: 1000 });
      const spots = res.data.content;

      const naver = new Set<string>();
      const kakao = new Set<string>();
      const spotMap = new Map<string, SpotSummary>();

      for (const s of spots) {
        const summary = { slug: s.slug, title: s.title };
        if (s.naverPlaceId) {
          naver.add(s.naverPlaceId);
          spotMap.set(`naver-${s.naverPlaceId}`, summary);
        }
        if (s.kakaoPlaceId) {
          kakao.add(s.kakaoPlaceId);
          spotMap.set(`kakao-${s.kakaoPlaceId}`, summary);
        }
      }

      return { naver, kakao, spotMap };
    },
    staleTime: 5 * 60 * 1000,
  });

  const isRegistered = (provider: "naver" | "kakao", placeId: string): boolean => {
    if (!query.data) return false;
    return provider === "naver"
      ? query.data.naver.has(placeId)
      : query.data.kakao.has(placeId);
  };

  const getRegisteredSpot = (provider: "naver" | "kakao", placeId: string): SpotSummary | undefined => {
    return query.data?.spotMap.get(`${provider}-${placeId}`);
  };

  return { ...query, isRegistered, getRegisteredSpot };
}

export function useInvalidateRegisteredPlaceIds() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: REGISTERED_PLACE_IDS_KEY });
}
```

**Design Decisions**:
- `spotMap`으로 기존 Spot의 slug/title 참조 가능 (FR-04)
- `isRegistered()` 헬퍼로 컴포넌트에서 간단히 호출
- `useInvalidateRegisteredPlaceIds`로 등록/삭제 후 캐시 무효화

---

### 2.2 `PlaceSearchResultCard` 수정 (MODIFY)

**File**: `src/components/curation/PlaceSearchResultCard.tsx`

**Props 추가**:
```typescript
interface PlaceSearchResultCardProps {
  place: PlaceInfo;
  onSelect: (place: PlaceInfo) => void;
  selected?: boolean;
  bulkMode?: boolean;
  checked?: boolean;
  onCheckChange?: (checked: boolean) => void;
  onQuickRegister?: (place: PlaceInfo) => void;
  // NEW
  registered?: boolean;
  registeredSpotTitle?: string;
  registeredSpotSlug?: string;
}
```

**UI 변경**:
- `registered === true`일 때:
  - 카드 상단 우측에 `등록됨` 배지 (amber-500 배경, 흰색 텍스트, text-xs)
  - 카드 배경을 `bg-amber-50` 적용
  - "바로 등록" 버튼 텍스트를 "중복 등록" + amber 색상으로 변경
  - 배지 아래 기존 Spot 이름 표시 (text-xs, text-amber-600)
- 체크박스, 선택 기능은 비활성화하지 않음 (FR-05: 의도적 중복 허용)

---

### 2.3 `PlaceSearchPanel` 수정 (MODIFY)

**File**: `src/components/curation/PlaceSearchPanel.tsx`

**변경 사항**:
1. `useRegisteredPlaceIds` hook 호출
2. 각 `PlaceSearchResultCard`에 `registered`, `registeredSpotTitle`, `registeredSpotSlug` prop 전달

```typescript
// PlaceSearchPanel 내부
const { isRegistered, getRegisteredSpot } = useRegisteredPlaceIds();

// map 내부
{places.map((place) => {
  const key = `${place.provider}-${place.placeId}`;
  const registered = isRegistered(place.provider, place.placeId);
  const existingSpot = registered ? getRegisteredSpot(place.provider, place.placeId) : undefined;

  return (
    <PlaceSearchResultCard
      key={key}
      place={place}
      onSelect={onSelect}
      selected={selectedPlaceId === place.placeId}
      bulkMode={bulkMode}
      checked={checkedIds.has(key)}
      onCheckChange={(checked) => handleCheckChange(place, checked)}
      onQuickRegister={onQuickRegister}
      registered={registered}
      registeredSpotTitle={existingSpot?.title}
      registeredSpotSlug={existingSpot?.slug}
    />
  );
})}
```

**결과 헤더에 등록됨 카운트 표시**:
- 검색 결과 상단에 "N개 이미 등록됨" 텍스트 (amber 색상)

---

### 2.4 `DuplicateWarningDialog` (NEW)

**File**: `src/components/curation/DuplicateWarningDialog.tsx`

```typescript
interface DuplicateWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  duplicatePlace: {
    name: string;
    existingSpotTitle: string;
    existingSpotSlug: string;
  } | null;
}
```

**UI 구성**:
- Tailwind 기반 모달 오버레이 (기존 프로젝트 패턴)
- 아이콘: `AlertTriangle` (lucide-react, amber-500)
- 제목: "이미 등록된 장소입니다"
- 본문: `"{장소명}"은 이미 "{기존 Spot 이름}"으로 등록되어 있습니다.`
- 버튼: "취소" (gray) + "그래도 등록" (amber)

---

### 2.5 `QuickSpotForm` 수정 (MODIFY)

**File**: `src/components/curation/QuickSpotForm.tsx`

**변경 사항**:
1. Props에 중복 관련 정보 추가:
```typescript
interface QuickSpotFormProps {
  place: PlaceInfo;
  onSubmit: (data: CreateSpotRequest) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  // NEW
  registered?: boolean;
  registeredSpotTitle?: string;
  registeredSpotSlug?: string;
}
```

2. `registered === true`일 때:
   - 폼 상단에 경고 배너 (amber 배경)
   - "이미 등록된 장소입니다. 기존 Spot: {title}"
   - 제출 버튼 텍스트: "등록" → "중복 등록"
   - 제출 시 `DuplicateWarningDialog` 표시 → 확인 후 진행

---

### 2.6 `BulkCurationPanel` 수정 (MODIFY)

**File**: `src/components/curation/BulkCurationPanel.tsx`

**변경 사항**:
1. `useRegisteredPlaceIds` hook 호출
2. 등록할 장소 목록에서 중복 표시:
   - 각 장소 카드에 "등록됨" 배지 (amber)
   - 목록 상단에 "N개 중복 감지됨" 경고 배너

3. `handleBulkSubmit` 수정:
```typescript
const handleBulkSubmit = async () => {
  const requests = buildRequests();

  // 중복 필터링
  const { duplicates, unique } = requests.reduce(
    (acc, req) => {
      const isDup =
        (req.naverPlaceId && isRegistered("naver", req.naverPlaceId)) ||
        (req.kakaoPlaceId && isRegistered("kakao", req.kakaoPlaceId));
      if (isDup) acc.duplicates.push(req);
      else acc.unique.push(req);
      return acc;
    },
    { duplicates: [] as CreateSpotRequest[], unique: [] as CreateSpotRequest[] },
  );

  if (duplicates.length > 0) {
    // 중복 경고 표시 + 사용자 선택
    // → "중복 N개 제외하고 등록" 또는 "전체 등록" 또는 "취소"
    const confirmed = await showBulkDuplicateConfirm(duplicates.length, unique.length);
    if (confirmed === "cancel") return;
    if (confirmed === "skip-duplicates") {
      // unique만 등록
      await executeBulkCreate(unique);
    } else {
      // 전체 등록
      await executeBulkCreate(requests);
    }
  } else {
    await executeBulkCreate(requests);
  }
};
```

4. 등록 완료 후 `useInvalidateRegisteredPlaceIds()` 호출

---

## 3. Implementation Checklist

| # | Item | Type | File | Depends On |
|---|------|------|------|------------|
| 1 | `useRegisteredPlaceIds` hook | NEW | `src/hooks/useRegisteredPlaceIds.ts` | - |
| 2 | `PlaceSearchResultCard` 등록됨 배지 | MODIFY | `src/components/curation/PlaceSearchResultCard.tsx` | - |
| 3 | `PlaceSearchPanel` 중복 상태 연동 | MODIFY | `src/components/curation/PlaceSearchPanel.tsx` | #1, #2 |
| 4 | `DuplicateWarningDialog` | NEW | `src/components/curation/DuplicateWarningDialog.tsx` | - |
| 5 | `QuickSpotForm` 중복 체크 | MODIFY | `src/components/curation/QuickSpotForm.tsx` | #1, #4 |
| 6 | `BulkCurationPanel` 중복 필터링 | MODIFY | `src/components/curation/BulkCurationPanel.tsx` | #1 |

### Implementation Order

```
Step 1 (병렬 가능): #1 useRegisteredPlaceIds + #2 PlaceSearchResultCard + #4 DuplicateWarningDialog
Step 2: #3 PlaceSearchPanel (통합)
Step 3 (병렬 가능): #5 QuickSpotForm + #6 BulkCurationPanel
```

---

## 4. Cache Invalidation Strategy

| Event | Action |
|-------|--------|
| Spot 단일 등록 성공 | `invalidateQueries(REGISTERED_PLACE_IDS_KEY)` |
| Spot 대량 등록 성공 | `invalidateQueries(REGISTERED_PLACE_IDS_KEY)` |
| Spot 삭제 | `invalidateQueries(REGISTERED_PLACE_IDS_KEY)` |
| 5분 경과 (staleTime) | 자동 refetch on next access |

---

## 5. Edge Cases

| Case | Handling |
|------|----------|
| 등록된 Spot 0개 | 빈 Set, 모든 검색 결과 정상 표시 |
| 같은 장소 카카오+네이버 모두 등록 | 두 Provider 모두에서 "등록됨" 표시 |
| 네트워크 에러로 캐시 로드 실패 | 중복 체크 비활성화, 정상 등록 허용 |
| 다른 탭에서 등록 후 현재 탭 캐시 미갱신 | staleTime 5분 내 불일치 허용, 서버에서 최종 방어 |
