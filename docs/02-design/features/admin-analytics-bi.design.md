# admin-analytics-bi Design Document

> **Summary**: 어드민 대시보드에 BI 분석 기능 추가 — 콘텐츠 퍼포먼스, 크리에이터 생산성, 지역별 성과, 기간 비교, CSV 내보내기
>
> **Project**: admin-spotLine (Spotline)
> **Date**: 2026-04-14
> **Status**: Draft
> **Planning Doc**: [admin-analytics-bi.plan.md](../../01-plan/features/admin-analytics-bi.plan.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 대시보드는 전체 합계와 Top 10만 제공하여 콘텐츠 퍼포먼스 심층 분석 불가 |
| **Solution** | 4개 신규 API + 탭 기반 /analytics 페이지 + DateRangePicker + CSV 내보내기 |
| **Function/UX Effect** | 커스텀 기간으로 콘텐츠/크리에이터/지역별 성과를 한눈에 파악, 데이터 다운로드 |
| **Core Value** | 데이터 기반 큐레이션 의사결정과 파트너 영업 근거 자료 확보 |

---

## 1. Overview

### 1.1 Design Goals

- 기존 AnalyticsController/Service에 4개 엔드포인트 추가 (일관성 유지)
- 별도 `/analytics` 페이지로 대시보드 복잡도 분리
- DateRangePicker로 모든 분석에 커스텀 기간 적용
- 기존 recharts + TanStack React Query 패턴 재사용

### 1.2 Design Principles

- **기존 패턴 준수**: Dashboard.tsx, analyticsAPI.ts의 패턴 그대로 따름
- **Minimal Dependencies**: react-day-picker, papaparse, file-saver만 추가
- **Caffeine 캐싱**: 집계 쿼리 결과 10분 TTL
- **최대 365일 제한**: OOM 방지

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                 admin-spotLine                        │
│                                                       │
│  /analytics 페이지                                    │
│  ┌─────────────────────────────────────────────┐     │
│  │ DateRangePicker (프리셋: 7/30/90일 + 커스텀)  │     │
│  ├─────────────────────────────────────────────┤     │
│  │ PeriodComparison (증감률 카드)                │     │
│  ├─────────────────────────────────────────────┤     │
│  │ Tabs: 콘텐츠 | 크리에이터 | 지역              │     │
│  │  ├─ ContentPerformanceTable                  │     │
│  │  ├─ CreatorProductivityTable                 │     │
│  │  └─ AreaPerformanceChart                     │     │
│  ├─────────────────────────────────────────────┤     │
│  │ CsvExportButton (현재 탭 데이터 다운로드)      │     │
│  └─────────────────────────────────────────────┘     │
│                        │                              │
│        analyticsAPI.ts │ (4 new methods)              │
└────────────────────────┼──────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────┐
│           springboot-spotLine-backend                 │
│                                                       │
│  AnalyticsController.java                             │
│  ├─ GET /content-performance?from=&to=&type=&sort=   │
│  ├─ GET /creator-productivity?from=&to=              │
│  ├─ GET /area-performance?from=&to=                  │
│  └─ GET /period-comparison?from=&to=                 │
│                                                       │
│  AnalyticsService.java                                │
│  ├─ getContentPerformance(from, to, type, sort)      │
│  ├─ getCreatorProductivity(from, to)                 │
│  ├─ getAreaPerformance(from, to)                     │
│  └─ getPeriodComparison(from, to)                    │
│                                                       │
│  SpotRepository / SpotLineRepository                  │
│  └─ @Query (JPQL 집계 쿼리 추가)                      │
└─────────────────────────────────────────────────────┘
```

### 2.2 Dependencies

| Package | Version | Purpose | Repo |
|---------|---------|---------|------|
| react-day-picker | ^9 | 날짜 범위 선택 | admin-spotLine |
| papaparse | ^5 | CSV 생성 | admin-spotLine |
| file-saver | ^2 | 파일 다운로드 | admin-spotLine |
| @types/file-saver | ^2 | TS 타입 | admin-spotLine |

---

## 3. Backend API Design

### 3.1 New Endpoints

모든 엔드포인트는 `/api/v2/admin/analytics/` 하위, `@RequestParam` 기반.

#### 3.1.1 콘텐츠 퍼포먼스

```
GET /api/v2/admin/analytics/content-performance
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| from | LocalDate | 30일 전 | 시작일 |
| to | LocalDate | 오늘 | 종료일 |
| type | String | "spot" | "spot" or "spotline" |
| sort | String | "views" | "views", "likes", "saves", "comments" |
| limit | int | 50 | 최대 건수 |

**Response**: `List<ContentPerformanceResponse>`

```java
@Builder
public record ContentPerformanceResponse(
    UUID id,
    String slug,
    String title,
    String area,
    String creatorName,
    int viewsCount,
    int likesCount,
    int savesCount,
    int commentsCount,
    LocalDateTime createdAt
) {}
```

#### 3.1.2 크리에이터 생산성

```
GET /api/v2/admin/analytics/creator-productivity
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| from | LocalDate | 30일 전 | 시작일 |
| to | LocalDate | 오늘 | 종료일 |

**Response**: `List<CreatorProductivityResponse>`

```java
@Builder
public record CreatorProductivityResponse(
    String creatorId,
    String creatorName,
    String creatorType,
    long spotCount,
    long spotLineCount,
    long totalViews,
    long totalLikes,
    double avgViewsPerContent
) {}
```

**구현**: Spot + SpotLine을 creatorId 기준으로 집계. `createdAt BETWEEN from AND to` 필터.

#### 3.1.3 지역별 성과

```
GET /api/v2/admin/analytics/area-performance
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| from | LocalDate | 30일 전 | 시작일 |
| to | LocalDate | 오늘 | 종료일 |

**Response**: `List<AreaPerformanceResponse>`

```java
@Builder
public record AreaPerformanceResponse(
    String area,
    long spotCount,
    long spotLineCount,
    long totalViews,
    long totalLikes,
    double avgViewsPerSpot
) {}
```

**구현**: Spot의 `area` 필드 기준 GROUP BY. SpotLine도 `area` 기준 집계 후 병합.

#### 3.1.4 기간 비교

```
GET /api/v2/admin/analytics/period-comparison
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| from | LocalDate | 30일 전 | 현재 기간 시작 |
| to | LocalDate | 오늘 | 현재 기간 끝 |

**Response**: `PeriodComparisonResponse`

이전 기간은 자동 계산: `prevFrom = from - (to - from)`, `prevTo = from - 1day`

```java
@Builder
public record PeriodComparisonResponse(
    // 현재 기간
    long currentSpots,
    long currentSpotLines,
    long currentViews,
    long currentLikes,
    // 이전 기간
    long previousSpots,
    long previousSpotLines,
    long previousViews,
    long previousLikes,
    // 증감률 (%)
    double spotsChangeRate,
    double spotLinesChangeRate,
    double viewsChangeRate,
    double likesChangeRate
) {}
```

**증감률 계산**: `(current - previous) / previous * 100`. previous = 0이면 current > 0 ? 100.0 : 0.0

### 3.2 Repository Queries

#### SpotRepository 추가 메서드

```java
// 콘텐츠 퍼포먼스 - 기간 내 Spot 목록 (정렬 옵션별)
@Query("SELECT s FROM Spot s WHERE s.isActive = true AND s.createdAt BETWEEN :from AND :to ORDER BY s.viewsCount DESC")
List<Spot> findActiveByDateRangeOrderByViews(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

@Query("SELECT s FROM Spot s WHERE s.isActive = true AND s.createdAt BETWEEN :from AND :to ORDER BY s.likesCount DESC")
List<Spot> findActiveByDateRangeOrderByLikes(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

@Query("SELECT s FROM Spot s WHERE s.isActive = true AND s.createdAt BETWEEN :from AND :to ORDER BY s.savesCount DESC")
List<Spot> findActiveByDateRangeOrderBySaves(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

@Query("SELECT s FROM Spot s WHERE s.isActive = true AND s.createdAt BETWEEN :from AND :to ORDER BY s.commentsCount DESC")
List<Spot> findActiveByDateRangeOrderByComments(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

// 지역별 집계
@Query("SELECT s.area, COUNT(s), SUM(s.viewsCount), SUM(s.likesCount) FROM Spot s WHERE s.isActive = true AND s.createdAt BETWEEN :from AND :to GROUP BY s.area")
List<Object[]> aggregateByArea(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

// 크리에이터별 집계
@Query("SELECT s.creatorId, s.creatorName, s.creatorType, COUNT(s), SUM(s.viewsCount), SUM(s.likesCount) FROM Spot s WHERE s.isActive = true AND s.createdAt BETWEEN :from AND :to GROUP BY s.creatorId, s.creatorName, s.creatorType")
List<Object[]> aggregateByCreator(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

// 기간 내 집계 (기간 비교용)
@Query("SELECT COUNT(s), COALESCE(SUM(s.viewsCount),0), COALESCE(SUM(s.likesCount),0) FROM Spot s WHERE s.isActive = true AND s.createdAt BETWEEN :from AND :to")
Object[] aggregateStats(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
```

#### SpotLineRepository 추가 메서드

```java
// 콘텐츠 퍼포먼스 - 기간 내 SpotLine 목록
@Query("SELECT sl FROM SpotLine sl WHERE sl.isActive = true AND sl.createdAt BETWEEN :from AND :to ORDER BY sl.viewsCount DESC")
List<SpotLine> findActiveByDateRangeOrderByViews(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

@Query("SELECT sl FROM SpotLine sl WHERE sl.isActive = true AND sl.createdAt BETWEEN :from AND :to ORDER BY sl.likesCount DESC")
List<SpotLine> findActiveByDateRangeOrderByLikes(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

@Query("SELECT sl FROM SpotLine sl WHERE sl.isActive = true AND sl.createdAt BETWEEN :from AND :to ORDER BY sl.savesCount DESC")
List<SpotLine> findActiveByDateRangeOrderBySaves(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

@Query("SELECT sl FROM SpotLine sl WHERE sl.isActive = true AND sl.createdAt BETWEEN :from AND :to ORDER BY sl.commentsCount DESC")
List<SpotLine> findActiveByDateRangeOrderByComments(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);

// 지역별 집계
@Query("SELECT sl.area, COUNT(sl), SUM(sl.viewsCount), SUM(sl.likesCount) FROM SpotLine sl WHERE sl.isActive = true AND sl.createdAt BETWEEN :from AND :to GROUP BY sl.area")
List<Object[]> aggregateByArea(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

// 크리에이터별 집계
@Query("SELECT sl.creatorId, sl.creatorName, sl.creatorType, COUNT(sl), SUM(sl.viewsCount), SUM(sl.likesCount) FROM SpotLine sl WHERE sl.isActive = true AND sl.createdAt BETWEEN :from AND :to GROUP BY sl.creatorId, sl.creatorName, sl.creatorType")
List<Object[]> aggregateByCreator(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

// 기간 내 집계 (기간 비교용)
@Query("SELECT COUNT(sl), COALESCE(SUM(sl.viewsCount),0), COALESCE(SUM(sl.likesCount),0) FROM SpotLine sl WHERE sl.isActive = true AND sl.createdAt BETWEEN :from AND :to")
Object[] aggregateStats(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
```

### 3.3 Caffeine Cache

AnalyticsService의 신규 메서드에 `@Cacheable` 적용:

```java
@Cacheable(value = "analytics-content-perf", key = "#from + '-' + #to + '-' + #type + '-' + #sort")
public List<ContentPerformanceResponse> getContentPerformance(...)

@Cacheable(value = "analytics-creator-prod", key = "#from + '-' + #to")
public List<CreatorProductivityResponse> getCreatorProductivity(...)

@Cacheable(value = "analytics-area-perf", key = "#from + '-' + #to")
public List<AreaPerformanceResponse> getAreaPerformance(...)

@Cacheable(value = "analytics-period-comp", key = "#from + '-' + #to")
public PeriodComparisonResponse getPeriodComparison(...)
```

CacheConfig에 `analytics-*` 캐시 추가 (TTL 10분, max 100 entries).

---

## 4. Frontend Design

### 4.1 File Structure

```
src/
├── pages/
│   └── Analytics.tsx              (NEW — 메인 분석 페이지)
├── components/analytics/          (NEW — 분석 전용 컴포넌트)
│   ├── DateRangePicker.tsx
│   ├── ContentPerformanceTable.tsx
│   ├── CreatorProductivityTable.tsx
│   ├── AreaPerformanceChart.tsx
│   ├── PeriodComparison.tsx
│   └── CsvExportButton.tsx
└── services/v2/
    └── analyticsAPI.ts            (MODIFY — 4개 API 추가)
```

### 4.2 Analytics.tsx (메인 페이지)

```tsx
// 상태 관리
const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
  from: subDays(new Date(), 30),
  to: new Date(),
});
const [activeTab, setActiveTab] = useState<"content" | "creator" | "area">("content");

// 레이아웃
<div>
  <h1>분석</h1>
  <DateRangePicker value={dateRange} onChange={setDateRange} />
  <PeriodComparison from={dateRange.from} to={dateRange.to} />
  <Tabs value={activeTab} onChange={setActiveTab}>
    <Tab label="콘텐츠 퍼포먼스" />
    <Tab label="크리에이터 생산성" />
    <Tab label="지역별 성과" />
  </Tabs>
  {activeTab === "content" && <ContentPerformanceTable {...dateRange} />}
  {activeTab === "creator" && <CreatorProductivityTable {...dateRange} />}
  {activeTab === "area" && <AreaPerformanceChart {...dateRange} />}
  <CsvExportButton data={currentTabData} filename={`analytics-${activeTab}`} />
</div>
```

### 4.3 DateRangePicker.tsx

- `react-day-picker` (v9) 사용, 캘린더 팝오버
- 프리셋 버튼: 최근 7일 / 30일 / 90일 / 커스텀
- Props: `value: { from: Date; to: Date }`, `onChange: (range) => void`
- 최대 365일 제한, 미래 날짜 비활성화
- 기존 Tailwind 스타일 + cn() 유틸리티 사용

### 4.4 ContentPerformanceTable.tsx

- 테이블: 제목, 지역, 크리에이터, 조회수, 좋아요, 저장, 댓글
- 타입 전환: Spot / SpotLine 토글
- 정렬: 각 지표 컬럼 클릭으로 정렬 변경 (서버사이드)
- `useQuery` 호출: `analyticsAPI.getContentPerformance(from, to, type, sort)`
- 로딩: Skeleton UI (기존 Dashboard 패턴)

### 4.5 CreatorProductivityTable.tsx

- 테이블: 크리에이터명, 타입(crew/user), Spot 수, SpotLine 수, 총 조회수, 총 좋아요, 평균 조회수
- `useQuery` 호출: `analyticsAPI.getCreatorProductivity(from, to)`
- 클라이언트 정렬 (데이터 소량)

### 4.6 AreaPerformanceChart.tsx

- recharts `BarChart` — 가로 막대 차트
- X축: 지역명, Y축: 총 조회수 (hover시 Spot 수, SpotLine 수, 좋아요 표시)
- 기존 `ChartCard` + `BarChartComponent` 패턴 참고하되, 가로 막대로 변경
- `useQuery` 호출: `analyticsAPI.getAreaPerformance(from, to)`

### 4.7 PeriodComparison.tsx

- 4개 MetricCard: Spot 수, SpotLine 수, 총 조회수, 총 좋아요
- 각 카드에 이전 기간 대비 증감률 (%) 표시
- 양수: 초록색 ↑, 음수: 빨간색 ↓, 0: 회색 —
- `useQuery` 호출: `analyticsAPI.getPeriodComparison(from, to)`

### 4.8 CsvExportButton.tsx

- `papaparse.unparse()` → `file-saver.saveAs()` 조합
- Props: `data: any[]`, `filename: string`, `columns?: { key: string; header: string }[]`
- 버튼 텍스트: "CSV 내보내기"
- 빈 데이터 시 비활성화

### 4.9 analyticsAPI.ts 확장

```typescript
// 신규 타입
export interface ContentPerformance {
  id: string;
  slug: string;
  title: string;
  area: string;
  creatorName: string;
  viewsCount: number;
  likesCount: number;
  savesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface CreatorProductivity {
  creatorId: string;
  creatorName: string;
  creatorType: string;
  spotCount: number;
  spotLineCount: number;
  totalViews: number;
  totalLikes: number;
  avgViewsPerContent: number;
}

export interface AreaPerformance {
  area: string;
  spotCount: number;
  spotLineCount: number;
  totalViews: number;
  totalLikes: number;
  avgViewsPerSpot: number;
}

export interface PeriodComparison {
  currentSpots: number;
  currentSpotLines: number;
  currentViews: number;
  currentLikes: number;
  previousSpots: number;
  previousSpotLines: number;
  previousViews: number;
  previousLikes: number;
  spotsChangeRate: number;
  spotLinesChangeRate: number;
  viewsChangeRate: number;
  likesChangeRate: number;
}

// analyticsAPI에 추가
export const analyticsAPI = {
  // ... 기존 메서드 유지

  getContentPerformance: (from: string, to: string, type = "spot", sort = "views", limit = 50) =>
    apiClient.get<ContentPerformance[]>("/admin/analytics/content-performance", {
      params: { from, to, type, sort, limit },
    }).then((r) => r.data),

  getCreatorProductivity: (from: string, to: string) =>
    apiClient.get<CreatorProductivity[]>("/admin/analytics/creator-productivity", {
      params: { from, to },
    }).then((r) => r.data),

  getAreaPerformance: (from: string, to: string) =>
    apiClient.get<AreaPerformance[]>("/admin/analytics/area-performance", {
      params: { from, to },
    }).then((r) => r.data),

  getPeriodComparison: (from: string, to: string) =>
    apiClient.get<PeriodComparison>("/admin/analytics/period-comparison", {
      params: { from, to },
    }).then((r) => r.data),
};
```

### 4.10 Router + Sidebar 수정

**App.tsx**: `<Route path="analytics" element={<Analytics />} />` 추가 (admin 이상)

**Layout.tsx**: navigation 배열에 추가:

```typescript
// 분석 섹션 (대시보드 바로 아래)
{ name: "분석", href: "/analytics", icon: BarChart3, section: "analytics", minRole: "admin" },
```

NavSection에 "분석" 섹션 추가.

---

## 5. Implementation Order

| # | Item | Repo | Type | Est. LOC | Depends On |
|---|------|------|------|----------|------------|
| 1 | DTO records (4개) | backend | NEW | ~60 | - |
| 2 | Repository 집계 쿼리 | backend | MODIFY | ~50 | - |
| 3 | AnalyticsService 메서드 (4개) | backend | MODIFY | ~120 | 1, 2 |
| 4 | AnalyticsController 엔드포인트 (4개) | backend | MODIFY | ~40 | 3 |
| 5 | Cache 설정 추가 | backend | MODIFY | ~10 | 3 |
| 6 | npm install (react-day-picker, papaparse, file-saver) | admin | - | - | - |
| 7 | analyticsAPI.ts 확장 | admin | MODIFY | ~50 | 4 |
| 8 | DateRangePicker 컴포넌트 | admin | NEW | ~120 | 6 |
| 9 | PeriodComparison 컴포넌트 | admin | NEW | ~80 | 7 |
| 10 | ContentPerformanceTable 컴포넌트 | admin | NEW | ~150 | 7 |
| 11 | CreatorProductivityTable 컴포넌트 | admin | NEW | ~120 | 7 |
| 12 | AreaPerformanceChart 컴포넌트 | admin | NEW | ~100 | 7 |
| 13 | CsvExportButton 유틸리티 | admin | NEW | ~60 | 6 |
| 14 | Analytics.tsx 페이지 | admin | NEW | ~80 | 8-13 |
| 15 | App.tsx 라우트 추가 | admin | MODIFY | ~5 | 14 |
| 16 | Layout.tsx 사이드바 메뉴 추가 | admin | MODIFY | ~10 | 14 |

**Total: ~1,055 LOC** (7 NEW, 9 MODIFY)

---

## 6. Date Format Convention

- Frontend → Backend: `YYYY-MM-DD` (ISO 8601 date string)
- Backend `@RequestParam`: `@DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from`
- 내부 변환: `from.atStartOfDay()` ~ `to.atTime(23, 59, 59)` for BETWEEN 쿼리

---

## 7. Error Handling

- 날짜 범위 유효성: `from > to` → 400 Bad Request
- 범위 초과: `to - from > 365일` → 400 Bad Request
- 빈 결과: 빈 배열/0 값 반환 (에러 아님)
- Frontend: `useQuery`의 `isError` 상태 처리, 재시도 버튼

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-14 | Initial draft | Crew |
