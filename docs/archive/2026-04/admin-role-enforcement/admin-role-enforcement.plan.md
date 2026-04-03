# admin-role-enforcement Plan

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | 모든 인증된 사용자가 `super_admin` 역할로 하드코딩되어, 실제 역할 기반 접근 제어가 불가능하고 어드민 관리 페이지 외에는 권한 검증이 전혀 없음 |
| **Solution** | Supabase JWT의 실제 role claim 반영 + Frontend 라우트/사이드바 권한 기반 필터링 + Backend `hasRole` 분기 세분화 구현 |
| **Function/UX Effect** | 역할별 접근 가능 메뉴가 자동 필터링되고, 권한 없는 페이지 접근 시 명확한 안내 메시지 표시 |
| **Core Value** | 크루 확장 시 역할 분리(큐레이터 vs 관리자)가 가능해져 운영 안전성 확보 + 콘텐츠 품질 관리 체계 수립 |

---

## 1. 현황 분석

### 1.1 현재 구현 상태

**Frontend (admin-spotLine)**

| 항목 | 상태 | 위치 |
|------|------|------|
| AuthContext — `sessionToAdmin()` | 모든 유저를 `super_admin`으로 하드코딩 | `src/contexts/AuthContext.tsx:28` |
| ProtectedRoute | 인증 여부만 확인, 역할 무시 | `src/App.tsx:20-24` |
| 사이드바 Navigation | 전체 메뉴 무조건 노출 | `src/components/Layout.tsx:16-30` |
| Admins 페이지 | `super_admin` 역할 체크 (유일한 권한 검증) | `src/pages/Admins.tsx:186` |
| Admin 타입 | `role: "admin" \| "super_admin"` 정의됨 | `src/types/index.ts:194` |
| 로컬 로그인 fallback | `super_admin` 하드코딩 | `src/contexts/AuthContext.tsx:66-76` |

**Backend (springboot-spotLine-backend)**

| 항목 | 상태 | 위치 |
|------|------|------|
| SecurityConfig | `/api/v2/admin/**` → `hasRole("ADMIN")` 단일 규칙 | `SecurityConfig.java:41` |
| JwtAuthenticationFilter | JWT `role` claim → `ROLE_{ROLE}` 변환 정상 | `JwtAuthenticationFilter.java:47` |
| AuthUtil | `isAdmin()` — `ROLE_ADMIN`만 확인 | `AuthUtil.java:30-37` |

**Supabase JWT**
- Supabase Auth의 JWT에는 `role` claim이 포함됨 (기본값: `authenticated`)
- 커스텀 역할 설정은 Supabase Dashboard → Authentication → User Management에서 `app_metadata.role`로 가능
- 현재: 모든 사용자가 `role: "authenticated"`로 발급됨

### 1.2 핵심 문제

1. **Frontend 하드코딩**: `sessionToAdmin()`이 JWT의 실제 role을 무시하고 `super_admin` 반환
2. **권한 검증 부재**: 10개 라우트 중 1개만(`/admins`) 역할 검증
3. **사이드바 무필터**: 역할과 무관하게 모든 메뉴 노출
4. **Backend 단일 역할**: `ADMIN` 하나로만 분기, `SUPER_ADMIN`/`MODERATOR` 구분 없음
5. **로컬 로그인**: 개발 편의용이지만 항상 `super_admin` 부여

### 1.3 역할 정의 (확정)

| 역할 | 대상 | 접근 범위 |
|------|------|-----------|
| `super_admin` | 창업자/CTO | 전체 (어드민 관리, 파트너 관리, 시스템 설정 포함) |
| `admin` | 핵심 크루 | 큐레이션 + 파트너 관리 (어드민 계정 관리 제외) |
| `moderator` | 일반 크루 | 큐레이션만 (Spot 큐레이션, Spot 관리, Route 빌더/관리) |

---

## 2. 구현 범위

### 2.1 Frontend — AuthContext 역할 반영 (핵심)

**파일**: `src/contexts/AuthContext.tsx`

- `sessionToAdmin()`: Supabase JWT의 `app_metadata.role` 또는 `user_metadata.role`에서 실제 역할 추출
- fallback: role claim이 없으면 `moderator` (최소 권한 원칙)
- 로컬 로그인 모드: 환경변수 `VITE_ADMIN_ROLE`로 역할 설정 가능 (기본값: `super_admin`)

### 2.2 Frontend — 라우트 권한 가드

**파일**: `src/App.tsx`

- `ProtectedRoute`에 `requiredRole` prop 추가
- 역할 계층: `super_admin` > `admin` > `moderator`
- 상위 역할은 하위 역할의 모든 페이지 접근 가능

