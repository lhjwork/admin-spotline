# spot-route-search Design

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | Spot/Route 관리 페이지에 텍스트 검색이 없어, 크루가 제목/crewNote로 콘텐츠를 빠르게 찾을 수 없음 |
| **Solution** | Backend에 keyword LIKE 쿼리 추가 + Admin에 디바운스 검색 UI 구현 |
| **Function/UX Effect** | 검색창에 키워드 입력 시 제목/crewNote(Spot) 또는 title/description(Route) 기반 실시간 필터링. 기존 드롭다운 필터와 AND 조합 |
| **Core Value** | 200~300 Spot 큐레이션 워크플로우 속도 향상. 크루 운영 효율성 확보 |

---

## 1. 설계 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 검색 방식 | SQL `LIKE %keyword%` | 200~300건 규모에서 full-text search 과도 |
| 쿼리 패턴 | `@Query` JPQL 동적 조건 | 기존 named method 패턴에 keyword 추가 시 메서드 폭발 방지 |
| 검색 대상 (Spot) | `title LIKE` OR `crewNote LIKE` | 크루가 관리하는 핵심 필드 |
| 검색 대상 (Route) | `title LIKE` OR `description LIKE` | Route의 핵심 식별 필드 |
| 기존 필터 관계 | AND 조합 | keyword + area + category/theme 모두 적용 |
| 디바운스 | 300ms | SpotCuration 400ms 참고, 관리 도구이므로 더 빠르게 |
| 빈 keyword 처리 | 기존 쿼리 그대로 호출 | Service에서 keyword null/blank 시 기존 분기 유지 |

---

## 2. Backend 변경 사항

### 2.1 SpotRepository.java

**파일**: `springboot-spotLine-backend/.../domain/repository/SpotRepository.java`

기존 area+category 쿼리에 대응하는 keyword 포함 쿼리 4개 추가:

```java
// ---- Keyword 검색 (title OR crewNote LIKE) ----

// keyword only — Popular
@Query("SELECT s FROM Spot s WHERE s.isActive = true " +
       "AND (s.title LIKE %:keyword% OR s.crewNote LIKE %:keyword%) " +
       "ORDER BY s.viewsCount DESC")
Page<Spot> findByKeywordAndPopular(@Param("keyword") String keyword, Pageable pageable);

// keyword only — Newest
@Query("SELECT s FROM Spot s WHERE s.isActive = true " +
       "AND (s.title LIKE %:keyword% OR s.crewNote LIKE %:keyword%) " +
       "ORDER BY s.createdAt DESC")
Page<Spot> findByKeywordAndNewest(@Param("keyword") String keyword, Pageable pageable);

// keyword + area — Popular
@Query("SELECT s FROM Spot s WHERE s.isActive = true " +
       "AND s.area LIKE %:area% " +
       "AND (s.title LIKE %:keyword% OR s.crewNote LIKE %:keyword%) " +
       "ORDER BY s.viewsCount DESC")
Page<Spot> findByAreaLikeAndKeywordAndPopular(
    @Param("area") String area, @Param("keyword") String keyword, Pageable pageable);

// keyword + area — Newest
@Query("SELECT s FROM Spot s WHERE s.isActive = true " +
       "AND s.area LIKE %:area% " +
       "AND (s.title LIKE %:keyword% OR s.crewNote LIKE %:keyword%) " +
       "ORDER BY s.createdAt DESC")
Page<Spot> findByAreaLikeAndKeywordAndNewest(
    @Param("area") String area, @Param("keyword") String keyword, Pageable pageable);

// keyword + category — Popular
@Query("SELECT s FROM Spot s WHERE s.isActive = true " +
       "AND s.category = :category " +
       "AND (s.title LIKE %:keyword% OR s.crewNote LIKE %:keyword%) " +
       "ORDER BY s.viewsCount DESC")
Page<Spot> findByCategoryAndKeywordAndPopular(
    @Param("category") SpotCategory category, @Param("keyword") String keyword, Pageable pageable);

// keyword + category — Newest
@Query("SELECT s FROM Spot s WHERE s.isActive = true " +
       "AND s.category = :category " +
       "AND (s.title LIKE %:keyword% OR s.crewNote LIKE %:keyword%) " +
       "ORDER BY s.createdAt DESC")
Page<Spot> findByCategoryAndKeywordAndNewest(
    @Param("category") SpotCategory category, @Param("keyword") String keyword, Pageable pageable);

// keyword + area + category — Popular
@Query("SELECT s FROM Spot s WHERE s.isActive = true " +
       "AND s.area LIKE %:area% AND s.category = :category " +
       "AND (s.title LIKE %:keyword% OR s.crewNote LIKE %:keyword%) " +
       "ORDER BY s.viewsCount DESC")
Page<Spot> findByAreaLikeAndCategoryAndKeywordAndPopular(
    @Param("area") String area, @Param("category") SpotCategory category,
    @Param("keyword") String keyword, Pageable pageable);

// keyword + area + category — Newest
@Query("SELECT s FROM Spot s WHERE s.isActive = true " +
       "AND s.area LIKE %:area% AND s.category = :category " +
       "AND (s.title LIKE %:keyword% OR s.crewNote LIKE %:keyword%) " +
       "ORDER BY s.createdAt DESC")
Page<Spot> findByAreaLikeAndCategoryAndKeywordAndNewest(
    @Param("area") String area, @Param("category") SpotCategory category,
    @Param("keyword") String keyword, Pageable pageable);
```

