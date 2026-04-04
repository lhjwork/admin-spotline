# admin-route-crud Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: Spotline Admin
> **Analyst**: gap-detector
> **Date**: 2026-03-31
> **Design Doc**: [admin-route-crud.design.md](../02-design/features/admin-route-crud.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Design Section 3 체크리스트(10개 항목) 기준으로 실제 구현 코드와의 일치율을 산출한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/admin-route-crud.design.md`
- **Backend Implementation**: `springboot-spotLine-backend/src/main/java/com/spotline/api/`
- **Admin Frontend Implementation**: `admin-spotLine/src/`
- **Analysis Date**: 2026-03-31

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 Implementation Checklist Verification (Section 3)

| # | Task | Design | Implementation | Status | Notes |
|---|------|--------|----------------|:------:|-------|
| 1 | UpdateRouteRequest DTO | 5 optional fields, `@Data` | Exact match: 5 fields, `@Data`, same comment | ✅ Match | |
| 2 | RouteService.update() | Partial update + spots clear/rebuild + totalDuration/Distance recalc | Exact match: null-check per field, spots.clear(), loop with totalDuration/totalDistance | ✅ Match | |
| 3 | RouteService.delete() | Soft delete via `setIsActive(false)` | Exact match | ✅ Match | |
| 4 | RouteController PUT/DELETE | `@PutMapping("/{slug}")` + `@DeleteMapping("/{slug}")`, `@Valid` | Exact match: both endpoints with `@Valid`, correct ResponseEntity types | ✅ Match | |
| 5 | UpdateRouteRequest type (TS) | 5 optional fields, `spots?: SpotLineSpotRequest[]` | Exact match | ✅ Match | |
| 6 | routeAPI update/delete | `apiClient.put` + `apiClient.delete` on `/api/v2/routes/${slug}` | Exact match | ✅ Match | |
| 7 | RouteDetailModal | Modal with detail view, "수정하기"/"삭제" buttons, spot list, stats | Implemented with all designed elements: header, spots list with order/duration/distance, stats grid, edit/delete footer | ✅ Match | |
| 8 | RouteBuilder edit mode | `useParams` slug, `isEditMode`, data load via `useQuery`, form `reset`, `toSpotDetail` mapping, conditional mutation | All 6 sub-items implemented: slug param, isEditMode flag, useQuery load, useEffect reset, SpotLineSpotDetail mapping, conditional create/update mutation | ✅ Match | |
| 9 | RouteManagement actions | Eye/Pencil/Trash2 buttons, `handleDelete` with `window.confirm`, `setDetailSlug`, navigate to edit | Exact match: 3 action buttons, confirm dialog, queryClient invalidation, modal integration | ✅ Match | |
| 10 | App.tsx route | `routes/:slug/edit` -> `RouteBuilder` | `<Route path="routes/:slug/edit" element={<RouteBuilder />} />` | ✅ Match | |

### 2.2 API Endpoints

| Design | Implementation | Status |
|--------|---------------|:------:|
| `PUT /api/v2/routes/{slug}` -> `ResponseEntity<RouteDetailResponse>` | `@PutMapping("/{slug}")` returns `ResponseEntity.ok(routeService.update(...))` | ✅ |
| `DELETE /api/v2/routes/{slug}` -> `ResponseEntity<Void>` 204 | `@DeleteMapping("/{slug}")` returns `ResponseEntity.noContent().build()` | ✅ |

### 2.3 Data Model (UpdateRouteRequest)

| Field | Design Type | Backend Impl | Frontend Impl | Status |
|-------|-------------|-------------|---------------|:------:|
| title | String (optional) | `private String title` | `title?: string` | ✅ |
| description | String (optional) | `private String description` | `description?: string` | ✅ |
| theme | RouteTheme (optional) | `private RouteTheme theme` | `theme?: RouteTheme` | ✅ |
| area | String (optional) | `private String area` | `area?: string` | ✅ |
| spots | List\<SpotLineSpotRequest\> (optional) | `private List<CreateRouteRequest.SpotLineSpotRequest> spots` | `spots?: SpotLineSpotRequest[]` | ✅ |

### 2.4 Component Structure

| Design Component | Implementation File | Status |
|------------------|---------------------|:------:|
| RouteDetailModal | `src/components/curation/RouteDetailModal.tsx` | ✅ |
| RouteBuilder (edit mode) | `src/pages/RouteBuilder.tsx` | ✅ |
| RouteManagement (actions) | `src/pages/RouteManagement.tsx` | ✅ |

### 2.5 Detailed Behavior Verification

#### RouteDetailModal

| Design Spec | Implementation | Status |
|-------------|---------------|:------:|
| routeAPI.getBySlug() 호출 | `useQuery(["route", slug], () => routeAPI.getBySlug(slug))` | ✅ |
| 제목, 테마, 지역, 설명 표시 | All rendered in modal body | ✅ |
| Spot 목록 순서대로 표시 | `route.spots.map()` with order badge | ✅ |
| 체류시간/도보시간/거리 표시 | stayDuration, walkingTimeToNext, distanceToNext rendered | ✅ |
| 총 거리/시간 표시 | Stats grid with totalDistance (km/m auto), totalDuration | ✅ |
| 생성자 표시 | `route.creatorName` rendered | ✅ |
| "수정" -> RouteEditPage 이동 | `onEdit(slug)` callback | ✅ |
| "삭제" 확인 다이얼로그 | `onDelete(slug)` callback (confirm in parent) | ✅ |
| 좋아요/저장/복제 수 표시 | likesCount only; **savesCount, replicationsCount missing** | ⚠️ Minor |

#### RouteBuilder Edit Mode

| Design Spec | Implementation | Status |
|-------------|---------------|:------:|
| useParams slug | `const { slug } = useParams<{ slug?: string }>()` | ✅ |
| isEditMode = !!slug | `const isEditMode = !!slug` | ✅ |
| useQuery for existing route | `useQuery(["route", slug], ..., { enabled: isEditMode })` | ✅ |
| form reset with existing data | `reset({ title, description, theme, area })` in useEffect | ✅ |
| setItems with toSpotDetail mapping | `toSpotDetail()` function + setItems in useEffect | ✅ |
| Conditional mutation (update vs create) | Separate `createMutation` / `updateMutation`, selected by `isEditMode` | ✅ |
| Page title: "Route 수정" / "Route 빌더" | `{isEditMode ? "Route 수정" : "Route 빌더"}` | ✅ |
| Button text: "Route 수정" / "Route 생성" | `{isEditMode ? "Route 수정" : "Route 생성"}` | ✅ |
| Navigate to /routes on success | `navigate("/routes")` in onSuccess | ✅ |

#### SpotLineSpotDetail -> SpotDetailResponse Mapping (Section 4)

| Design Spec | Implementation | Status |
|-------------|---------------|:------:|
| Minimal mapping function | `toSpotDetail(rs: SpotLineSpotDetail): SpotDetailResponse` | ✅ |
| id = spotId | `id: rs.spotId` | ✅ |
| slug = spotSlug | `slug: rs.spotSlug` | ✅ |
| title = spotTitle | `title: rs.spotTitle` | ✅ |
| category = spotCategory | `category: rs.spotCategory as SpotDetailResponse["category"]` | ✅ |
| area = spotArea | `area: rs.spotArea` | ✅ |
| Extra fields (address, lat, lng, crewNote, media) | Mapped from SpotLineSpotDetail extended fields | ✅ Better |

### 2.6 Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 98%                     |
+---------------------------------------------+
|  Total Checklist Items:   10                 |
|  Exact Match:             10 items (100%)    |
|  Behavioral Sub-items:    35 checked         |
|    Match:                 34 items (97%)     |
|    Minor deviation:        1 item  (3%)      |
|  Not Implemented:          0 items           |
+---------------------------------------------+
```

---

## 3. Differences Found

### 3.1 Missing Features (Design O, Implementation X)

None.

### 3.2 Added Features (Design X, Implementation O)

| Item | Implementation Location | Description | Impact |
|------|------------------------|-------------|--------|
| Extended toSpotDetail mapping | `RouteBuilder.tsx:28-60` | Design shows `...` for remaining fields; impl provides full default values including address, lat, lng, crewNote, media | Low (Positive) |
| `initialized` state guard | `RouteBuilder.tsx:67,84,106` | Prevents re-initialization on re-render; not in design | Low (Positive) |
| queryClient.invalidateQueries(["route", slug]) | `RouteBuilder.tsx:133` | Edit mutation also invalidates individual route cache; design only shows `["routes"]` | Low (Positive) |
| setDetailSlug(null) on delete | `RouteManagement.tsx:39` | Closes modal after delete; not explicitly in design | Low (Positive) |

### 3.3 Changed Features (Design != Implementation)

| Item | Design | Implementation | Impact |
|------|--------|----------------|--------|
| RouteDetailModal stats | Shows 좋아요, 저장, 복제 (3 stats) | Shows only 좋아요 (likesCount); savesCount and replicationsCount omitted from stats grid | Low |
| Mutation structure | Single conditional `mutation` | Two separate mutations (`createMutation`, `updateMutation`) with `mutation` as alias | None (equivalent behavior) |

---

## 4. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 98% | ✅ |
| Architecture Compliance | 100% | ✅ |
| Convention Compliance | 95% | ✅ |
| **Overall** | **98%** | ✅ |

---

## 5. Architecture Compliance

### 5.1 Backend (Spring Boot)

| Layer | Design | Implementation | Status |
|-------|--------|----------------|:------:|
| Controller | RouteController | `controller/RouteController.java` | ✅ |
| Service | RouteService | `service/RouteService.java` | ✅ |
| DTO | UpdateRouteRequest | `dto/request/UpdateRouteRequest.java` | ✅ |
| Flow | Controller -> Service -> Repository | Maintained | ✅ |

### 5.2 Frontend (Admin)

| Layer | Design | Implementation | Status |
|-------|--------|----------------|:------:|
| Types (Domain) | `types/v2.ts` | `src/types/v2.ts` | ✅ |
| API Service (Infrastructure) | `services/v2/routeAPI.ts` | `src/services/v2/routeAPI.ts` | ✅ |
| Component (Presentation) | `RouteDetailModal.tsx` | `src/components/curation/RouteDetailModal.tsx` | ✅ |
| Pages (Presentation) | `RouteBuilder.tsx`, `RouteManagement.tsx` | `src/pages/` | ✅ |
| Dependency direction | Pages -> Services -> API Client | Maintained; no violations | ✅ |

---

## 6. Convention Compliance

### 6.1 Naming Convention

| Category | Convention | Compliance | Violations |
|----------|-----------|:----------:|------------|
| Components | PascalCase | 100% | - |
| Functions | camelCase | 100% | - |
| Files (component) | PascalCase.tsx | 100% | - |
| Files (utility) | camelCase.ts | 100% | - |
| Types/Interfaces | PascalCase | 100% | - |

### 6.2 Import Order

All files follow: external libs -> internal absolute (`../`) -> relative (`./`) -> types.

Minor note: `RouteBuilder.tsx` mixes type imports with value imports on the same line (`import type { ... } from "../types/v2"` is separate, which is correct).

### 6.3 Convention Score: 95%

Deduction: RouteDetailModal uses `as RouteTheme` type assertion for `route.theme` (line 46), which could be avoided with stricter typing.

---

## 7. Recommended Actions

### 7.1 Optional Improvements (Low Priority)

| # | Item | File | Description |
|---|------|------|-------------|
| 1 | Add savesCount/replicationsCount to modal | `RouteDetailModal.tsx:97-121` | Design wireframe shows 좋아요/저장/복제 but impl shows only 좋아요 |
| 2 | Update design to reflect `initialized` guard | `admin-route-crud.design.md` Section 2.4 | Implementation adds useful re-render protection not in design |

### 7.2 Design Document Updates Needed

- [ ] Section 2.3 wireframe shows 3 stats (좋아요/저장/복제) -- either add to impl or update design to match
- [ ] Section 2.4 could document the `initialized` state guard pattern
- [ ] Section 2.4 could document separate create/update mutations (cleaner than single conditional)

---

## 8. Conclusion

Match Rate **98%** -- design and implementation align well. All 10 checklist items are fully implemented. The single minor deviation (missing savesCount/replicationsCount in the modal stats) is cosmetic and does not affect functionality. The implementation actually exceeds the design in several areas (better type mapping, cache invalidation, re-render guards).

**Recommendation**: Mark this feature as Check-complete and proceed to Report phase.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-31 | Initial gap analysis | gap-detector |
