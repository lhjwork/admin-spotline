# user-visit-checkin Design Document

> **Summary**: GPS 기반 실제 방문 체크인 시스템 — 단순 토글을 다회 체크인 + 위치 검증 + 메모 + 어드민 분석으로 업그레이드
>
> **Project**: admin-spotLine (+ springboot-spotLine-backend, front-spotLine)
> **Author**: Claude Code
> **Date**: 2026-04-15
> **Status**: Draft
> **Planning Doc**: [user-visit-checkin.plan.md](../01-plan/features/user-visit-checkin.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 기존 `SpotVisit` 엔티티(UNIQUE 토글)를 다회 방문 기록으로 확장
- GPS 기반 위치 검증을 서버에서 수행하여 체크인 신뢰성 확보
- 기존 `/api/v2/spots/{id}/visit` 토글 API 하위 호환 유지
- 어드민 방문 분석 대시보드를 기존 Analytics 패턴에 맞춰 추가

### 1.2 Design Principles

- **하위 호환**: 기존 "가봤어요" 토글 동작 보존, 체크인은 신규 API로 분리
- **프라이버시**: GPS 좌표를 DB에 저장하지 않고 `verified` 플래그만 기록
- **기존 패턴 준수**: Backend는 Controller→Service→Repository, Frontend는 Zustand + API service, Admin은 React Query + recharts

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        3개 레포 변경 범위                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  springboot-spotLine-backend (1st)                                  │
│  ├── SpotVisit 엔티티 확장 (UNIQUE 제거, memo/verified 추가)         │
│  ├── CheckinController (신규 체크인 API 3개)                         │
│  ├── CheckinService (GPS 검증 + 24h 간격 체크)                      │
│  ├── AdminCheckinController (통계 API 3개)                          │
│  └── DB 마이그레이션 (UNIQUE 제거, 컬럼 추가, 인덱스)                 │
│                                                                     │
│  front-spotLine (2nd)                                               │
│  ├── SpotBottomBar 리뉴얼 (체크인 버튼 + GPS 요청)                   │
│  ├── CheckinMemoModal (체크인 시 메모 입력)                          │
│  ├── checkinAPI.ts (신규 API 서비스)                                 │
│  ├── useSocialStore 확장 (checkinCount 추가)                        │
│  └── ProfileTabs "방문" 탭 개선 (날짜별 + 방문 횟수)                  │
│                                                                     │
│  admin-spotLine (3rd)                                               │
│  ├── CheckinAnalytics 페이지 (기존 Analytics 패턴)                   │
│  ├── checkinAPI.ts (어드민 통계 API 서비스)                          │
│  └── 라우팅 + 네비게이션 등록                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow — 체크인

```
User clicks "체크인" (SpotBottomBar)
  ↓
Browser Geolocation API → { latitude, longitude }
  ↓ (3초 타임아웃, 실패 시 null)
POST /api/v2/spots/{id}/checkin { lat, lng, memo? }
  ↓
CheckinService:
  1. Spot 조회 → lat/lng 가져오기
  2. 거리 계산 (Haversine) → 500m 이내면 verified=true
  3. 24시간 이내 동일 Spot 체크인 여부 확인
  4. SpotVisit 저장 (memo, verified)
  5. Spot.visitedCount 증가
  ↓
Response: CheckinResponse { id, verified, visitedCount, myCheckinCount }
  ↓
useSocialStore 업데이트 → UI 반영
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| CheckinController | CheckinService | 체크인 비즈니스 로직 |
| CheckinService | SpotVisitRepository, SpotRepository | 데이터 접근 |
| SpotBottomBar | checkinAPI, Geolocation API | 체크인 요청 전송 |
| CheckinAnalytics | checkinAPI (admin) | 통계 데이터 조회 |

---

## 3. Data Model

### 3.1 SpotVisit 엔티티 변경

```java
// 기존 → 변경
@Entity
@Table(name = "spot_visits")  // UNIQUE 제약 제거
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SpotVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spot_id", nullable = false)
    private Spot spot;

    // NEW: 체크인 메모 (100자)
    @Column(length = 100)
    private String memo;

    // NEW: GPS 검증 여부 (500m 이내 = true)
    @Builder.Default
    @Column(nullable = false)
    private Boolean verified = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
```

### 3.2 Entity Relationships

```
[User] 1 ──── N [SpotVisit] N ──── 1 [Spot]
                  ├── memo (optional)
                  ├── verified (boolean)
                  └── createdAt (timestamp)
```

### 3.3 Database Migration (V__checkin_upgrade.sql)

```sql
-- 1. UNIQUE 제약 제거
ALTER TABLE spot_visits DROP CONSTRAINT IF EXISTS uq_spot_visit_user_spot;

-- 2. 새 컬럼 추가
ALTER TABLE spot_visits ADD COLUMN memo VARCHAR(100);
ALTER TABLE spot_visits ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false;

-- 3. 기존 데이터: verified=false로 유지 (Plan에서 결정)

-- 4. 인덱스 변경
CREATE INDEX idx_spot_visit_user_spot_created
  ON spot_visits(user_id, spot_id, created_at DESC);

-- 5. 24시간 중복 체크용 인덱스
CREATE INDEX idx_spot_visit_recent
  ON spot_visits(user_id, spot_id, created_at DESC);
```

---

## 4. API Specification

### 4.1 신규 체크인 API

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/v2/spots/{id}/checkin | 체크인 (GPS + 메모) | Required |
| GET | /api/v2/spots/{id}/checkins | Spot 체크인 목록 | Public |
| GET | /api/v2/users/{userId}/checkins | 유저 체크인 히스토리 | Required |

### 4.2 신규 어드민 통계 API

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/v2/admin/checkin-stats | 전체 체크인 통계 | Admin |
| GET | /api/v2/admin/checkin-stats/top | Top Spots by 체크인 | Admin |
| GET | /api/v2/admin/checkin-stats/pattern | 시간대/요일 패턴 | Admin |

### 4.3 기존 API (하위 호환 유지)

| Method | Path | Description | 변경 |
|--------|------|-------------|------|
| POST | /api/v2/spots/{id}/visit | 토글 (기존 동작) | 없음 |
| GET | /api/v2/users/{userId}/visited-spots | 방문한 Spot 목록 | 없음 |

### 4.4 Detailed Specification

#### `POST /api/v2/spots/{id}/checkin`

**Request:**
```json
{
  "latitude": 37.5445,
  "longitude": 127.0567,
  "memo": "분위기 좋은 카페, 재방문 의사 있음"
}
```
- `latitude`, `longitude`: nullable (GPS 불가 시 null → verified=false)
- `memo`: optional, max 100자

**Response (201 Created):**
```json
{
  "id": "uuid",
  "spotId": "uuid",
  "verified": true,
  "memo": "분위기 좋은 카페, 재방문 의사 있음",
  "visitedCount": 15,
  "myCheckinCount": 3,
  "createdAt": "2026-04-15T14:30:00"
}
```

**Error Responses:**
- `400 Bad Request`: 메모 100자 초과
- `401 Unauthorized`: 인증 필요
- `404 Not Found`: Spot 없음
- `429 Too Many Requests`: 24시간 이내 동일 Spot 체크인 이미 존재

#### `GET /api/v2/spots/{id}/checkins`

**Query Params:** `page` (default 0), `size` (default 20)

**Response (200):**
```json
{
  "content": [
    {
      "id": "uuid",
      "userId": "user-id",
      "nickname": "닉네임",
      "avatar": "url",
      "memo": "메모 내용",
      "verified": true,
      "createdAt": "2026-04-15T14:30:00"
    }
  ],
  "totalElements": 42,
  "totalPages": 3
}
```

#### `GET /api/v2/users/{userId}/checkins`

**Query Params:** `page` (default 0), `size` (default 20)

**Response (200):**
```json
{
  "content": [
    {
      "id": "uuid",
      "spotId": "uuid",
      "spotTitle": "카페 이름",
      "spotSlug": "cafe-name",
      "spotThumbnail": "url",
      "memo": "메모",
      "verified": true,
      "createdAt": "2026-04-15T14:30:00"
    }
  ],
  "totalElements": 15,
  "totalPages": 1
}
```

#### `GET /api/v2/admin/checkin-stats`

**Query Params:** `from` (date), `to` (date)

**Response (200):**
```json
{
  "totalCheckins": 1250,
  "verifiedCheckins": 980,
  "uniqueUsers": 340,
  "uniqueSpots": 156,
  "verificationRate": 78.4,
  "avgCheckinsPerUser": 3.7
}
```

#### `GET /api/v2/admin/checkin-stats/top`

**Query Params:** `from`, `to`, `limit` (default 10)

**Response (200):**
```json
{
  "spots": [
    {
      "spotId": "uuid",
      "spotTitle": "성수 카페",
      "area": "성수",
      "totalCheckins": 85,
      "uniqueVisitors": 62,
      "verifiedRate": 82.3
    }
  ]
}
```

#### `GET /api/v2/admin/checkin-stats/pattern`

**Query Params:** `from`, `to`

**Response (200):**
```json
{
  "hourly": [
    { "hour": 0, "count": 12 },
    { "hour": 1, "count": 5 }
  ],
  "daily": [
    { "dayOfWeek": "MONDAY", "count": 180 },
    { "dayOfWeek": "TUESDAY", "count": 195 }
  ]
}
```

---

## 5. UI/UX Design

### 5.1 Front — SpotBottomBar 체크인 버튼 변경

```
기존:
┌──────────────────────────────────────────────────┐
│  ❤️ 좋아요  🔖 저장  📍 방문  🔗 공유  ➕ SpotLine │
└──────────────────────────────────────────────────┘

변경:
┌──────────────────────────────────────────────────┐
│  ❤️ 좋아요  🔖 저장  ✅ 체크인(3) 🔗 공유 ➕ SpotLine│
└──────────────────────────────────────────────────┘

- "방문"/"가봤어요" 토글 → "체크인" + 내 체크인 횟수 표시
- 클릭 시: GPS 위치 조회 → CheckinMemoModal 표시
- 24시간 이내 재체크인 시: "오늘 이미 체크인했어요" 토스트
```

### 5.2 Front — CheckinMemoModal

```
┌─────────────────────────────────────────────┐
│ 체크인                                 [X]  │
├─────────────────────────────────────────────┤
│                                             │
│  📍 GPS 확인됨 (✅ 인증 체크인)              │
│  또는                                       │
│  📍 위치를 확인할 수 없어요 (원격 체크인)      │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 한줄 메모 (선택)            72/100  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│           [ 체크인하기 ]                     │
└─────────────────────────────────────────────┘
```

### 5.3 Front — ProfileTabs "방문" 탭 개선

```
기존: 단순 SpotPreviewCard 그리드

변경:
┌─────────────────────────────────────────────┐
│ 방문한 Spot (15)                            │
├─────────────────────────────────────────────┤
│ 4월 15일 (화)                               │
│ ┌──────────┐ ┌──────────┐                   │
│ │ 성수 카페 │ │ 을지로 바│                   │
│ │ ✅ 3회   │ │ 📍 1회  │                   │
│ └──────────┘ └──────────┘                   │
│                                             │
│ 4월 13일 (일)                               │
│ ┌──────────┐                                │
│ │ 연남 레스토랑│                             │
│ │ ✅ 2회   │                                │
│ └──────────┘                                │
└─────────────────────────────────────────────┘

- 날짜별 그룹핑
- 각 카드에 체크인 횟수 + verified 아이콘 표시
```

### 5.4 Admin — CheckinAnalytics 페이지

```
┌─────────────────────────────────────────────────────────┐
│ 체크인 분석                    [ 2026-04-01 ~ 04-15 ▼ ] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │총 체크인  │ │인증 체크인│ │순 방문자  │ │인증률     │    │
│ │  1,250   │ │   980    │ │   340    │ │  78.4%   │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                         │
│ [인기 Spot] [시간대 패턴]                                │
│                                                         │
│ ── 인기 Spot ──                                         │
│ # │ Spot 이름    │ 지역  │ 체크인 │ 방문자 │ 인증률     │
│ 1 │ 성수 카페    │ 성수  │   85  │   62  │ 82.3%    │
│ 2 │ 을지로 바    │ 을지로│   72  │   51  │ 75.0%    │
│ ...                                                     │
│                                                         │
│ ── 시간대 패턴 ──                                        │
│ BarChart: 시간대별 체크인 수 (0~23시)                     │
│                                                         │
│ ── 요일 패턴 ──                                          │
│ BarChart: 요일별 체크인 수 (월~일)                        │
│                                                         │
│                                          [ CSV 내보내기 ]│
└─────────────────────────────────────────────────────────┘
```

### 5.5 Component List

| Component | Repo | Location | Responsibility |
|-----------|------|----------|----------------|
| CheckinController | backend | `controller/CheckinController.java` | 체크인 API 엔드포인트 (NEW) |
| CheckinService | backend | `service/CheckinService.java` | GPS 검증, 24h 체크, 저장 (NEW) |
| AdminCheckinController | backend | `controller/AdminCheckinController.java` | 어드민 통계 API (NEW) |
| CheckinMemoModal | front | `src/components/spot/CheckinMemoModal.tsx` | 체크인 메모 입력 모달 (NEW) |
| SpotBottomBar | front | `src/components/spot/SpotBottomBar.tsx` | 체크인 버튼 변경 (MODIFY) |
| useSocialStore | front | `src/store/useSocialStore.ts` | checkinCount 추가 (MODIFY) |
| ProfileTabs | front | `src/components/profile/ProfileTabs.tsx` | 날짜별 그룹핑 개선 (MODIFY) |
| checkinAPI | front | `src/services/v2/checkinAPI.ts` | 체크인 API 서비스 (NEW) |
| CheckinAnalytics | admin | `src/pages/CheckinAnalytics.tsx` | 체크인 분석 페이지 (NEW) |
| checkinAPI | admin | `src/services/v2/checkinAPI.ts` | 어드민 통계 API 서비스 (NEW) |

---

## 6. Error Handling

### 6.1 에러 시나리오

| Scenario | Code | Handling |
|----------|------|----------|
| GPS 위치 조회 실패/거부 | - | lat/lng null로 전송 → verified=false "원격 체크인" |
| GPS 3초 타임아웃 | - | 타임아웃 → lat/lng null → 원격 체크인 |
| 24시간 이내 재체크인 | 429 | "오늘 이미 체크인했어요" 토스트 메시지 |
| 메모 100자 초과 | 400 | 프론트에서 maxLength 제한 + 백엔드 검증 |
| Spot 없음 | 404 | "존재하지 않는 Spot입니다" |
| 미인증 | 401 | 로그인 모달 표시 (기존 패턴) |

---

## 7. Security Considerations

- [x] JWT 인증 필수 (체크인 API)
- [x] GPS 좌표는 서버에서 검증만 수행, DB에 저장하지 않음 (verified 플래그만)
- [x] 메모 입력 XSS 방지: 백엔드에서 HTML 태그 strip
- [x] 24시간 중복 체크인 방지 (서버측 검증)
- [x] 어드민 API는 admin role 체크 (기존 미들웨어)

---

## 8. Test Plan

### 8.1 Test Cases (수동 검증)

- [ ] Happy path: Spot 500m 이내에서 체크인 → verified=true, visitedCount 증가
- [ ] 원격 체크인: GPS 거부/불가 시 → verified=false로 저장
- [ ] 24시간 제한: 같은 Spot 재체크인 → 429 에러, 안내 메시지
- [ ] 메모 저장: 100자 메모 입력 → 정상 저장, 101자 → 차단
- [ ] 하위 호환: 기존 `/visit` 토글 API → 기존과 동일 동작
- [ ] 프로필 히스토리: 다회 체크인 후 → 날짜별 그룹 + 횟수 정확 표시
- [ ] 어드민 통계: Top Spots 랭킹, 시간대 패턴 차트 정확 표시
- [ ] CSV 내보내기: 어드민 통계 데이터 → CSV 다운로드

---

## 9. Implementation Guide

### 9.1 File Structure

```
springboot-spotLine-backend/src/main/java/com/spotline/api/
├── domain/entity/
│   └── SpotVisit.java                    ← MODIFY (memo, verified 추가, UNIQUE 제거)
├── domain/repository/
│   └── SpotVisitRepository.java          ← MODIFY (신규 쿼리 메서드 추가)
├── controller/
│   ├── CheckinController.java            ← NEW
│   └── AdminCheckinController.java       ← NEW
├── service/
│   └── CheckinService.java              ← NEW
├── dto/request/
│   └── CheckinRequest.java              ← NEW
└── dto/response/
    ├── CheckinResponse.java             ← NEW
    ├── CheckinListResponse.java         ← NEW
    ├── CheckinStatsResponse.java        ← NEW
    ├── TopSpotCheckinResponse.java      ← NEW
    └── CheckinPatternResponse.java      ← NEW

front-spotLine/src/
├── components/spot/
│   ├── SpotBottomBar.tsx                 ← MODIFY (체크인 로직 변경)
│   └── CheckinMemoModal.tsx             ← NEW
├── components/profile/
│   └── ProfileTabs.tsx                   ← MODIFY (날짜 그룹핑)
├── services/v2/
│   └── checkinAPI.ts                    ← NEW
├── store/
│   └── useSocialStore.ts                ← MODIFY (checkinCount)
└── lib/
    └── geolocation.ts                   ← NEW (GPS 유틸리티)

admin-spotLine/src/
├── pages/
│   └── CheckinAnalytics.tsx             ← NEW
├── components/analytics/
│   ├── CheckinTopSpotsTable.tsx         ← NEW
│   └── CheckinPatternChart.tsx          ← NEW
├── services/v2/
│   └── checkinAPI.ts                    ← NEW
└── types/
    └── v2.ts                            ← MODIFY (타입 추가)
```

### 9.2 Implementation Order

1. [ ] **Backend: DB 마이그레이션** — UNIQUE 제거, memo/verified 컬럼 추가
2. [ ] **Backend: SpotVisit 엔티티** — memo, verified 필드 추가, UNIQUE 어노테이션 제거
3. [ ] **Backend: SpotVisitRepository** — 신규 쿼리 메서드 추가 (24h 체크, 통계용)
4. [ ] **Backend: DTOs** — CheckinRequest, CheckinResponse 등 6개 DTO
5. [ ] **Backend: CheckinService** — GPS Haversine 거리 계산, 24h 중복 체크, 체크인 저장
6. [ ] **Backend: CheckinController** — 체크인/목록/히스토리 API 3개
7. [ ] **Backend: AdminCheckinController** — 통계/Top/패턴 API 3개
8. [ ] **Front: geolocation.ts** — 브라우저 GPS 위치 조회 유틸리티 (3초 타임아웃)
9. [ ] **Front: checkinAPI.ts** — 체크인 API 서비스
10. [ ] **Front: CheckinMemoModal** — 메모 입력 모달 컴포넌트
11. [ ] **Front: SpotBottomBar** — 토글 → 체크인 버튼 변경, GPS 연동
12. [ ] **Front: useSocialStore** — checkinCount 상태 추가
13. [ ] **Front: ProfileTabs** — 체크인 히스토리 날짜별 그룹핑
14. [ ] **Admin: checkinAPI.ts** — 어드민 통계 API 서비스
15. [ ] **Admin: CheckinAnalytics** — 분석 페이지 + 차트 + 테이블
16. [ ] **Admin: 라우팅 + 네비게이션** — App.tsx + Layout.tsx 등록

### 9.3 GPS 거리 계산 (Haversine)

```java
// CheckinService.java
private static final double CHECKIN_RADIUS_METERS = 500.0;

private boolean isWithinRadius(double userLat, double userLng, double spotLat, double spotLng) {
    final double R = 6371000; // 지구 반지름 (미터)
    double dLat = Math.toRadians(spotLat - userLat);
    double dLng = Math.toRadians(spotLng - userLng);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
             + Math.cos(Math.toRadians(userLat)) * Math.cos(Math.toRadians(spotLat))
             * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c <= CHECKIN_RADIUS_METERS;
}
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-15 | Initial draft | Claude Code |
