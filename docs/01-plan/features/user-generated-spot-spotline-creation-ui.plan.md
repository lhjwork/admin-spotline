# User-Generated Spot & SpotLine Creation UI Planning Document

> **Summary**: Enhance user-generated content workflow with approval system, My Spots management, and edit capabilities
>
> **Project**: Spotline — Experience Based Social Platform
> **Author**: Crew
> **Date**: 2026-04-15
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | User-created Spots go live immediately without quality review; users cannot manage or edit their submissions; no "My Spots" page exists |
| **Solution** | Add SpotStatus approval workflow (PENDING→APPROVED→REJECTED), My Spots management page, Spot edit UI, and admin user-content review dashboard |
| **Function/UX Effect** | Users get full CRUD lifecycle for their Spots with status visibility; admins can review and approve user content before public display; content quality improves |
| **Core Value** | Content quality control enables trust and scalability as user-generated content grows beyond crew curation |

---

## 1. Overview

### 1.1 Purpose

Enable a complete user-generated content lifecycle: create → review → approve/reject → edit → manage. Currently, SpotCreateForm and SpotLineBuilder exist but lack approval workflow, edit capabilities, and user content management.

### 1.2 Background

- **Existing creation UI**: `SpotCreateForm.tsx` (199 lines, fully functional) and `SpotLineBuilder.tsx` (225 lines, create/fork/edit modes) are already implemented in front-spotLine
- **Existing backend**: Spot/SpotLine CRUD APIs exist (72 endpoints in Spring Boot backend)
- **Gap — No approval workflow**: User Spots with `source: "USER"` go live immediately without review
- **Gap — No My Spots page**: `my-spotlines/page.tsx` exists but no equivalent for Spots
- **Gap — No Spot edit UI**: SpotLineBuilder supports edit mode but SpotCreateForm does not
- **Gap — No admin review dashboard**: Admin has SpotCuration and Moderation but no dedicated user-content approval view
- **Cold Start context**: Platform is in content-first phase (targeting 200-300 Spots). User-generated content needs quality gates to maintain curation standards

### 1.3 Related Documents

- `front-spotLine/docs/01-plan/features/experience-social-platform.plan.md` — Overall platform plan
- `front-spotLine/CLAUDE.md` — Front-end architecture and conventions
- `springboot-spotLine-backend/CLAUDE.md` — Backend architecture

---

## 2. Scope

### 2.1 In Scope

- [ ] **Backend — SpotStatus enum & approval workflow**: Add `PENDING`/`APPROVED`/`REJECTED` status to Spot entity; user-created Spots default to `PENDING`
- [ ] **Backend — Approval API endpoints**: `PUT /api/v2/spots/{id}/approve`, `PUT /api/v2/spots/{id}/reject` (admin-only)
- [ ] **Backend — My Spots API**: `GET /api/v2/spots/my` with status filtering
- [ ] **Backend — Spot update API enhancement**: Ensure `PUT /api/v2/spots/{id}` supports user editing of own Spots (only while PENDING or REJECTED)
- [ ] **Front — My Spots page** (`/my-spots`): List user's created Spots with status badges (PENDING/APPROVED/REJECTED), edit/delete actions
- [ ] **Front — Spot edit mode**: Extend SpotCreateForm to support edit mode (pre-fill existing data, submit update)
- [ ] **Front — Status indicators**: Show approval status on user's own Spot cards and detail pages
- [ ] **Admin — User Content Review page**: Filterable list of PENDING user Spots with approve/reject actions and preview

### 2.2 Out of Scope

- SpotLine approval workflow (SpotLines already reference approved Spots — separate feature if needed)
- User notifications on approval/rejection (future `notification-inbox` integration)
- Batch approval in admin (can be added later)
- Photo moderation / AI content filtering
- User reputation/trust scoring

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | SpotStatus enum (`PENDING`, `APPROVED`, `REJECTED`) added to Spot entity | High | Pending |
| FR-02 | User-created Spots (`source=USER`) default to `PENDING` status | High | Pending |
| FR-03 | Crew-created Spots (`source=CREW`) default to `APPROVED` status | High | Pending |
| FR-04 | Admin approve/reject API endpoints with optional rejection reason | High | Pending |
| FR-05 | My Spots page showing user's Spots with status filter tabs | High | Pending |
| FR-06 | Spot edit form (reuse SpotCreateForm in edit mode) | Medium | Pending |
| FR-07 | Users can edit own Spots only when PENDING or REJECTED | Medium | Pending |
| FR-08 | Admin User Content Review page with PENDING filter default | High | Pending |
| FR-09 | Public Spot listings/search only show APPROVED Spots | High | Pending |
| FR-10 | Spot detail page accessible for APPROVED or own Spots only | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | My Spots page loads < 500ms | Browser DevTools |
| Performance | Admin review list paginates (20 per page) | API response check |
| UX | Status badges use consistent color coding (Yellow=PENDING, Green=APPROVED, Red=REJECTED) | Visual review |
| Security | Only admins can approve/reject; only owners can edit own Spots | API authorization check |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] SpotStatus enum and DB migration applied
- [ ] Approval API endpoints working (approve/reject)
- [ ] My Spots page renders with correct status filtering
- [ ] Spot edit mode works (pre-fill, update, re-submit)
- [ ] Admin review page lists PENDING Spots with approve/reject
- [ ] Public listings filter to APPROVED only
- [ ] Build succeeds in all 3 repos