| 라우트 | 최소 역할 |
|--------|-----------|
| `/dashboard` | `moderator` |
| `/curation` | `moderator` |
| `/spots` | `moderator` |
| `/routes/new` | `moderator` |
| `/routes/:slug/edit` | `moderator` |
| `/routes` | `moderator` |
| `/partners` | `admin` |
| `/partners/new` | `admin` |
| `/partners/:id` | `admin` |
| `/admins` | `super_admin` |

### 2.3 Frontend — 사이드바 메뉴 필터링

**파일**: `src/components/Layout.tsx`

- `NavigationItem`에 `minRole` 필드 추가
- 현재 유저 역할에 따라 메뉴 항목 필터링
- 권한 없는 섹션은 사이드바에서 숨김

### 2.4 Frontend — 권한 부족 UI

- 직접 URL 접근 시 "권한이 없습니다" 메시지 + 대시보드 리다이렉트
- 기존 `Admins.tsx`의 패턴 재사용

### 2.5 Backend — 역할 세분화 (선택적)

**현재 상태**: `hasRole("ADMIN")`만 존재하며, Supabase JWT `role` claim은 보통 `authenticated`임.

**결정 필요**: Supabase `app_metadata.role`에 커스텀 역할을 설정하고 JWT에 포함시킬지 여부

- **Phase 1 (이번 scope)**: Frontend에서 역할 기반 UI 제어만 구현. Supabase `app_metadata`에 role 저장하고 Frontend에서 읽음.
- **Phase 2 (추후)**: Backend에서도 역할별 API 접근 제어 강화 (Spring Security 규칙 세분화)

> Backend API 레벨 역할 검증은 현재 크루 규모 (1~3명)에서는 과도하므로 Frontend 제어를 우선 적용.

---

## 3. 구현 순서

### Step 1: 역할 유틸리티 함수 생성
- `src/utils/roles.ts` 생성
- 역할 계층 정의 (`ROLE_HIERARCHY`)
- `hasMinRole(userRole, requiredRole)` 함수
- `getAccessibleRoutes(role)` 함수

### Step 2: AuthContext 수정
- `sessionToAdmin()` — JWT `app_metadata.role` 추출 로직
- 로컬 로그인 fallback 역할 처리

### Step 3: ProtectedRoute 확장
- `requiredRole` prop 추가
- 역할 부족 시 안내 컴포넌트 렌더링

### Step 4: 라우트 권한 매핑 적용
- `App.tsx` 각 라우트에 `requiredRole` 설정

### Step 5: 사이드바 필터링
- `Layout.tsx` navigation 배열에 `minRole` 추가
- 역할 기반 필터링 적용

### Step 6: Admins 페이지 정리
- 기존 인라인 역할 체크 제거 (ProtectedRoute로 대체)
- CreateAdminModal에 `moderator` 역할 옵션 추가

---

## 4. 영향 범위

### 수정 파일 (6개)

| 파일 | 변경 내용 |
|------|-----------|
| `src/utils/roles.ts` | **신규** — 역할 계층, 유틸 함수 |
| `src/contexts/AuthContext.tsx` | JWT 역할 추출 로직 변경 |
| `src/App.tsx` | ProtectedRoute에 requiredRole 추가 |
| `src/components/Layout.tsx` | 사이드바 메뉴 필터링 |
| `src/pages/Admins.tsx` | 인라인 역할 체크 제거, 역할 옵션 추가 |
| `src/types/index.ts` | Admin 타입에 `moderator` 역할 추가 |

### 미수정 (변경 불필요)

- Backend SecurityConfig — Frontend 제어 우선, 추후 Phase 2
- Supabase 설정 — Dashboard에서 수동으로 `app_metadata.role` 설정 (코드 외 작업)
- 기존 API 서비스 파일 — 변경 없음

---

## 5. 리스크 및 제약

| 리스크 | 대응 |
|--------|------|
| Supabase JWT에 `app_metadata.role`이 없는 기존 유저 | fallback으로 `moderator` 적용 |
| 로컬 개발 시 역할 테스트 어려움 | `VITE_ADMIN_ROLE` 환경변수로 역할 오버라이드 |
| Frontend-only 제어는 우회 가능 | 현재 크루 규모(1~3명)에서는 충분, Backend 강화는 Phase 2 |

---

## 6. 완료 기준

- [ ] `moderator` 역할 유저가 `/admins`, `/partners` 접근 시 차단됨
- [ ] `admin` 역할 유저가 `/admins` 접근 시 차단됨
- [ ] `super_admin`은 모든 페이지 접근 가능
- [ ] 사이드바에 역할에 맞는 메뉴만 표시됨
- [ ] 직접 URL 입력으로 권한 없는 페이지 접근 시 안내 메시지 표시
- [ ] 기존 기능 (로그인, 큐레이션, Route 관리) 동작에 영향 없음
