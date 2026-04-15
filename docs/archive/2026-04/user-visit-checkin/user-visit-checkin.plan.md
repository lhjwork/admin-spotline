# user-visit-checkin Planning Document

> **Summary**: 유저 Spot 방문 체크인 시스템 — 단순 toggle에서 GPS 기반 실제 방문 인증 + 다회 방문 기록 + 어드민 방문 분석으로 업그레이드
>
> **Project**: admin-spotLine (+ springboot-spotLine-backend, front-spotLine)
> **Author**: Crew
> **Date**: 2026-04-14
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 방문 기능은 단순 토글("가봤어요")로, 실제 방문 여부를 검증할 수 없고 다회 방문을 기록하지 못하며, 어드민이 방문 데이터를 분석할 수 없다 |
| **Solution** | GPS 기반 위치 인증 체크인 + 다회 방문 기록 + 체크인 메모 + 어드민 방문 분석 대시보드 구현 |
| **Function/UX Effect** | 유저는 Spot 근처에서 "체크인" 버튼으로 실제 방문을 인증하고, 방문 메모를 남기며, 방문 히스토리를 확인할 수 있다. 어드민은 방문 패턴을 분석하여 큐레이션 품질을 개선한다 |
| **Core Value** | 실제 방문 데이터 기반 추천 품질 향상 + 유저 참여도 증가 + 콘텐츠 신뢰성 강화 |

---

## 1. Overview

### 1.1 Purpose

기존 방문 기능(단순 토글)을 GPS 기반 실제 방문 체크인 시스템으로 업그레이드하여:
- 실제 방문 데이터를 수집하고 추천/피드 품질을 향상시킨다
- 다회 방문을 기록하여 유저의 경험 히스토리를 풍부하게 한다
- 어드민이 방문 데이터를 분석하여 큐레이션 전략을 최적화한다

### 1.2 Background

**현재 상태:**
- Backend: `SpotVisit` 엔티티 존재 (user_id + spot_id UNIQUE — 토글 방식)
- Front: `SpotBottomBar`에 "방문"/"가봤어요" 토글 버튼 존재
- API: `POST /api/v2/spots/{id}/visit` (토글), `GET /api/v2/users/{userId}/visited-spots`
- Admin: 방문 관련 분석 UI 없음

**개선 방향:**
- UNIQUE 제약 제거 → 다회 방문 기록 허용
- GPS 좌표 검증 추가 (Spot 위치 반경 500m 이내 체크)
- 체크인 메모(한줄평) 기능 추가
- 어드민 방문 분석 대시보드 추가

### 1.3 Related Documents

- CLAUDE.md — 프로젝트 구조 및 컨벤션
- `springboot-spotLine-backend/src/main/java/com/spotline/api/domain/entity/SpotVisit.java`
- `front-spotLine/src/components/spot/SpotBottomBar.tsx`
- `front-spotLine/src/store/useSocialStore.ts`

---

## 2. Scope

### 2.1 In Scope

- [ ] Backend: SpotVisit 엔티티 확장 (다회 방문, GPS 좌표, 메모)
- [ ] Backend: 체크인 API 신규 (위치 검증 포함)
- [ ] Backend: 방문 통계 API (어드민용)
- [ ] Front: 체크인 UI 리뉴얼 (GPS 인증 + 메모 입력)
- [ ] Front: 방문 히스토리 개선 (날짜별 목록, 방문 횟수)
- [ ] Admin: 방문 분석 대시보드 (인기 Spot by 체크인, 시간대별 패턴, 리텐션)

### 2.2 Out of Scope

- 방문 기반 리워드/포인트 시스템 (Phase 후속)
- 방문 사진 업로드 (spot-media-upload에서 다룸)
- 방문 기반 개인화 추천 알고리즘 (explore-recommendation-feed에서 다룸)
- 오프라인 체크인 지원

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 유저가 Spot 근처(500m)에서 GPS 기반 체크인 가능 | High | Pending |
| FR-02 | 동일 Spot에 24시간 간격으로 다회 체크인 가능 | High | Pending |
| FR-03 | 체크인 시 선택적 메모(100자) 입력 가능 | Medium | Pending |
| FR-04 | 유저 프로필에서 체크인 히스토리 확인 (날짜별) | High | Pending |
| FR-05 | Spot 상세에서 총 체크인 수 + 내 체크인 횟수 표시 | High | Pending |
| FR-06 | 어드민 대시보드: Spot별 체크인 통계 | High | Pending |
| FR-07 | 어드민 대시보드: 시간대별/요일별 체크인 패턴 | Medium | Pending |
| FR-08 | 어드민 대시보드: 체크인 Top Spots 랭킹 | Medium | Pending |
| FR-09 | 기존 "방문" 토글 → "체크인" 전환 (하위 호환) | High | Pending |
| FR-10 | 원거리 체크인 시 "원격 체크인" 라벨 표시 (GPS 범위 밖) | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 체크인 API 응답 < 300ms | Backend 로그 |
| Performance | GPS 위치 조회 < 3초 (프론트 타임아웃) | 브라우저 Geolocation API |
| Security | JWT 인증 필수, 위치 데이터 서버 검증 | API 미들웨어 |
| Privacy | GPS 좌표는 체크인 검증에만 사용, 정밀 위치 미저장 | verified 플래그만 저장 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 체크인 API 구현 (위치 검증 포함)
- [ ] 프론트 체크인 UI 리뉴얼
- [ ] 어드민 방문 분석 대시보드
- [ ] 기존 방문 데이터 마이그레이션
- [ ] Gap Analysis Match Rate >= 90%