### 4.2 Quality Criteria

- [ ] Zero lint errors
- [ ] All builds succeed
- [ ] Mobile-responsive (My Spots, admin review)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Existing user Spots have no status field | High | High | DB migration sets all existing Spots to APPROVED |
| SpotLine references non-approved Spots | Medium | Low | SpotLines only reference Spots via search which already returns APPROVED; add validation |
| Review backlog as user content grows | Medium | Medium | Admin dashboard with sort-by-date, pending count badge |
| User confusion about PENDING status | Medium | Medium | Clear status UI with Korean labels ("검토 중", "승인됨", "반려됨") |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS | Web apps with backend | ☐ |
| **Enterprise** | Strict layer separation, microservices | High-traffic systems | ☒ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js 16 (front) / React (admin) / Spring Boot (backend) | All three | Existing architecture |
| State Management | Zustand | Zustand | Existing pattern in front-spotLine |
| Spot Edit Approach | New form vs. reuse SpotCreateForm | Reuse with `mode` prop | DRY principle, consistent UX |
| Admin Review UI | New page vs. extend existing Moderation | New dedicated page | Different workflow from content reports |
| Status Storage | Enum column on Spot table | Enum column | Simple, queryable, standard pattern |

### 6.3 Implementation Across Repos

```
springboot-spotLine-backend/
├── domain/enums/SpotStatus.java          — NEW: PENDING, APPROVED, REJECTED
├── domain/entity/Spot.java               — MODIFY: add status field + rejectionReason
├── domain/repository/SpotRepository.java — MODIFY: findByStatus, findByCreatorAndStatus
├── controller/SpotController.java        — MODIFY: approve/reject endpoints, my-spots
├── service/SpotService.java              — MODIFY: approval logic, status filtering
└── dto/response/SpotResponse.java        — MODIFY: include status field

front-spotLine/
├── src/app/my-spots/page.tsx             — NEW: My Spots management page
├── src/components/spot/SpotCreateForm.tsx — MODIFY: add edit mode support
├── src/components/spot/SpotStatusBadge.tsx — NEW: status badge component
├── src/store/useMySpotStore.ts           — NEW: My Spots store
└── src/types/index.ts                    — MODIFY: add SpotStatus type

admin-spotLine/
├── src/pages/UserContentReview.tsx        — NEW: PENDING Spots review page
├── src/components/Layout.tsx              — MODIFY: add navigation item
└── src/services/api.ts                    — MODIFY: approve/reject API calls
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section (all 3 repos)
- [x] ESLint configuration
- [x] TypeScript configuration (`tsconfig.json`)
- [x] Tailwind CSS 4 with `cn()` utility

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | Exists | SpotStatus enum values (PENDING/APPROVED/REJECTED) | High |
| **Folder structure** | Exists | My Spots page at `/my-spots` | Medium |
| **Status colors** | Partial | Yellow=PENDING, Green=APPROVED, Red=REJECTED | Medium |
| **Korean labels** | Exists | "검토 중"/"승인됨"/"반려됨" for status display | Medium |

### 7.3 Environment Variables Needed

No new environment variables required. Uses existing `NEXT_PUBLIC_API_BASE_URL`.

---

## 8. Next Steps

1. [ ] Write design document (`user-generated-spot-spotline-creation-ui.design.md`)
2. [ ] Implement backend changes first (SpotStatus enum, migration, API endpoints)
3. [ ] Implement front-spotLine changes (My Spots, edit mode, status badges)
4. [ ] Implement admin-spotLine changes (User Content Review page)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-15 | Initial draft | Crew |