### 2.2 RouteRepository.java

**파일**: `springboot-spotLine-backend/.../domain/repository/RouteRepository.java`

동일 패턴으로 keyword 포함 쿼리 8개 추가:

```java
// ---- Keyword 검색 (title OR description LIKE) ----

// keyword only — Popular
@Query("SELECT r FROM Route r WHERE r.isActive = true " +
       "AND (r.title LIKE %:keyword% OR r.description LIKE %:keyword%) " +
       "ORDER BY r.likesCount DESC")
Page<Route> findByKeywordAndPopular(@Param("keyword") String keyword, Pageable pageable);

// keyword only — Newest
@Query("SELECT r FROM Route r WHERE r.isActive = true " +
       "AND (r.title LIKE %:keyword% OR r.description LIKE %:keyword%) " +
       "ORDER BY r.createdAt DESC")
Page<Route> findByKeywordAndNewest(@Param("keyword") String keyword, Pageable pageable);

// keyword + area — Popular
@Query("SELECT r FROM Route r WHERE r.isActive = true " +
       "AND r.area LIKE %:area% " +
       "AND (r.title LIKE %:keyword% OR r.description LIKE %:keyword%) " +
       "ORDER BY r.likesCount DESC")
Page<Route> findByAreaLikeAndKeywordAndPopular(
    @Param("area") String area, @Param("keyword") String keyword, Pageable pageable);

// keyword + area — Newest
@Query("SELECT r FROM Route r WHERE r.isActive = true " +
       "AND r.area LIKE %:area% " +
       "AND (r.title LIKE %:keyword% OR r.description LIKE %:keyword%) " +
       "ORDER BY r.createdAt DESC")
Page<Route> findByAreaLikeAndKeywordAndNewest(
    @Param("area") String area, @Param("keyword") String keyword, Pageable pageable);

// keyword + theme — Popular
@Query("SELECT r FROM Route r WHERE r.isActive = true " +
       "AND r.theme = :theme " +
       "AND (r.title LIKE %:keyword% OR r.description LIKE %:keyword%) " +
       "ORDER BY r.likesCount DESC")
Page<Route> findByThemeAndKeywordAndPopular(
    @Param("theme") RouteTheme theme, @Param("keyword") String keyword, Pageable pageable);

// keyword + theme — Newest
@Query("SELECT r FROM Route r WHERE r.isActive = true " +
       "AND r.theme = :theme " +
       "AND (r.title LIKE %:keyword% OR r.description LIKE %:keyword%) " +
       "ORDER BY r.createdAt DESC")
Page<Route> findByThemeAndKeywordAndNewest(
    @Param("theme") RouteTheme theme, @Param("keyword") String keyword, Pageable pageable);

// keyword + area + theme — Popular
@Query("SELECT r FROM Route r WHERE r.isActive = true " +
       "AND r.area LIKE %:area% AND r.theme = :theme " +
       "AND (r.title LIKE %:keyword% OR r.description LIKE %:keyword%) " +
       "ORDER BY r.likesCount DESC")
Page<Route> findByAreaLikeAndThemeAndKeywordAndPopular(
    @Param("area") String area, @Param("theme") RouteTheme theme,
    @Param("keyword") String keyword, Pageable pageable);

// keyword + area + theme — Newest
@Query("SELECT r FROM Route r WHERE r.isActive = true " +
       "AND r.area LIKE %:area% AND r.theme = :theme " +
       "AND (r.title LIKE %:keyword% OR r.description LIKE %:keyword%) " +
       "ORDER BY r.createdAt DESC")
Page<Route> findByAreaLikeAndThemeAndKeywordAndNewest(
    @Param("area") String area, @Param("theme") RouteTheme theme,
    @Param("keyword") String keyword, Pageable pageable);
```

