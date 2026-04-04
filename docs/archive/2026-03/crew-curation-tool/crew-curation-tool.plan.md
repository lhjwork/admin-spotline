# Plan: Crew Curation Tool — 크루 큐레이션 도구 개선

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | admin-spotLine에 기본 큐레이션 기능(Spot 등록, Place API 검색, Route 빌더)이 구현되어 있으나 기술 스택이 낙후(React 18, Vite 4, react-query v3, Tailwind 3)되어 있고, 대량 Spot 등록 워크플로우가 비효율적이다. Place API 검색 → Spot 변환 과정에서 수동 입력이 많고, 큐레이션 진척 추적/통계 기능이 부족하다. |
| **Solution** | 기존 구현을 기반으로 (1) 기술 스택 현대화, (2) Place→Spot 자동 변환 개선, (3) 대량 큐레이션 워크플로우 최적화, (4) 큐레이션 대시보드 통계 강화를 수행한다. |
| **Function UX Effect** | 크루가 Place API 검색 결과에서 원클릭으로 Spot을 생성하고, crewNote만 입력하면 나머지 필드가 자동 채워진다. 대시보드에서 지역별/카테고리별 큐레이션 진척도를 실시간 추적한다. |
| **Core Value** | Cold Start 전략의 핵심 실행 도구: 크루 생산성을 극대화하여 런칭 전 목표(서울 5개 지역 200~300 Spot + 15~20 Route)를 효율적으로 달성한다. |

| Item | Detail |
|------|--------|
| Feature | Crew Curation Tool (Phase 2 of Experience Social Platform) |
| Created | 2026-03-28 |
| Status | Planning |
| Level | Dynamic |
| Repo | admin-spotLine |
| Depends On | Phase 1 (Backend Data Model + Place API) — Archived |

---

## 1. Background & Context

### 1.1 현재 상태 (AS-IS)

admin-spotLine에 이미 구현된 기능:

**Pages (6개)**:
- `/dashboard` — 총 Spot/Route 수, 지역별 Spot 수, CurationProgress
- `/curation` — SpotCuration: Place 검색 → Spot 등록 (SpotFormPanel + 카카오맵)
- `/spots` — SpotManagement: Spot 목록, 필터, 수정, 삭제
- `/routes/new` — RouteBuilder: Spot 선택 → Route 구성
- `/routes` — RouteManagement: Route 목록, 관리
- `/partners/*` — Partner 관리 (Phase 8 QR Partner System)

**Services (v2 API)**:
- `placeAPI` — Place 검색(카카오/네이버), 상세 조회
- `spotAPI` — CRUD + bulkCreate
- `routeAPI` — CRUD + popular 조회

**Components (curation)**:
- `PlaceSearchPanel` — 카카오/네이버 Place 검색 + 결과 카드
- `PlaceSearchResultCard` — 검색 결과 개별 카드
- `SpotFormPanel` — Spot 등록 폼 (react-hook-form)
- `SpotMediaUpload` — 미디어 업로드
- `SpotEditModal` — Spot 수정 모달
- `SpotLineSpotSelector` — Route에 Spot 추가
- `SpotLineSpotList` — Route Spot 순서 관리
- `CurationProgress` — 목표 대비 진척도 바

**Constants**:
- AREAS (20개 지역), SPOT_CATEGORIES, ROUTE_THEMES
- mapPlaceCategoryToSpotCategory() — Place 카테고리 → SpotCategory 자동 매핑
- extractAreaFromAddress() — 주소에서 area 자동 추출

### 1.2 문제점

| # | Problem | Impact |
|---|---------|--------|
| 1 | **기술 스택 낙후** | React 18, Vite 4, react-query v3 (deprecated), Tailwind 3, TypeScript 미설정 |
| 2 | **Place→Spot 변환 비효율** | Place 검색 후 수동으로 title, area, category 등 입력 필요. PlaceSearchPanel과 SpotFormPanel이 분리되어 있어 검색→등록이 2단계 |
| 3 | **대량 등록 UX 부재** | bulkCreate API 존재하나 UI에서 활용하지 않음. 한 번에 1개씩만 등록 가능 |
| 4 | **대시보드 통계 부족** | 지역별 Spot 수만 표시. 카테고리별, 일별 등록 추이, 목표 달성률 상세 없음 |
| 5 | **Route 빌더 UX** | Spot 검색/선택이 별도 컴포넌트. 드래그 정렬 미지원. 이동 시간/거리 수동 입력 |

### 1.3 Backend API 현황

이미 구현된 API (Spring Boot):
```
GET  /api/v2/places/search?query&provider&size     ← Place 검색
GET  /api/v2/places/{provider}/{placeId}            ← Place 상세
POST /api/v2/spots                                   ← Spot 생성
POST /api/v2/spots/bulk                              ← 대량 Spot 생성
GET  /api/v2/spots?area&category&page&size           ← Spot 목록
PUT  /api/v2/spots/{slug}                            ← Spot 수정
DELETE /api/v2/spots/{slug}                          ← Spot 삭제
POST /api/v2/routes                                  ← Route 생성
GET  /api/v2/routes/popular?area&theme&page&size     ← Route 목록
```

**중요**: Backend API 수정 불필요. 프론트엔드(admin-spotLine) 개선만.

---

## 2. Scope

### 2.1 In Scope

