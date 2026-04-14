# Plan: Spot Duplicate Detection

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | 크루가 Place API(카카오/네이버)에서 동일 장소를 다른 검색어로 검색해 중복 Spot을 등록하는 문제. 300개 Spot 콘텐츠 목표 달성 과정에서 데이터 품질 저하 위험. |
| **Solution** | Place ID(naverPlaceId/kakaoPlaceId) 기반 중복 감지 시스템. 검색 결과에 "등록됨" 표시, 등록 시 서버 사이드 중복 체크, 대량 등록 시 자동 필터링. |
| **Function UX Effect** | 검색 결과에서 이미 등록된 장소를 즉시 식별 가능. 중복 등록 시도 시 기존 Spot 정보와 함께 경고 표시. 대량 등록 워크플로우에서 중복 자동 제거. |
| **Core Value** | Cold Start 300 Spot 콘텐츠 품질 보장. 크루 큐레이션 효율성 향상. 중복 데이터 정리 비용 사전 방지. |

---

## 1. Feature Overview

### 1.1 Feature Name
`spot-duplicate-detection`

### 1.2 Goal
admin-spotLine 크루 큐레이션 도구에 Spot 중복 감지 시스템을 구현하여, Place API 검색 → Spot 등록 과정에서 이미 등록된 장소를 식별하고 중복 등록을 방지한다.

### 1.3 Background
- Cold Start 전략으로 런칭 전 200~300 Spot 등록 목표
- 크루가 카카오/네이버 Place API로 장소를 검색하여 Spot으로 등록
- 동일 장소가 다른 검색어/제공자로 검색되어 중복 등록 가능
- DB에 `naverPlaceId`, `kakaoPlaceId` 필드가 이미 존재하나, 중복 체크 로직 없음
- 대량 등록(bulkCreate) 시 중복 위험이 더 높음

### 1.4 Scope

**In Scope:**
- Place 검색 결과에 "이미 등록됨" 배지 표시
- 단일 Spot 등록 시 서버 사이드 중복 체크 API 호출
- 대량 등록 시 클라이언트 사이드 중복 필터링 + 경고
- 기존 등록된 Spot 목록 조회를 위한 API 활용

**Out of Scope:**
- 이미 등록된 중복 Spot 정리/병합 (별도 피처)
- Place API 간 크로스 매칭 (카카오 ID ↔ 네이버 ID 매핑)
- 주소/좌표 기반 유사도 중복 감지 (fuzzy matching)

---

## 2. Requirements

### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Place 검색 결과에서 이미 등록된 Spot의 naverPlaceId/kakaoPlaceId와 매칭하여 "등록됨" 배지 표시 | Must |
| FR-02 | 단일 Spot 등록(QuickSpotForm) 시 중복 체크 → 중복이면 경고 다이얼로그 표시 | Must |
| FR-03 | 대량 등록 시 중복 항목 자동 감지 및 제거/경고 | Must |
| FR-04 | "등록됨" 배지 클릭 시 기존 Spot 상세 정보 표시 (slug 링크) | Should |
| FR-05 | 중복 감지 시 "그래도 등록" 옵션 제공 (의도적 중복 허용) | Should |

### 2.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | 검색 결과 표시 시 중복 체크로 인한 추가 지연 200ms 이내 |
| NFR-02 | 기존 PlaceSearchPanel/BulkCurationPanel UX 흐름 유지 |

---

## 3. Technical Approach

### 3.1 Strategy: Registered Place ID Cache

**핵심 아이디어**: 등록된 Spot의 Place ID 목록을 React Query로 캐싱하여, 검색 결과 렌더링 시 클라이언트에서 즉시 매칭.

#### 3.1.1 Registered Place IDs 조회

기존 `GET /api/v2/spots` API로 전체 등록 Spot 목록을 가져와 Place ID Set을 구성.

```typescript
// useRegisteredPlaceIds hook
const { data } = useQuery({
  queryKey: ["registeredPlaceIds"],
  queryFn: async () => {
    // 전체 Spot 목록에서 placeId만 추출
    const res = await spotAPI.getList({ size: 1000 });
    const spots = res.data.content;
    return {
      naver: new Set(spots.map(s => s.naverPlaceId).filter(Boolean)),
      kakao: new Set(spots.map(s => s.kakaoPlaceId).filter(Boolean)),
    };
  },
  staleTime: 5 * 60 * 1000, // 5분 캐시
});
```

#### 3.1.2 검색 결과 중복 표시

`PlaceSearchResultCard`에 `registered` prop 추가. 등록됨 배지 + 비활성화 스타일.

#### 3.1.3 등록 시 중복 확인

- **단일 등록**: `onQuickRegister` 호출 전 캐시에서 중복 체크 → 중복이면 확인 다이얼로그
- **대량 등록**: `bulkCreateBatched` 호출 전 중복 항목 필터링 → 제거된 항목 수 표시

### 3.2 Alternative Considered

- **Backend 중복 체크 API** (`GET /api/v2/spots/check-duplicate`): 추가 API 개발 필요, 네트워크 왕복 추가. 현재는 프론트 캐시로 충분하고, 300개 수준의 데이터에서 전체 목록 조회가 실용적.

---

## 4. Implementation Items

| # | Item | Type | File(s) | Complexity |
|---|------|------|---------|------------|
| 1 | `useRegisteredPlaceIds` hook | NEW | `src/hooks/useRegisteredPlaceIds.ts` | Low |
| 2 | `PlaceSearchResultCard` 등록됨 배지 | MODIFY | `src/components/curation/PlaceSearchResultCard.tsx` | Low |
| 3 | `PlaceSearchPanel` 중복 상태 연동 | MODIFY | `src/components/curation/PlaceSearchPanel.tsx` | Low |
| 4 | `DuplicateWarningDialog` 컴포넌트 | NEW | `src/components/curation/DuplicateWarningDialog.tsx` | Medium |
| 5 | QuickSpotForm 중복 체크 통합 | MODIFY | `src/components/curation/QuickSpotForm.tsx` | Low |
| 6 | BulkCurationPanel 중복 필터링 | MODIFY | `src/components/curation/BulkCurationPanel.tsx` | Medium |

### 4.1 Implementation Order

1. `useRegisteredPlaceIds` hook (독립, 의존성 없음)
2. `PlaceSearchResultCard` 등록됨 배지 (hook 사용)
3. `PlaceSearchPanel` 연동 (배지 표시 전달)
4. `DuplicateWarningDialog` (독립 UI 컴포넌트)
5. QuickSpotForm 중복 체크 (hook + dialog 사용)
6. BulkCurationPanel 중복 필터링 (hook 사용)

---

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Spot 수 증가 시 전체 목록 조회 비효율 | Medium | 현재 300개 목표로 충분. 1000개 초과 시 Backend 중복 체크 API로 전환 |
| 카카오/네이버 간 동일 장소 매칭 불가 | Low | Out of Scope. 같은 Provider 내에서만 중복 감지 |
| 캐시와 실제 DB 간 불일치 | Low | staleTime 5분 + Spot 등록/삭제 시 쿼리 무효화 |

---

## 6. Success Criteria

- [ ] Place 검색 결과에서 이미 등록된 장소에 "등록됨" 배지 표시
- [ ] 단일 등록 시 중복 경고 다이얼로그 동작
- [ ] 대량 등록 시 중복 항목 자동 필터링 및 결과 표시
- [ ] 기존 검색/등록 UX 흐름에 영향 없음
