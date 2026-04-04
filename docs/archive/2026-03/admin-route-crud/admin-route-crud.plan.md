# admin-route-crud Plan

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | Route 생성만 가능하고 수정/삭제/상세보기가 불가하여 크루가 오류를 수정하거나 콘텐츠를 관리할 수 없음 |
| **Solution** | Backend에 PUT/DELETE API 추가 + Admin에 Route 상세 모달, 수정 페이지, 삭제 기능 구현 |
| **Function/UX Effect** | Route 목록에서 상세 확인, 인라인 수정, 확인 후 삭제가 가능하여 크루 운영 효율 향상 |
| **Core Value** | 콘텐츠 품질 관리를 위한 완전한 CRUD 사이클 확보, 런칭 전 Route 큐레이션 워크플로우 완성 |

---

## 1. 현황 분석

### 1.1 현재 구현 상태

**Backend (springboot-spotLine-backend)**
- `POST /api/v2/routes` — Route 생성 ✅
- `GET /api/v2/routes/{slug}` — Route 상세 조회 ✅
- `GET /api/v2/routes/popular` — Route 목록 (필터+페이징) ✅
- `PUT /api/v2/routes/{slug}` — **미구현**
- `DELETE /api/v2/routes/{slug}` — **미구현**
- `UpdateRouteRequest` DTO — **미구현**

**Admin (admin-spotLine)**
- RouteBuilder.tsx — Route 생성 ✅
- RouteManagement.tsx — Route 목록 ✅ (상세보기 버튼은 빈 핸들러)
- Route 상세 보기 — **미구현**
- Route 수정 페이지 — **미구현**
- Route 삭제 — **미구현**
- routeAPI.ts — `getPopular`, `getBySlug`, `create`만 존재

### 1.2 참조 패턴 (Spot CRUD — 이미 완성됨)

Backend:
- `UpdateSpotRequest.java` — 모든 필드 optional (partial update)
- `SpotController.update()` — `PUT /api/v2/spots/{slug}`
- `SpotController.delete()` — `DELETE /api/v2/spots/{slug}` (soft delete)

Admin:
- SpotManagement.tsx — 목록 + SpotEditModal 연동
- SpotEditModal.tsx — slug 기반 조회 → form → update API 호출

---

## 2. 구현 범위

### 2.1 Backend API (springboot-spotLine-backend)

| # | 항목 | 설명 |
|---|------|------|
| B-1 | `UpdateRouteRequest.java` | title, description, theme, area, spots 모두 optional |
| B-2 | `RouteController.update()` | `PUT /api/v2/routes/{slug}` |
| B-3 | `RouteController.delete()` | `DELETE /api/v2/routes/{slug}` (soft delete) |
| B-4 | `RouteService.update()` | slug 조회 → 필드 업데이트 → spots 재구성 → 저장 |
| B-5 | `RouteService.delete()` | isActive=false (soft delete) |

### 2.2 Admin Frontend (admin-spotLine)

| # | 항목 | 설명 |
|---|------|------|
| A-1 | `routeAPI.ts` 확장 | `update(slug, data)`, `delete(slug)` 추가 |
| A-2 | `RouteDetailModal.tsx` | 목록에서 클릭 시 Route 상세 정보 표시 모달 |
| A-3 | `RouteEditPage.tsx` | Route 수정 페이지 (RouteBuilder 재활용, 기존 데이터 로드) |
| A-4 | RouteManagement.tsx 수정 | 상세보기/수정/삭제 액션 버튼 연결 |
| A-5 | App.tsx 라우트 추가 | `/routes/:slug/edit` 경로 추가 |

### 2.3 범위 외 (Out of Scope)

- Route 일괄 삭제 (단건 삭제만)
- Route 복제 기능 (front-spotLine에서 처리)
- Route 공개/비공개 토글

---

## 3. 구현 순서

```
B-1 UpdateRouteRequest DTO
  ↓
B-4,B-5 RouteService.update() + delete()
  ↓
B-2,B-3 RouteController endpoints
  ↓
A-1 routeAPI.ts 확장
  ↓
A-2 RouteDetailModal (목록에서 상세 보기)
  ↓
A-3 RouteEditPage (수정 UI)
  ↓
A-4 RouteManagement 액션 연결
  ↓
A-5 App.tsx 라우트 추가
```

---

## 4. 핵심 설계 결정

### 4.1 Update 전략: Spots 교체 방식
- Route의 spots 변경 시 기존 SpotLineSpot을 전부 삭제 후 새로 생성 (replace all)
- 이유: SpotLineSpot 순서/메타 변경이 빈번하므로 patch보다 replace가 단순하고 안전

### 4.2 Delete 전략: Soft Delete
- `isActive = false` 설정 (Spot과 동일 패턴)
- 연관 SpotLineSpot은 삭제하지 않음 (Route 복구 가능성)

### 4.3 수정 UI: 별도 페이지 (RouteBuilder 재활용)
- RouteBuilder에 "edit mode" 플래그 추가
- slug param으로 기존 데이터 로드 → form 초기값 설정
- 저장 시 PUT 호출 (create 대신)

---

## 5. 영향 범위

| 레포 | 파일 | 변경 유형 |
|------|------|----------|
| springboot-backend | `UpdateRouteRequest.java` | 신규 |
| springboot-backend | `RouteController.java` | 수정 (PUT, DELETE 추가) |
| springboot-backend | `RouteService.java` | 수정 (update, delete 메서드) |
| admin-spotLine | `routeAPI.ts` | 수정 (update, delete 추가) |
| admin-spotLine | `RouteDetailModal.tsx` | 신규 |
| admin-spotLine | `RouteEditPage.tsx` 또는 `RouteBuilder.tsx` | 수정 (edit mode) |
| admin-spotLine | `RouteManagement.tsx` | 수정 (액션 버튼) |
| admin-spotLine | `App.tsx` | 수정 (라우트 추가) |
| admin-spotLine | `types/v2.ts` | 수정 (UpdateRouteRequest 타입) |