| # | Item | Description | Priority |
|---|------|-------------|----------|
| 1 | **Quick Spot 등록** | Place 검색 결과에서 원클릭으로 Spot 생성. title/address/area/category 자동 채움. crewNote만 입력 | P0 |
| 2 | **대량 큐레이션 모드** | Place 검색 → 체크박스 다중 선택 → 일괄 Spot 등록. bulkCreate API 활용 | P0 |
| 3 | **대시보드 통계 강화** | 지역별+카테고리별 히트맵, 일별 등록 추이 차트, 목표 달성률 상세 | P1 |
| 4 | **Route 빌더 개선** | Spot 인라인 검색/추가, 드래그 정렬 (dnd-kit), 이동 시간 추정 | P1 |
| 5 | **기술 스택 업데이트** | react-query v3→@tanstack/react-query v5, Tailwind 3→4, TypeScript strict | P2 |

### 2.2 Out of Scope

| Item | Reason |
|------|--------|
| Backend API 수정 | 기존 API로 충분 |
| 인증 시스템 변경 | 기존 AuthContext 유지 |
| Partner 관리 기능 | Phase 8에서 별도 관리 |
| 모바일 반응형 | 어드민은 데스크톱 전용 |
| Vite → Next.js 전환 | 불필요 (어드민은 SPA로 충분) |

---

## 3. Core Features

### 3.1 Quick Spot 등록 (P0)

**현재 flow**: Place 검색 → 결과 선택 → SpotFormPanel에서 수동으로 모든 필드 입력 → 저장

**개선 flow**:
```
Place 검색 → 결과 카드에서 "Spot으로 등록" 클릭
  → PlaceInfo → CreateSpotRequest 자동 변환
    - title = place.name
    - address = place.address
    - area = extractAreaFromAddress(place.address)
    - category = mapPlaceCategoryToSpotCategory(place.category)
    - naverPlaceId/kakaoPlaceId = place.placeId (provider별)
    - source = "CREW"
  → Inline crewNote 입력 (필수)
  → 태그 입력 (선택)
  → "등록" 버튼 → API 호출
```

### 3.2 대량 큐레이션 모드 (P0)

```
┌─────────────────────────────────────────┐
│ 🔍 "성수 카페" 검색                     │
├─────────────────────────────────────────┤
│ ☐ 카페 A (성수동, 카카오 4.5★)          │
│ ☐ 카페 B (성수동, 카카오 4.3★)          │
│ ☑ 카페 C (성수동, 카카오 4.8★) ← 선택   │
│ ☑ 카페 D (성수동, 카카오 4.1★) ← 선택   │
├─────────────────────────────────────────┤
│ 선택: 2개  [일괄 crewNote 입력] [등록]  │
└─────────────────────────────────────────┘
```

- 체크박스 다중 선택
- 선택된 Place 목록 사이드패널
- 각 Place에 개별 crewNote 입력 또는 일괄 기본 crewNote
- `spotAPI.bulkCreate()` 한 번 호출

### 3.3 대시보드 통계 강화 (P1)

| 지표 | 현재 | 개선 |
|------|------|------|
| 총 Spot 수 | ✅ | 유지 |
| 총 Route 수 | ✅ | 유지 |
| 지역별 Spot 수 | ✅ 상위 5개 | → 전체 20개 지역 히트맵 |
| 카테고리별 Spot 수 | ❌ | 추가 (파이 차트) |
| 일별 등록 추이 | ❌ | 추가 (라인 차트, 최근 14일) |
| 목표 달성률 | 기본 프로그레스 바 | → 지역별 세부 달성률 |
| Route 테마 분포 | ❌ | 추가 |

### 3.4 Route 빌더 개선 (P1)

- Spot 인라인 검색: RouteBuilder 내에서 바로 Spot 검색/추가
- 드래그 정렬: dnd-kit 라이브러리로 Spot 순서 변경
- 이동 시간/거리: 인접 Spot 간 직선거리 자동 계산 (Haversine formula)

### 3.5 기술 스택 업데이트 (P2)

| Library | Current | Target |
|---------|---------|--------|
| react-query | v3.39.3 | @tanstack/react-query v5 |
| Tailwind CSS | v3.3.6 | v4 |
| TypeScript | 미설정 (js config) | strict mode |
| Vite | v4.5.0 | v6 |

---

## 4. Implementation Strategy

### Phase 2A: Quick Spot + Bulk (P0) — 이번 PDCA

1. PlaceSearchPanel에 "Spot으로 등록" 인라인 액션 추가
2. PlaceInfo → CreateSpotRequest 자동 변환 유틸리티
3. 대량 선택 모드 (체크박스 + 사이드패널)
4. bulkCreate UI 연결
5. SpotCuration 페이지 리팩토링 (Quick Spot 모드가 기본)

### Phase 2B: Dashboard + Route (P1) — 다음 PDCA

1. 대시보드 통계 컴포넌트 확장
2. Route 빌더 dnd-kit 통합
3. 이동 거리 자동 계산

### Phase 2C: Tech Upgrade (P2) — 별도 PDCA

1. react-query → @tanstack/react-query 마이그레이션
2. Tailwind 3 → 4
3. TypeScript strict mode 적용

---

## 5. Success Metrics

| Metric | Target |
|--------|--------|
| Quick Spot 등록 시간 | Place 검색 → 등록 30초 이내 (현재 2~3분) |
| 대량 등록 효율 | 10개 Spot 일괄 등록 가능 |
| 일일 Spot 등록량 | 크루 1인 기준 50+개 (현재 ~20개) |
| 런칭 전 콘텐츠 목표 | 200~300 Spot + 15~20 Route |

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Place API 검색 결과 품질 | 카카오/네이버 병행 검색으로 커버리지 확보. 이미 구현됨 |
| 카테고리 자동 매핑 정확도 | mapPlaceCategoryToSpotCategory가 이미 70+ 키워드 지원. 미매핑 시 "OTHER" fallback |
| bulkCreate 실패 처리 | 개별 실패 건 표시 + 재시도 버튼 |
