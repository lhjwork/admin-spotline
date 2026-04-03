# spot-route-search Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: Spotline (admin-spotLine + springboot-spotLine-backend)
> **Analyst**: gap-detector
> **Date**: 2026-04-03
> **Design Doc**: [spot-route-search.design.md](../02-design/features/spot-route-search.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Design document의 모든 체크리스트 항목이 실제 구현 코드와 일치하는지 검증한다.

### 1.2 Analysis Scope

- **Design Document**: `admin-spotLine/docs/02-design/features/spot-route-search.design.md`
- **Backend**: `springboot-spotLine-backend/src/main/java/com/spotline/api/` (6 files)
- **Admin Frontend**: `admin-spotLine/src/` (4 files)
- **Analysis Date**: 2026-04-03

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 100% | ✅ |
| Architecture Compliance | 100% | ✅ |
| Convention Compliance | 100% | ✅ |
| **Overall** | **100%** | ✅ |

---

## 3. Gap Analysis (Design vs Implementation)

### 3.1 SpotRepository.java -- 8 keyword queries

| Design Spec | Method Name | JPQL Match | Status |
|-------------|-------------|:----------:|:------:|
| keyword only -- Popular | `findByKeywordAndPopular` | Verbatim | ✅ |
| keyword only -- Newest | `findByKeywordAndNewest` | Verbatim | ✅ |
| keyword + area -- Popular | `findByAreaLikeAndKeywordAndPopular` | Verbatim | ✅ |
| keyword + area -- Newest | `findByAreaLikeAndKeywordAndNewest` | Verbatim | ✅ |
| keyword + category -- Popular | `findByCategoryAndKeywordAndPopular` | Verbatim | ✅ |
| keyword + category -- Newest | `findByCategoryAndKeywordAndNewest` | Verbatim | ✅ |
| keyword + area + category -- Popular | `findByAreaLikeAndCategoryAndKeywordAndPopular` | Verbatim | ✅ |
| keyword + area + category -- Newest | `findByAreaLikeAndCategoryAndKeywordAndNewest` | Verbatim | ✅ |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/springboot-spotLine-backend/src/main/java/com/spotline/api/domain/repository/SpotRepository.java` (lines 47-101)

### 3.2 RouteRepository.java -- 8 keyword queries

| Design Spec | Method Name | JPQL Match | Status |
|-------------|-------------|:----------:|:------:|
| keyword only -- Popular | `findByKeywordAndPopular` | Verbatim | ✅ |
| keyword only -- Newest | `findByKeywordAndNewest` | Verbatim | ✅ |
| keyword + area -- Popular | `findByAreaLikeAndKeywordAndPopular` | Verbatim | ✅ |
| keyword + area -- Newest | `findByAreaLikeAndKeywordAndNewest` | Verbatim | ✅ |
| keyword + theme -- Popular | `findByThemeAndKeywordAndPopular` | Verbatim | ✅ |
| keyword + theme -- Newest | `findByThemeAndKeywordAndNewest` | Verbatim | ✅ |
| keyword + area + theme -- Popular | `findByAreaLikeAndThemeAndKeywordAndPopular` | Verbatim | ✅ |
| keyword + area + theme -- Newest | `findByAreaLikeAndThemeAndKeywordAndNewest` | Verbatim | ✅ |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/springboot-spotLine-backend/src/main/java/com/spotline/api/domain/repository/RouteRepository.java` (lines 42-96)

### 3.3 SpotService.java

| Design Spec | Implementation | Status |
|-------------|----------------|:------:|
| `list()` signature: add `keyword` param | `list(String area, String category, String keyword, FeedSort sort, Pageable pageable)` | ✅ |
| `hasKeyword` guard: `keyword != null && !keyword.isBlank()` | Identical | ✅ |
| NEWEST branch: `listByNewestWithKeyword` / `listByNewest` | Identical | ✅ |
| POPULAR branch: `listByPopularWithKeyword` / `listByPopular` | Identical | ✅ |
| `listByPopularWithKeyword()` -- 4-way branch | Identical (area+category, area, category, keyword-only) | ✅ |
| `listByNewestWithKeyword()` -- 4-way branch | Identical | ✅ |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/springboot-spotLine-backend/src/main/java/com/spotline/api/service/SpotService.java` (lines 80-149)

### 3.4 RouteService.java

| Design Spec | Implementation | Status |
|-------------|----------------|:------:|
| `getPopularPreviews()` signature: add `keyword` param | `getPopularPreviews(String area, String theme, String keyword, FeedSort sort, Pageable pageable)` | ✅ |
| `hasKeyword` guard | Identical | ✅ |
| NEWEST branch: `getNewestWithKeyword` / `getNewest` | Identical | ✅ |
| POPULAR branch: `getPopularWithKeyword` / `getPopular` | Identical | ✅ |
| `getPopularWithKeyword()` -- 4-way branch | Identical | ✅ |
| `getNewestWithKeyword()` -- 4-way branch | Identical | ✅ |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/springboot-spotLine-backend/src/main/java/com/spotline/api/service/RouteService.java` (lines 51-108)

### 3.5 SpotController.java

| Design Spec | Implementation | Status |
|-------------|----------------|:------:|
| `list()` adds `@RequestParam(required = false) String keyword` | Line 61: present | ✅ |
| Passes `keyword` to `spotService.list()` | Line 65: `spotService.list(area, category, keyword, feedSort, pageable)` | ✅ |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/springboot-spotLine-backend/src/main/java/com/spotline/api/controller/SpotController.java` (lines 57-66)

### 3.6 RouteController.java

| Design Spec | Implementation | Status |
|-------------|----------------|:------:|
| `popular()` adds `@RequestParam(required = false) String keyword` | Line 39: present | ✅ |
| Passes `keyword` to `routeService.getPopularPreviews()` | Line 43: `routeService.getPopularPreviews(area, theme, keyword, feedSort, pageable)` | ✅ |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/springboot-spotLine-backend/src/main/java/com/spotline/api/controller/RouteController.java` (lines 35-44)

### 3.7 spotAPI.ts

| Design Spec | Implementation | Status |
|-------------|----------------|:------:|
| `SpotListParams.keyword?: string` | Line 15: `keyword?: string` | ✅ |
| `getList` auto-forwards via `...rest` spread | Line 20: `const { page = 1, size = 20, ...rest } = params` | ✅ |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/admin-spotLine/src/services/v2/spotAPI.ts`

### 3.8 routeAPI.ts

| Design Spec | Implementation | Status |
|-------------|----------------|:------:|
| `RouteListParams.keyword?: string` | Line 16: `keyword?: string` | ✅ |
| `getPopular` auto-forwards via `...rest` spread | Line 21: `const { page = 1, size = 20, ...rest } = params` | ✅ |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/admin-spotLine/src/services/v2/routeAPI.ts`

### 3.9 SpotManagement.tsx

| Design Spec | Implementation | Status |
|-------------|----------------|:------:|
| State: `searchInput`, `keyword` | Lines 15-16 | ✅ |
| Debounce 300ms with `useRef` + `useEffect` | Lines 21-28 | ✅ |
| `setPage(1)` on debounce trigger | Line 25 | ✅ |
| Query key includes `keyword` | Line 31: `["spots", page, areaFilter, categoryFilter, keyword]` | ✅ |
| `keyword: keyword \|\| undefined` in API params | Line 37 | ✅ |
| `keepPreviousData: true` | Line 39 | ✅ |
| Search input UI with placeholder "제목 또는 크루노트 검색..." | Lines 126-132 | ✅ |
| Input className matches design | Identical | ✅ |
| Input placed before `<select>` filters | Line 126 (before line 133 select) | ✅ |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/admin-spotLine/src/pages/SpotManagement.tsx`

### 3.10 RouteManagement.tsx

| Design Spec | Implementation | Status |
|-------------|----------------|:------:|
| State: `searchInput`, `keyword` | Lines 16-17 | ✅ |
| Debounce 300ms with `useRef` + `useEffect` | Lines 22-29 | ✅ |
| `setPage(1)` on debounce trigger | Line 25 | ✅ |
| Query key includes `keyword` | Line 32: `["routes", page, areaFilter, themeFilter, keyword]` | ✅ |
| `keyword: keyword \|\| undefined` in API params | Line 38 | ✅ |
| `keepPreviousData: true` | Line 40 | ✅ |
| Search input UI with placeholder "제목 또는 설명 검색..." | Lines 92-98 | ✅ |
| Input className matches design | Identical | ✅ |
| Input placed before `<select>` filters | Line 92 (before line 99 select) | ✅ |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/admin-spotLine/src/pages/RouteManagement.tsx`

---

## 4. Match Rate Summary

```
Total Design Items: 48
  - SpotRepository queries: 8
  - RouteRepository queries: 8
  - SpotService changes: 6
  - RouteService changes: 6
  - SpotController changes: 2
  - RouteController changes: 2
  - spotAPI.ts changes: 2
  - routeAPI.ts changes: 2
  - SpotManagement.tsx changes: 9
  - RouteManagement.tsx changes: 9

Implemented: 48/48 (100%)
Missing: 0
Deviations: 0
Extras: 0
```

---

## 5. Completion Criteria Verification

| Criteria | Status |
|----------|:------:|
| Spot 목록에서 keyword로 title/crewNote 검색 가능 | ✅ |
| Route 목록에서 keyword로 title/description 검색 가능 | ✅ |
| keyword + area + category/theme 동시 필터링 가능 | ✅ |
| 검색 시 페이지가 1로 리셋됨 | ✅ |
| 빈 keyword 시 기존 동작과 동일 | ✅ |
| 기존 필터/정렬/페이지네이션 영향 없음 | ✅ |

---

## 6. Recommended Actions

None required. All 48 design specification items are implemented verbatim.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-03 | Initial analysis -- 100% match rate | gap-detector |
