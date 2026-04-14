# admin-analytics-bi Planning Document

> **Summary**: 어드민 대시보드에 비즈니스 인텔리전스 분석 기능 추가 (퍼널, 크리에이터, 지역 분석 + 커스텀 기간 + CSV 내보내기)
>
> **Project**: admin-spotLine (Spotline)
> **Version**: 1.0
> **Author**: Crew
> **Date**: 2026-04-14
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 대시보드는 전체 합계와 Top 10만 제공하여, 콘텐츠 퍼포먼스 심층 분석이 불가능하고 데이터 기반 의사결정이 어렵다 |
| **Solution** | 퍼널 분석, 크리에이터/지역별 성과, 커스텀 기간 선택, CSV 내보내기를 추가한 BI 대시보드 구축 |
| **Function/UX Effect** | 탭 기반 분석 페이지로 한눈에 핵심 지표를 파악하고, 날짜 범위를 자유롭게 설정하여 트렌드를 비교 가능 |
| **Core Value** | 데이터 기반 큐레이션 의사결정과 파트너 영업 근거 자료 확보 |

---

## 1. Overview

### 1.1 Purpose

어드민 대시보드에 비즈니스 인텔리전스(BI) 분석 기능을 추가하여, 크루가 콘텐츠 퍼포먼스를 심층적으로 분석하고 데이터 기반으로 큐레이션 및 파트너 영업 의사결정을 내릴 수 있도록 한다.

### 1.2 Background

- 현재 대시보드: 전체 합계(Spot/SpotLine 수, 조회수), Top 10, 30일 생성 트렌드, 지역/카테고리 분포만 제공
- **부족한 점**: 퍼널(QR→조회→저장→방문), 크리에이터별 성과, 기간 비교, 데이터 내보내기 불가
- Cold Start 단계에서 200~300 Spot 큐레이션 효율 측정과 파트너 영업용 자료가 필요

### 1.3 Related Documents

- `admin-spotLine/src/pages/Dashboard.tsx` — 현재 대시보드
- `springboot-spotLine-backend/.../AnalyticsController.java` — 기존 분석 API
- `docs/BUSINESS_PLAN.md` — 사업계획서

---

## 2. Scope

### 2.1 In Scope

- [ ] 커스텀 날짜 범위 선택기 (DateRangePicker)
- [ ] 콘텐츠 퍼포먼스 분석 (Spot/SpotLine별 조회→좋아요→저장→댓글 퍼널)
- [ ] 크리에이터(크루) 생산성 분석 (등록 수, 평균 조회수)
- [ ] 지역별 성과 히트맵 (area별 조회수/Spot 밀도)
- [ ] 기간 비교 (이전 기간 대비 증감률)
- [ ] CSV 내보내기 기능
- [ ] Backend 분석 API 확장 (4개 신규 엔드포인트)

### 2.2 Out of Scope

- 실시간 WebSocket 업데이트 (향후 별도 피처)
- AI 기반 예측/추천 (향후 ai-recommendations 피처)
- PDF 리포트 생성
- A/B 테스트 프레임워크

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | DateRangePicker로 커스텀 기간 선택 (프리셋: 7일/30일/90일/커스텀) | High | Pending |
| FR-02 | 콘텐츠 퍼포먼스 테이블 (Spot/SpotLine: 조회수, 좋아요, 저장, 댓글 + 정렬) | High | Pending |
| FR-03 | 크리에이터별 생산성 테이블 (등록 Spot 수, 평균 조회수, 총 좋아요) | High | Pending |
| FR-04 | 지역별 성과 요약 (area별 Spot 수, 총 조회수, 평균 조회수 바차트) | Medium | Pending |
| FR-05 | 기간 비교 지표 (선택 기간 vs 이전 동일 기간, 증감률 %) | Medium | Pending |
| FR-06 | CSV 내보내기 (현재 표시 중인 테이블 데이터 다운로드) | Medium | Pending |
| FR-07 | 신규 어드민 사이드바 메뉴: `/analytics` 페이지 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 분석 API 응답 시간 < 500ms (30일 범위) | API 응답 시간 측정 |
| Performance | 90일 범위에서도 < 1s | API 응답 시간 측정 |
| Caching | 분석 결과 10분 캐싱 (Caffeine) | 캐시 히트율 확인 |
| UX | 로딩 상태 표시 (Skeleton UI) | 시각적 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 7개 FR 구현 완료
- [ ] Backend 4개 신규 엔드포인트 동작
- [ ] CSV 다운로드 정상 작동
- [ ] 기존 Dashboard 기능 깨지지 않음