### 2.3 SpotService.java

**파일**: `springboot-spotLine-backend/.../service/SpotService.java`

`list()` 메서드 시그니처에 `keyword` 파라미터 추가. keyword가 blank이면 기존 로직 유지.

```java
public Page<SpotDetailResponse> list(String area, String category, String keyword, FeedSort sort, Pageable pageable) {
    Page<Spot> spots;
    FeedSort effectiveSort = (sort != null) ? sort : FeedSort.POPULAR;
    boolean hasKeyword = keyword != null && !keyword.isBlank();

    if (effectiveSort == FeedSort.NEWEST) {
        spots = hasKeyword
            ? listByNewestWithKeyword(area, category, keyword, pageable)
            : listByNewest(area, category, pageable);
    } else {
        spots = hasKeyword
            ? listByPopularWithKeyword(area, category, keyword, pageable)
            : listByPopular(area, category, pageable);
    }

    String s3BaseUrl = getS3BaseUrl();
    return spots.map(spot -> SpotDetailResponse.from(spot, null, s3BaseUrl));
}
```

새 private 메서드 2개 추가 (기존 `listByPopular`/`listByNewest`와 동일 분기 + keyword):

```java
private Page<Spot> listByPopularWithKeyword(String area, String category, String keyword, Pageable pageable) {
    if (area != null && category != null) {
        return spotRepository.findByAreaLikeAndCategoryAndKeywordAndPopular(
                area, SpotCategory.valueOf(category.toUpperCase()), keyword, pageable);
    } else if (area != null) {
        return spotRepository.findByAreaLikeAndKeywordAndPopular(area, keyword, pageable);
    } else if (category != null) {
        return spotRepository.findByCategoryAndKeywordAndPopular(
                SpotCategory.valueOf(category.toUpperCase()), keyword, pageable);
    }
    return spotRepository.findByKeywordAndPopular(keyword, pageable);
}

private Page<Spot> listByNewestWithKeyword(String area, String category, String keyword, Pageable pageable) {
    if (area != null && category != null) {
        return spotRepository.findByAreaLikeAndCategoryAndKeywordAndNewest(
                area, SpotCategory.valueOf(category.toUpperCase()), keyword, pageable);
    } else if (area != null) {
        return spotRepository.findByAreaLikeAndKeywordAndNewest(area, keyword, pageable);
    } else if (category != null) {
        return spotRepository.findByCategoryAndKeywordAndNewest(
                SpotCategory.valueOf(category.toUpperCase()), keyword, pageable);
    }
    return spotRepository.findByKeywordAndNewest(keyword, pageable);
}
```

### 2.4 RouteService.java

**파일**: `springboot-spotLine-backend/.../service/RouteService.java`

`getPopularPreviews()` 메서드 시그니처에 `keyword` 추가. 동일 패턴.

```java
public Page<RoutePreviewResponse> getPopularPreviews(
        String area, String theme, String keyword, FeedSort sort, Pageable pageable) {
    FeedSort effectiveSort = (sort != null) ? sort : FeedSort.POPULAR;
    Page<Route> routes;
    boolean hasKeyword = keyword != null && !keyword.isBlank();

    if (effectiveSort == FeedSort.NEWEST) {
        routes = hasKeyword
            ? getNewestWithKeyword(area, theme, keyword, pageable)
            : getNewest(area, theme, pageable);
    } else {
        routes = hasKeyword
            ? getPopularWithKeyword(area, theme, keyword, pageable)
            : getPopular(area, theme, pageable);
    }

    String s3BaseUrl = getS3BaseUrl();
    return routes.map(route -> RoutePreviewResponse.from(route, s3BaseUrl));
}
```

새 private 메서드 2개 추가:

```java
private Page<Route> getPopularWithKeyword(String area, String theme, String keyword, Pageable pageable) {
    if (area != null && theme != null) {
        return routeRepository.findByAreaLikeAndThemeAndKeywordAndPopular(
                area, RouteTheme.valueOf(theme.toUpperCase()), keyword, pageable);
    } else if (area != null) {
        return routeRepository.findByAreaLikeAndKeywordAndPopular(area, keyword, pageable);
    } else if (theme != null) {
        return routeRepository.findByThemeAndKeywordAndPopular(
                RouteTheme.valueOf(theme.toUpperCase()), keyword, pageable);
    }
    return routeRepository.findByKeywordAndPopular(keyword, pageable);
}

private Page<Route> getNewestWithKeyword(String area, String theme, String keyword, Pageable pageable) {
    if (area != null && theme != null) {
        return routeRepository.findByAreaLikeAndThemeAndKeywordAndNewest(
                area, RouteTheme.valueOf(theme.toUpperCase()), keyword, pageable);
    } else if (area != null) {
        return routeRepository.findByAreaLikeAndKeywordAndNewest(area, keyword, pageable);
    } else if (theme != null) {
        return routeRepository.findByThemeAndKeywordAndNewest(
                RouteTheme.valueOf(theme.toUpperCase()), keyword, pageable);
    }
    return routeRepository.findByKeywordAndNewest(keyword, pageable);
}
```

### 2.5 SpotController.java

**파일**: `springboot-spotLine-backend/.../controller/SpotController.java`

`list()` 엔드포인트에 `keyword` 파라미터 추가:

```java
@GetMapping
public ResponseEntity<Page<SpotDetailResponse>> list(
        @RequestParam(required = false) String area,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String keyword,  // 추가
        @RequestParam(required = false) String sort,
        @PageableDefault(size = 20) Pageable pageable) {
    FeedSort feedSort = parseFeedSort(sort);
    return ResponseEntity.ok(spotService.list(area, category, keyword, feedSort, pageable));
}
```

### 2.6 RouteController.java

**파일**: `springboot-spotLine-backend/.../controller/RouteController.java`

`popular()` 엔드포인트에 `keyword` 파라미터 추가:

```java
@GetMapping("/popular")
public ResponseEntity<Page<RoutePreviewResponse>> popular(
        @RequestParam(required = false) String area,
        @RequestParam(required = false) String theme,
        @RequestParam(required = false) String keyword,  // 추가
        @RequestParam(required = false) String sort,
        @PageableDefault(size = 20) Pageable pageable) {
    FeedSort feedSort = parseFeedSort(sort);
    return ResponseEntity.ok(routeService.getPopularPreviews(area, theme, keyword, feedSort, pageable));
}
```

---

## 3. Admin Frontend 변경 사항

### 3.1 spotAPI.ts

**파일**: `admin-spotLine/src/services/v2/spotAPI.ts`

`SpotListParams`에 `keyword` 필드 추가:

```typescript
export interface SpotListParams {
  page?: number;
  size?: number;
  area?: string;
  category?: SpotCategory;
  keyword?: string;  // 추가
}
```

`getList`는 기존 `...rest` spread로 자동 전달되므로 변경 불필요.

### 3.2 routeAPI.ts

**파일**: `admin-spotLine/src/services/v2/routeAPI.ts`

`RouteListParams`에 `keyword` 필드 추가:

```typescript
export interface RouteListParams {
  page?: number;
  size?: number;
  area?: string;
  theme?: RouteTheme;
  keyword?: string;  // 추가
}
```

`getPopular`도 기존 `...rest` spread로 자동 전달되므로 변경 불필요.

### 3.3 SpotManagement.tsx

**파일**: `admin-spotLine/src/pages/SpotManagement.tsx`

#### 3.3.1 State 추가

```typescript
const [searchInput, setSearchInput] = useState("");
const [keyword, setKeyword] = useState("");
```

#### 3.3.2 디바운스 처리

```typescript
import { useEffect, useRef } from "react";

// 디바운스: searchInput → keyword (300ms)
const debounceRef = useRef<ReturnType<typeof setTimeout>>();
useEffect(() => {
  debounceRef.current = setTimeout(() => {
    setKeyword(searchInput);
    setPage(1);
  }, 300);
  return () => clearTimeout(debounceRef.current);
}, [searchInput]);
```

#### 3.3.3 쿼리 키에 keyword 추가