### 4.2 Quality Criteria

- [ ] 체크인 API 에러 처리 (GPS 미지원, 위치 권한 거부 등)
- [ ] 기존 "방문" 토글 동작 하위 호환
- [ ] 모바일 브라우저 GPS 정상 동작 확인

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| GPS 정확도 낮음 (실내, 지하) | Medium | High | 반경 500m으로 여유 확보 + 원격 체크인 허용 옵션 |
| 기존 SpotVisit 데이터 마이그레이션 | Medium | Low | 기존 데이터를 verified=false로 마이그레이션 |
| 브라우저 위치 권한 거부 | Medium | Medium | 위치 없이도 "원격 체크인" 허용 (verified=false) |
| 다회 방문으로 DB 데이터 증가 | Low | Medium | 24시간 간격 제한 + 인덱스 최적화 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS | Web apps with backend | ☑ |
| **Enterprise** | Strict layer separation | High-traffic systems | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 방문 모델 | 토글 유지 / 다회 기록 | 다회 기록 | 실제 방문 데이터 축적이 핵심 가치 |
| GPS 검증 | 클라이언트만 / 서버 검증 | 서버 검증 | 위변조 방지, 신뢰성 확보 |
| 위치 저장 | 정밀 좌표 / verified 플래그만 | verified 플래그만 | 프라이버시 보호 |
| 체크인 간격 | 무제한 / 24h / 12h | 24h | 의미 있는 재방문 데이터 확보 |
| 기존 호환 | 완전 교체 / 하위 호환 | 하위 호환 | 기존 "가봤어요" 토글 + 신규 체크인 공존 |

### 6.3 데이터 모델 변경

```
SpotVisit (기존 — 수정)
├── id: UUID (PK)
├── userId: String (FK → User)
├── spotId: UUID (FK → Spot)
├── memo: String (100자, nullable)
├── verified: Boolean (GPS 검증 여부)
├── createdAt: LocalDateTime
└── UNIQUE(user_id, spot_id) 제거 → INDEX(user_id, spot_id, created_at)

SpotCheckinStats (신규 — 어드민 통계용 캐시)
├── spotId: UUID (PK, FK → Spot)
├── totalCheckins: Integer
├── uniqueVisitors: Integer
├── lastCheckinAt: LocalDateTime
└── updatedAt: LocalDateTime
```

### 6.4 API 변경

```
# 신규
POST /api/v2/spots/{id}/checkin          — 체크인 (GPS 좌표 + 메모)
GET  /api/v2/spots/{id}/checkins         — Spot 체크인 목록 (공개)
GET  /api/v2/users/{userId}/checkins     — 유저 체크인 히스토리

# 어드민
GET  /api/v2/admin/checkin-stats         — 전체 체크인 통계
GET  /api/v2/admin/checkin-stats/top     — Top Spots by 체크인
GET  /api/v2/admin/checkin-stats/pattern — 시간대/요일 패턴

# 기존 유지 (하위 호환)
POST /api/v2/spots/{id}/visit            — 토글 (기존 동작 유지)
GET  /api/v2/users/{userId}/visited-spots — 방문한 Spot 목록 (기존 유지)
```

### 6.5 구현 범위 (레포별)

| Repo | Scope | Priority |
|------|-------|----------|
| springboot-spotLine-backend | SpotVisit 엔티티 확장, 체크인 API, 통계 API | 1st |
| front-spotLine | 체크인 UI, 히스토리 개선, GPS 통합 | 2nd |
| admin-spotLine | 방문 분석 대시보드 페이지 | 3rd |

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] TypeScript configuration (`tsconfig.json`)
- [x] ESLint + Prettier configured
- [x] Tailwind CSS 4, 모바일 퍼스트

### 7.2 Conventions to Follow

| Category | Convention |
|----------|-----------|
| API 패턴 | Spring Boot Controller → Service → Repository |
| DTO 네이밍 | `CheckinRequest`, `CheckinResponse`, `CheckinStatsResponse` |
| 프론트 서비스 | `src/services/v2/checkinAPI.ts` (기존 패턴 따름) |
| 어드민 페이지 | `src/pages/CheckinAnalytics.tsx` |
| 상태 관리 | React Query (어드민), Zustand (프론트 소셜) |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| (없음) | GPS는 브라우저 API 사용, 별도 env 불필요 | - | - |

---

## 8. Next Steps

1. [ ] Write design document (`user-visit-checkin.design.md`)
2. [ ] Backend: SpotVisit 엔티티 확장 + 마이그레이션
3. [ ] Backend: 체크인 API + 통계 API 구현
4. [ ] Front: 체크인 UI + 히스토리 개선
5. [ ] Admin: 방문 분석 대시보드

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-14 | Initial draft | Crew |
