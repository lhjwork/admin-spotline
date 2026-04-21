# User-Generated Spot & SpotLine Creation UI Design Document

> **Summary**: SpotStatus approval workflow, My Spots management, Spot edit mode, and admin user-content review dashboard
>
> **Project**: Spotline — Experience Based Social Platform
> **Author**: Crew
> **Date**: 2026-04-15
> **Status**: Draft
> **Planning Doc**: [user-generated-spot-spotline-creation-ui.plan.md](../../01-plan/features/user-generated-spot-spotline-creation-ui.plan.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | User-created Spots go live immediately without quality review; users cannot manage or edit their submissions |
| **Solution** | SpotStatus enum (PENDING/APPROVED/REJECTED) + My Spots page + Spot edit mode + admin review dashboard |
| **Function/UX Effect** | Users get full CRUD lifecycle with status visibility; admins review content before public display |
| **Core Value** | Content quality control enables trust and scalability as user-generated content grows |

---

## 1. Overview

### 1.1 Design Goals

- Add SpotStatus approval workflow without breaking existing Spot CRUD
- Reuse existing UI patterns (MySpotLines page → My Spots, ModerationQueue → UserContentReview)
- Minimal backend changes: enum column + 2 new endpoints + query filter updates

### 1.2 Design Principles

- **DRY**: Reuse SpotCreateForm with `mode` prop for edit
- **Backward Compatibility**: Existing Spots default to APPROVED via migration
- **Separation of Concerns**: Backend enforces authorization; frontend handles presentation

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────┐     ┌─────────────────────────┐     ┌──────────────┐
│  front-spotLine  │────▶│  springboot-backend      │────▶│  PostgreSQL  │
│  (My Spots, Edit)│     │  (SpotStatus + approval) │     │  (Spot table)│
└──────────────────┘     └─────────────────────────┘     └──────────────┘
                                    ▲
┌──────────────────┐                │
│  admin-spotLine  │────────────────┘
│  (Content Review)│
└──────────────────┘
```

### 2.2 Data Flow

```
[User Creates Spot] → source=USER → status=PENDING → DB
[Admin Reviews]     → approve/reject endpoint → status=APPROVED/REJECTED → DB
[Public Listings]   → query WHERE status=APPROVED AND isActive=true
[My Spots Page]     → query WHERE creatorId=userId (all statuses)
[User Edits Spot]   → only when status=PENDING or REJECTED → status resets to PENDING
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| My Spots page | fetchMySpots API (exists) | User's Spot list |
| Spot edit mode | SpotCreateForm (exists) | Reuse form with pre-fill |
| Admin review | spotAPI service (exists) | Approve/reject API calls |
| Status badge | SpotStatus type (new) | Visual status indicator |

---

## 3. Data Model

### 3.1 SpotStatus Enum (NEW)

```java
// springboot-spotLine-backend/src/main/java/com/spotline/api/domain/enums/SpotStatus.java
public enum SpotStatus {
    PENDING,    // 검토 중 — default for USER source
    APPROVED,   // 승인됨 — default for CREW/QR source
    REJECTED    // 반려됨
}
```

### 3.2 Spot Entity Modifications

```java
// Spot.java — ADD fields
@Enumerated(EnumType.STRING)
@Column(nullable = false)
private SpotStatus status = SpotStatus.PENDING;

@Column(length = 500)
private String rejectionReason;

private LocalDateTime reviewedAt;

private String reviewedBy;  // admin userId who reviewed
```

### 3.3 Database Migration

```sql
-- Add status column with default APPROVED (existing data)
ALTER TABLE spots ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';
ALTER TABLE spots ADD COLUMN rejection_reason VARCHAR(500);
ALTER TABLE spots ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE spots ADD COLUMN reviewed_by VARCHAR(255);

-- Index for status queries
CREATE INDEX idx_spots_status ON spots(status);
CREATE INDEX idx_spots_status_created ON spots(status, created_at DESC);
```

### 3.4 TypeScript Types

```typescript
// front-spotLine/src/types/index.ts — ADD
type SpotStatus = "PENDING" | "APPROVED" | "REJECTED";

// SpotDetailResponse — ADD fields
interface SpotDetailResponse {
  // ... existing fields
  status: SpotStatus;
  rejectionReason?: string;
  reviewedAt?: string;
}
```

```typescript
// admin-spotLine/src/types/v2.ts — ADD
enum SpotStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// Add to existing Spot types
interface SpotResponse {
  // ... existing fields
  status: SpotStatus;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| PUT | `/api/v2/spots/{slug}/approve` | Approve a PENDING Spot | Admin |
| PUT | `/api/v2/spots/{slug}/reject` | Reject a PENDING Spot | Admin |
| GET | `/api/v2/spots/my` | List user's own Spots | User |
| GET | `/api/v2/spots/pending` | List PENDING Spots for admin | Admin |
| PUT | `/api/v2/spots/{slug}` | Update own Spot (existing, add status check) | Owner |

### 4.2 Detailed Specifications

#### `PUT /api/v2/spots/{slug}/approve`

**Request:** No body required.

**Response (200):**
```json
{
  "slug": "cafe-abc",
  "status": "APPROVED",
  "reviewedAt": "2026-04-15T12:00:00Z"
}
```

**Authorization:** Admin role required.

#### `PUT /api/v2/spots/{slug}/reject`

**Request:**
```json
{
  "reason": "주소 정보가 정확하지 않습니다"
}
```

**Response (200):**
```json
{
  "slug": "cafe-abc",
  "status": "REJECTED",
  "rejectionReason": "주소 정보가 정확하지 않습니다",
  "reviewedAt": "2026-04-15T12:00:00Z"
}
```

#### `GET /api/v2/spots/my?status={status}&page={page}&size={size}`

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | SpotStatus | (all) | Filter by status |
| page | int | 0 | Page number (0-indexed) |
| size | int | 20 | Page size |

**Response (200):** `SpringPage<SpotDetailResponse>`

#### `GET /api/v2/spots/pending?page={page}&size={size}&sort={sort}`

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 0 | Page number |
| size | int | 20 | Page size |
| sort | string | createdAt,asc | Sort order (oldest first for FIFO review) |

**Response (200):** `SpringPage<SpotDetailResponse>`

### 4.3 Existing Endpoint Modifications

#### `POST /api/v2/spots` (create)
- **Change**: Set `status = PENDING` when `source = USER`, `status = APPROVED` when `source = CREW/QR`

#### `PUT /api/v2/spots/{slug}` (update)
- **Change**: Only allow when `status = PENDING` or `REJECTED` (for owner). Reset `status = PENDING` on edit.
- **Error**: `403 Forbidden` if status is APPROVED (cannot edit approved Spots)

#### `GET /api/v2/spots` (public list), `GET /api/v2/spots/nearby`, search endpoints
- **Change**: Add `WHERE status = 'APPROVED'` to all public-facing queries

#### `GET /api/v2/spots/{slug}` (detail)
- **Change**: Return for APPROVED Spots OR when requester is the creator

---

## 5. UI/UX Design

### 5.1 My Spots Page (`/my-spots`)

```
┌────────────────────────────────────────┐
│  ← 내 Spot 관리                        │
├────────────────────────────────────────┤
│  [전체] [검토 중] [승인됨] [반려됨]       │
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │ 📍 카페 이름         [검토 중] 🟡 │  │
│  │ 강남구 · 카페                    │  │
│  │                    [수정] [삭제]  │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 📍 레스토랑 이름      [승인됨] 🟢 │  │
│  │ 마포구 · 식당                    │  │
│  │                          [보기]  │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 📍 바 이름           [반려됨] 🔴 │  │
│  │ 용산구 · 바                      │  │
│  │ 사유: 주소 정보가 부정확합니다      │  │
│  │                    [수정] [삭제]  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

**Status Badges:**
| Status | Label | Color | Actions |
|--------|-------|-------|---------|
| PENDING | 검토 중 | Yellow (amber-500) | 수정, 삭제 |
| APPROVED | 승인됨 | Green (emerald-500) | 보기 |
| REJECTED | 반려됨 | Red (red-500) | 수정, 삭제 |

**Tab Counts:** Each tab shows count badge `전체(5) 검토 중(2) 승인됨(2) 반려됨(1)`

### 5.2 SpotCreateForm Edit Mode

```
SpotCreateForm props:
- mode: "create" | "edit"
- initialData?: SpotDetailResponse  (for edit mode)
- onSuccess?: (slug: string) => void

Edit mode differences:
- Title: "Spot 수정" instead of "Spot 등록"
- Pre-fills all fields from initialData
- Submit calls updateSpot(slug, data) instead of createSpot(data)
- Shows info banner: "수정 시 다시 검토 대기 상태가 됩니다"
- Redirects to /my-spots after success
```

### 5.3 SpotStatusBadge Component

```typescript
// SpotStatusBadge.tsx
interface SpotStatusBadgeProps {
  status: SpotStatus;
  size?: "sm" | "md";
}

// Renders:
// PENDING  → <span class="bg-amber-100 text-amber-700">검토 중</span>
// APPROVED → <span class="bg-emerald-100 text-emerald-700">승인됨</span>
// REJECTED → <span class="bg-red-100 text-red-700">반려됨</span>
```

### 5.4 Admin — User Content Review Page

```
┌──────────────────────────────────────────────────┐
│  유저 콘텐츠 검토                    대기 중: 12  │
├──────────────────────────────────────────────────┤
│  [대기 중] [승인됨] [반려됨]                       │
├──────────────────────────────────────────────────┤
│  검색: [________________] 카테고리: [전체 ▼]      │
├──────────────────────────────────────────────────┤
│  │ 제목      │ 카테고리 │ 지역  │ 작성자  │ 작성일  │ 액션    │
│  ├──────────┼────────┼──────┼───────┼───────┼───────┤
│  │ 카페 ABC  │ 카페   │ 강남  │ user1 │ 04-15 │[승인][반려]│
│  │ 맛집 DEF  │ 식당   │ 마포  │ user2 │ 04-14 │[승인][반려]│
├──────────────────────────────────────────────────┤
│  < 1 2 3 ... >                                   │
└──────────────────────────────────────────────────┘

[반려] 클릭 시 모달:
┌───────────────────────────┐
│  반려 사유 입력             │
│  [________________________]│
│           [취소] [반려 확인] │
└───────────────────────────┘
```

### 5.5 User Flow

```
[User] Create Spot → status=PENDING → My Spots (검토 중)
                                           ↓
[Admin] Review → Approve → status=APPROVED → Public listing
              → Reject  → status=REJECTED → My Spots (반려됨, 사유 표시)
                                                 ↓
[User] Edit → status resets to PENDING → Admin re-reviews
```

### 5.6 Component List

| Component | Location | Repo | Action |
|-----------|----------|------|--------|
| SpotStatusBadge | `src/components/spot/SpotStatusBadge.tsx` | front | NEW |
| MySpotCard | `src/components/spot/MySpotCard.tsx` | front | NEW |
| MySpotsList | `src/components/spot/MySpotsList.tsx` | front | NEW |
| my-spots/page.tsx | `src/app/my-spots/page.tsx` | front | NEW |
| SpotCreateForm | `src/components/spot/SpotCreateForm.tsx` | front | MODIFY (add edit mode) |
| my-spots/[slug]/edit/page.tsx | `src/app/my-spots/[slug]/edit/page.tsx` | front | NEW |
| useMySpotStore | `src/store/useMySpotStore.ts` | front | NEW |
| types/index.ts | `src/types/index.ts` | front | MODIFY (add SpotStatus) |
| lib/api.ts | `src/lib/api.ts` | front | MODIFY (add updateSpot) |
| UserContentReview | `src/pages/UserContentReview.tsx` | admin | NEW |
| Layout | `src/components/Layout.tsx` | admin | MODIFY (add nav item) |
| spotAPI | `src/services/v2/spotAPI.ts` | admin | MODIFY (add approve/reject) |
| types/v2.ts | `src/types/v2.ts` | admin | MODIFY (add SpotStatus) |

---

## 6. Error Handling

### 6.1 Error Codes

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | 반려 사유를 입력해주세요 | Reject without reason | Show validation error |
| 403 | 승인된 Spot은 수정할 수 없습니다 | Edit APPROVED Spot | Show toast, redirect |
| 403 | 권한이 없습니다 | Non-admin approve/reject | Show error toast |
| 403 | 본인의 Spot만 수정할 수 있습니다 | Edit others' Spot | Show error toast |
| 404 | Spot을 찾을 수 없습니다 | Invalid slug | Show 404 page |

### 6.2 Error Response Format

```json
{
  "status": 403,
  "error": "Forbidden",
  "message": "승인된 Spot은 수정할 수 없습니다"
}
```

---

## 7. Security Considerations

- [x] Only admins can call approve/reject endpoints (Spring Security role check)
- [x] Only Spot owners can edit their own Spots (creatorId check)
- [x] Spot edit only allowed when PENDING or REJECTED (status check in service)
- [x] Public queries filter to APPROVED only (no data leakage of pending content)
- [x] Spot detail accessible for APPROVED OR own Spots only
- [x] Input validation on rejection reason (max 500 chars, XSS sanitize)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Method |
|------|--------|--------|
| Manual | Approval workflow | Create → Review → Approve/Reject cycle |
| Manual | My Spots CRUD | Create, edit, delete with status checks |
| Manual | Public filtering | Verify PENDING Spots not in public lists |
| Manual | Admin review | Approve/reject with reason, pagination |

### 8.2 Key Test Cases

- [ ] User creates Spot → status is PENDING
- [ ] Crew creates Spot → status is APPROVED
- [ ] Admin approves → status changes to APPROVED, shows in public
- [ ] Admin rejects with reason → status REJECTED, reason displayed in My Spots
- [ ] User edits REJECTED Spot → status resets to PENDING
- [ ] User cannot edit APPROVED Spot → 403 error
- [ ] Public listing excludes PENDING and REJECTED Spots
- [ ] My Spots shows all statuses with correct filtering
- [ ] Non-admin cannot access approve/reject endpoints

---

## 9. Clean Architecture

### 9.1 Layer Assignment

**Backend (Spring Boot):**

| Layer | Component | Location |
|-------|-----------|----------|
| Domain | SpotStatus enum | `domain/enums/SpotStatus.java` |
| Domain | Spot entity (modified) | `domain/entity/Spot.java` |
| Domain | SpotRepository (modified) | `domain/repository/SpotRepository.java` |
| Application | SpotService (modified) | `service/SpotService.java` |
| Presentation | SpotController (modified) | `controller/SpotController.java` |
| DTO | SpotDetailResponse (modified) | `dto/response/SpotDetailResponse.java` |
| DTO | RejectSpotRequest (new) | `dto/request/RejectSpotRequest.java` |

**Front-end (Next.js):**

| Layer | Component | Location |
|-------|-----------|----------|
| Presentation | My Spots page | `src/app/my-spots/page.tsx` |
| Presentation | Edit page | `src/app/my-spots/[slug]/edit/page.tsx` |
| Presentation | SpotStatusBadge | `src/components/spot/SpotStatusBadge.tsx` |
| Presentation | MySpotCard | `src/components/spot/MySpotCard.tsx` |
| Presentation | MySpotsList | `src/components/spot/MySpotsList.tsx` |
| Application | useMySpotStore | `src/store/useMySpotStore.ts` |
| Domain | SpotStatus type | `src/types/index.ts` |
| Infrastructure | API calls | `src/lib/api.ts` |

**Admin (React + Vite):**

| Layer | Component | Location |
|-------|-----------|----------|
| Presentation | UserContentReview | `src/pages/UserContentReview.tsx` |
| Presentation | Layout (modified) | `src/components/Layout.tsx` |
| Infrastructure | spotAPI (modified) | `src/services/v2/spotAPI.ts` |
| Domain | SpotStatus type | `src/types/v2.ts` |

---

## 10. Coding Convention Reference

### 10.1 This Feature's Conventions

| Item | Convention |
|------|-----------|
| Component naming | PascalCase: `MySpotCard`, `SpotStatusBadge`, `UserContentReview` |
| File organization | front: `src/components/spot/`, `src/app/my-spots/`; admin: `src/pages/` |
| State management | Zustand store (`useMySpotStore`) following `useMySpotLinesStore` pattern |
| Status colors | amber=PENDING, emerald=APPROVED, red=REJECTED (Tailwind) |
| Korean labels | 검토 중 / 승인됨 / 반려됨 |
| API calls | front: axios via `lib/api.ts`; admin: axios via `services/v2/spotAPI.ts` |
| Pagination | front: infinite scroll or simple pagination; admin: DataTable with pagination |
| Form pattern | front: SpotCreateForm with mode prop; admin: React Query + invalidation |

---

## 11. Implementation Guide

### 11.1 Implementation Order

**Phase A — Backend (springboot-spotLine-backend)**

1. [ ] Create `SpotStatus.java` enum
2. [ ] Add status/rejectionReason/reviewedAt/reviewedBy fields to `Spot.java`
3. [ ] SQL migration: ALTER TABLE spots ADD COLUMN status + indexes
4. [ ] Add `RejectSpotRequest.java` DTO
5. [ ] Modify `SpotDetailResponse.java`: add status, rejectionReason, reviewedAt, reviewedBy
6. [ ] Modify `SpotRepository.java`: add findByStatus, findByCreatorIdAndStatus queries
7. [ ] Modify `SpotService.java`: status logic in create/update, approval methods, query filters
8. [ ] Modify `SpotController.java`: approve/reject endpoints, /my, /pending, status filtering

**Phase B — Front-end (front-spotLine)**

9. [ ] Add `SpotStatus` type to `types/index.ts`, update `SpotDetailResponse`
10. [ ] Add `updateSpot()`, `deleteSpot()` API functions to `lib/api.ts`
11. [ ] Create `SpotStatusBadge.tsx` component
12. [ ] Create `useMySpotStore.ts` Zustand store
13. [ ] Create `MySpotCard.tsx` component
14. [ ] Create `MySpotsList.tsx` component
15. [ ] Create `/my-spots/page.tsx` page
16. [ ] Modify `SpotCreateForm.tsx`: add edit mode (mode prop, initialData, update flow)
17. [ ] Create `/my-spots/[slug]/edit/page.tsx` edit page

**Phase C — Admin (admin-spotLine)**

18. [ ] Add `SpotStatus` enum to `types/v2.ts`
19. [ ] Add `approveSpot()`, `rejectSpot()`, `getPendingSpots()` to `spotAPI.ts`
20. [ ] Create `UserContentReview.tsx` page (following ModerationQueue pattern)
21. [ ] Modify `Layout.tsx`: add "유저 콘텐츠 검토" nav item with pending count badge

### 11.2 File Structure Summary

```
springboot-spotLine-backend/
├── domain/enums/SpotStatus.java              — NEW
├── domain/entity/Spot.java                   — MODIFY (+4 fields)
├── domain/repository/SpotRepository.java     — MODIFY (+queries)
├── controller/SpotController.java            — MODIFY (+4 endpoints)
├── service/SpotService.java                  — MODIFY (+approval logic)
├── dto/request/RejectSpotRequest.java        — NEW
└── dto/response/SpotDetailResponse.java      — MODIFY (+4 fields)

front-spotLine/
├── src/app/my-spots/page.tsx                 — NEW
├── src/app/my-spots/[slug]/edit/page.tsx     — NEW
├── src/components/spot/SpotStatusBadge.tsx    — NEW
├── src/components/spot/MySpotCard.tsx         — NEW
├── src/components/spot/MySpotsList.tsx        — NEW
├── src/store/useMySpotStore.ts               — NEW
├── src/types/index.ts                        — MODIFY
└── src/lib/api.ts                            — MODIFY

admin-spotLine/
├── src/pages/UserContentReview.tsx            — NEW
├── src/components/Layout.tsx                  — MODIFY
├── src/services/v2/spotAPI.ts                 — MODIFY
└── src/types/v2.ts                            — MODIFY
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-15 | Initial draft | Crew |