```typescript
const { data, isLoading } = useQuery(
  ["spots", page, areaFilter, categoryFilter, keyword],  // keyword 추가
  () => spotAPI.getList({
    page,
    size: 20,
    area: areaFilter || undefined,
    category: (categoryFilter as SpotCategory) || undefined,
    keyword: keyword || undefined,  // 추가
  }),
  { keepPreviousData: true }
);
```

#### 3.3.4 검색 UI (필터 섹션 상단에 추가)

기존 `<div className="flex flex-wrap gap-3 mb-4">` 블록 내부, `<select>` 앞에 추가:

```tsx
<input
  type="text"
  value={searchInput}
  onChange={(e) => setSearchInput(e.target.value)}
  placeholder="제목 또는 크루노트 검색..."
  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64
             focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
/>
```

### 3.4 RouteManagement.tsx

**파일**: `admin-spotLine/src/pages/RouteManagement.tsx`

SpotManagement와 동일한 패턴 적용:

#### 3.4.1 State + 디바운스

```typescript
const [searchInput, setSearchInput] = useState("");
const [keyword, setKeyword] = useState("");

const debounceRef = useRef<ReturnType<typeof setTimeout>>();
useEffect(() => {
  debounceRef.current = setTimeout(() => {
    setKeyword(searchInput);
    setPage(1);
  }, 300);
  return () => clearTimeout(debounceRef.current);
}, [searchInput]);
```

#### 3.4.2 쿼리 키에 keyword 추가

```typescript
const { data, isLoading } = useQuery(
  ["routes", page, areaFilter, themeFilter, keyword],  // keyword 추가
  () => routeAPI.getPopular({
    page,
    size: 20,
    area: areaFilter || undefined,
    theme: (themeFilter as RouteTheme) || undefined,
    keyword: keyword || undefined,  // 추가
  }),
  { keepPreviousData: true }
);
```

#### 3.4.3 검색 UI

필터 섹션 `<select>` 앞에 추가:

```tsx
<input
  type="text"
  value={searchInput}
  onChange={(e) => setSearchInput(e.target.value)}
  placeholder="제목 또는 설명 검색..."
  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64
             focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
/>
```

---

## 4. 구현 순서

| Step | Scope | 파일 |
|------|-------|------|
| 1 | Backend Repository | SpotRepository.java, RouteRepository.java |
| 2 | Backend Service | SpotService.java, RouteService.java |
| 3 | Backend Controller | SpotController.java, RouteController.java |
| 4 | Admin API 서비스 | spotAPI.ts, routeAPI.ts |
| 5 | Admin UI | SpotManagement.tsx, RouteManagement.tsx |

---

## 5. 영향 범위

### springboot-spotLine-backend (6개 파일)

| 파일 | 변경 내용 | 위험도 |
|------|-----------|--------|
| `SpotRepository.java` | 쿼리 메서드 8개 추가 | 낮음 (추가만) |
| `RouteRepository.java` | 쿼리 메서드 8개 추가 | 낮음 (추가만) |
| `SpotService.java` | `list()` 시그니처 변경 + private 메서드 2개 추가 | 중간 (시그니처 변경) |
| `RouteService.java` | `getPopularPreviews()` 시그니처 변경 + private 메서드 2개 추가 | 중간 (시그니처 변경) |
| `SpotController.java` | `list()` RequestParam 1개 추가 | 낮음 |
| `RouteController.java` | `popular()` RequestParam 1개 추가 | 낮음 |

### admin-spotLine (4개 파일)

| 파일 | 변경 내용 | 위험도 |
|------|-----------|--------|
| `spotAPI.ts` | `SpotListParams.keyword` 추가 | 낮음 |
| `routeAPI.ts` | `RouteListParams.keyword` 추가 | 낮음 |
| `SpotManagement.tsx` | 검색 input + 디바운스 + 쿼리키 | 낮음 |
| `RouteManagement.tsx` | 검색 input + 디바운스 + 쿼리키 | 낮음 |

---

## 6. 완료 기준

- [ ] Spot 목록에서 keyword로 title/crewNote 검색 가능
- [ ] Route 목록에서 keyword로 title/description 검색 가능
- [ ] keyword + area + category/theme 동시 필터링 가능
- [ ] 검색 시 페이지가 1로 리셋됨
- [ ] 빈 keyword 시 기존 동작과 동일
- [ ] 기존 필터/정렬/페이지네이션 영향 없음
- [ ] Backend 빌드 성공
- [ ] Admin 빌드 성공