### 4.2 Quality Criteria

- [ ] Zero lint errors
- [ ] Build succeeds (admin + backend)
- [ ] Swagger UI에 신규 API 문서 자동 생성

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 대량 데이터 집계 시 쿼리 성능 저하 | High | Medium | Caffeine 캐싱 + 인덱스 최적화 |
| 기존 대시보드 레이아웃과 충돌 | Low | Low | 별도 `/analytics` 페이지로 분리 |
| Date Range 범위가 너무 넓을 때 OOM | Medium | Low | 최대 365일 제한 + 페이지네이션 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend | ☑ |
| **Enterprise** | Strict layer separation, microservices | High-traffic systems | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Chart Library | recharts (기존) / Chart.js / Nivo | recharts | 이미 사용 중, 추가 의존성 불필요 |
| Date Picker | react-datepicker / react-day-picker / custom | react-day-picker | 경량, headless UI 호환 |
| CSV Export | papaparse / custom / file-saver | papaparse + file-saver | 안정적, 널리 사용됨 |
| 새 페이지 vs 기존 확장 | 기존 Dashboard 확장 / 별도 Analytics 페이지 | 별도 /analytics 페이지 | 대시보드 복잡도 분리 |
| API 구조 | 기존 AnalyticsController 확장 | 기존 컨트롤러 확장 | 일관성 유지 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

Admin Frontend:
  src/pages/Analytics.tsx               (NEW - 메인 분석 페이지)
  src/components/analytics/             (NEW - 분석 전용 컴포넌트)
    DateRangePicker.tsx
    ContentPerformanceTable.tsx
    CreatorProductivityTable.tsx
    AreaPerformanceChart.tsx
    PeriodComparison.tsx
    CsvExportButton.tsx
  src/services/v2/analyticsAPI.ts       (MODIFY - 신규 API 추가)

Backend:
  AnalyticsController.java              (MODIFY - 4개 엔드포인트 추가)
  AnalyticsService.java                 (MODIFY - 비즈니스 로직 추가)
  SpotRepository.java                   (MODIFY - 집계 쿼리 추가)
  SpotLineRepository.java              (MODIFY - 집계 쿼리 추가)
  dto/analytics/                        (NEW - 응답 DTO)
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration
- [x] TypeScript configuration (`tsconfig.json`)
- [x] Tailwind CSS 4

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | exists | analytics 컴포넌트 네이밍 규칙 준수 | High |
| **Folder structure** | exists | `components/analytics/` 하위 구조 | High |
| **API 경로** | exists | `/api/v2/admin/analytics/` 하위 일관성 | High |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| - | 추가 환경변수 불필요 (기존 API_URL 사용) | - | - |

---

## 8. Implementation Items Summary

| # | Item | Repo | Type | Est. LOC |
|---|------|------|------|----------|
| 1 | Backend 분석 API 4개 엔드포인트 | springboot-backend | MODIFY | ~200 |
| 2 | Analytics 페이지 + 라우팅 | admin-spotLine | NEW | ~80 |
| 3 | DateRangePicker 컴포넌트 | admin-spotLine | NEW | ~120 |
| 4 | ContentPerformanceTable 컴포넌트 | admin-spotLine | NEW | ~150 |
| 5 | CreatorProductivityTable 컴포넌트 | admin-spotLine | NEW | ~120 |
| 6 | AreaPerformanceChart 컴포넌트 | admin-spotLine | NEW | ~100 |
| 7 | PeriodComparison 컴포넌트 | admin-spotLine | NEW | ~80 |
| 8 | CsvExportButton 유틸리티 | admin-spotLine | NEW | ~60 |
| 9 | analyticsAPI.ts 확장 | admin-spotLine | MODIFY | ~40 |
| 10 | 사이드바 메뉴 추가 | admin-spotLine | MODIFY | ~10 |

**Total: ~960 LOC** (7 NEW, 3 MODIFY)

---

## 9. Next Steps

1. [ ] Write design document (`admin-analytics-bi.design.md`)
2. [ ] Team review and approval
3. [ ] Start implementation (Backend API → Frontend 순서)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-14 | Initial draft | Crew |
