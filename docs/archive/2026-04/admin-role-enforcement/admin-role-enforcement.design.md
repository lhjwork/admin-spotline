# admin-role-enforcement Design

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | 모든 인증된 사용자가 `super_admin` 역할로 하드코딩되어, 실제 역할 기반 접근 제어가 불가능 |
| **Solution** | 역할 유틸리티 + AuthContext JWT 반영 + ProtectedRoute 가드 + 사이드바 필터링 |
| **Function/UX Effect** | 역할별 메뉴 자동 필터링, 권한 없는 페이지 접근 시 안내 + 리다이렉트 |
| **Core Value** | 크루 확장 대비 역할 분리 체계 확보, 운영 안전성 강화 |

---

## 1. 역할 체계 설계

### 1.1 역할 정의

```typescript
type AdminRole = "super_admin" | "admin" | "moderator";
```

### 1.2 역할 계층 (숫자가 클수록 높은 권한)

```
moderator (1) → admin (2) → super_admin (3)
```

상위 역할은 하위 역할의 모든 권한을 자동 상속한다.

### 1.3 역할-라우트 매핑

| 라우트 | 최소 역할 | 설명 |
|--------|-----------|------|
| `/dashboard` | `moderator` | 대시보드 (모든 역할 접근) |
| `/curation` | `moderator` | Spot 큐레이션 |
| `/spots` | `moderator` | Spot 관리 |
| `/routes/new` | `moderator` | Route 빌더 |
| `/routes/:slug/edit` | `moderator` | Route 수정 |
| `/routes` | `moderator` | Route 관리 |
| `/partners` | `admin` | 파트너 관리 |
| `/partners/new` | `admin` | 파트너 등록 |
| `/partners/:id` | `admin` | 파트너 상세 |
| `/admins` | `super_admin` | 어드민 관리 |

### 1.4 역할-사이드바 매핑

| 사이드바 섹션 | 최소 역할 |
|---------------|-----------|
| 대시보드 | `moderator` |
| 큐레이션 (Spot 큐레이션, Spot 관리, Route 빌더, Route 관리) | `moderator` |
| 파트너 (파트너 관리) | `admin` |
| 시스템 (어드민 관리) | `super_admin` |

---

## 2. 파일별 상세 설계

### 2.1 `src/types/index.ts` — 타입 확장

**변경**: Admin 인터페이스의 `role` 타입에 `moderator` 추가

```typescript
// Before
export interface Admin {
  role: "admin" | "super_admin";
}

// After
export interface Admin {
  role: "admin" | "super_admin" | "moderator";
}
```

별도 `AdminRole` 타입 export:

```typescript
export type AdminRole = "super_admin" | "admin" | "moderator";
```

---

### 2.2 `src/utils/roles.ts` — 신규 파일

역할 관련 상수와 유틸리티 함수를 한 곳에 집중.

```typescript
import type { AdminRole } from "../types";

// 역할 계층 (숫자가 클수록 높은 권한)
const ROLE_LEVEL: Record<AdminRole, number> = {
  moderator: 1,
  admin: 2,
  super_admin: 3,
};

/**
 * userRole이 requiredRole 이상의 권한을 가지는지 확인
 */
export function hasMinRole(userRole: AdminRole, requiredRole: AdminRole): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}

/**
 * 역할 한글 라벨
 */
export function getRoleLabel(role: AdminRole): string {
  const labels: Record<AdminRole, string> = {
    super_admin: "슈퍼 관리자",
    admin: "관리자",
    moderator: "모더레이터",
  };
  return labels[role] ?? role;
}
```

**설계 결정**:
- `getAccessibleRoutes()`는 불필요 → 각 라우트/메뉴 아이템에 `minRole`을 직접 지정하는 것이 더 명확하고 유지보수 쉬움
- `ROLE_LEVEL` 상수는 export하지 않음 → `hasMinRole()` 함수만 외부 인터페이스로 노출

---

### 2.3 `src/contexts/AuthContext.tsx` — 역할 추출 로직

**`sessionToAdmin()` 변경**:

```typescript
function sessionToAdmin(session: Session): Admin {
  const user = session.user;

  // Supabase app_metadata.role 우선, 없으면 user_metadata.role
  const role = (user.app_metadata?.role ?? user.user_metadata?.role ?? "moderator") as AdminRole;

  // 유효한 역할인지 검증
  const validRoles: AdminRole[] = ["super_admin", "admin", "moderator"];
  const safeRole = validRoles.includes(role) ? role : "moderator";

  return {
    id: user.id,
    username: user.email?.split("@")[0] ?? "admin",
    email: user.email ?? "",
    role: safeRole,
    isActive: true,
  };
}
```

**로컬 로그인 fallback 변경**:

```typescript
// login() 함수 내 로컬 로그인 블록
const localRole = (import.meta.env["VITE_ADMIN_ROLE"] ?? "super_admin") as AdminRole;

const localAdmin: Admin = {
  id: "local-admin",
  username: localUsername,
  email: `${localUsername}@local`,
  role: localRole,  // 환경변수로 제어 가능
  isActive: true,
};
```

**설계 결정**:
- `app_metadata.role` 우선: Supabase Admin API로 설정하는 값이므로 사용자가 변조 불가
- `user_metadata.role` fallback: 초기 세팅 편의를 위해 허용하되, 운영 시 `app_metadata`로 마이그레이션
- 유효하지 않은 role 값 → `moderator`로 강제 (최소 권한 원칙)
- 로컬 로그인은 기본 `super_admin` 유지 (개발 편의) — `VITE_ADMIN_ROLE`로 테스트 가능

---

### 2.4 `src/App.tsx` — ProtectedRoute 확장

**ProtectedRoute 변경**:

```typescript
import type { AdminRole } from "./types";
import { hasMinRole } from "./utils/roles";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AdminRole;  // 없으면 인증만 확인
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading, admin } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" />;

  if (requiredRole && admin && !hasMinRole(admin.role, requiredRole)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
```

**AccessDenied 컴포넌트** (같은 파일 내 정의):

```typescript
function AccessDenied() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-6 py-4 rounded-lg text-center">
        <h3 className="font-semibold mb-1">접근 권한이 없습니다</h3>
        <p className="text-sm">이 페이지를 보려면 상위 권한이 필요합니다.</p>
      </div>
    </div>
  );
}
```

**라우트 적용**:

```tsx
<Route path="/" element={
  <ProtectedRoute><Layout /></ProtectedRoute>
}>
  <Route index element={<Navigate to="/dashboard" />} />
  <Route path="dashboard" element={<Dashboard />} />
  {/* 큐레이션 — moderator 이상 (기본값이므로 requiredRole 생략) */}
  <Route path="curation" element={<SpotCuration />} />
  <Route path="spots" element={<SpotManagement />} />
  <Route path="routes/new" element={<RouteBuilder />} />
  <Route path="routes/:slug/edit" element={<RouteBuilder />} />
  <Route path="routes" element={<RouteManagement />} />
  {/* 파트너 — admin 이상 */}
  <Route path="partners" element={
    <ProtectedRoute requiredRole="admin"><PartnerManagement /></ProtectedRoute>
  } />
  <Route path="partners/new" element={
    <ProtectedRoute requiredRole="admin"><PartnerRegistration /></ProtectedRoute>
  } />
  <Route path="partners/:id" element={
    <ProtectedRoute requiredRole="admin"><PartnerDetail /></ProtectedRoute>
  } />
  {/* 시스템 — super_admin만 */}
  <Route path="admins" element={
    <ProtectedRoute requiredRole="super_admin"><Admins /></ProtectedRoute>
  } />
</Route>
```

**설계 결정**:
- 최상위 `<ProtectedRoute>`에서 인증 체크, 개별 라우트의 중첩 `<ProtectedRoute>`에서 역할 체크
- `moderator`가 기본 최소 역할이므로 큐레이션 라우트에는 `requiredRole` 생략 (모든 인증된 유저 접근 가능)
- `AccessDenied`는 Layout 내부에 렌더링되므로 사이드바/헤더는 유지됨 (로그인 페이지로 튕기지 않음)

---

### 2.5 `src/components/Layout.tsx` — 사이드바 필터링

**NavigationItem 타입 확장**:

```typescript
interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  section?: string;
  minRole?: AdminRole;  // 추가: 없으면 moderator (모든 역할 접근)
}
```

**navigation 배열 변경**:

```typescript
const navigation: NavigationItem[] = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },

  // 큐레이션 섹션 — moderator 이상 (minRole 생략 = 기본)
  { name: "Spot 큐레이션", href: "/curation", icon: Search, section: "curation" },
  { name: "Spot 관리", href: "/spots", icon: MapPin, section: "curation" },
  { name: "Route 빌더", href: "/routes/new", icon: Route, section: "curation" },
  { name: "Route 관리", href: "/routes", icon: List, section: "curation" },

  // 파트너 섹션 — admin 이상
  { name: "파트너 관리", href: "/partners", icon: Store, section: "partner", minRole: "admin" },

  // 시스템 섹션 — super_admin만
  { name: "어드민 관리", href: "/admins", icon: Users, section: "system", minRole: "super_admin" },
];
```

**NavSection 필터링 로직**:

```typescript
function NavSection({ title, section, onClick }: { title: string; section: string; onClick?: () => void }) {
  const { admin } = useAuth();
  const items = navigation.filter((item) => {
    if (item.section !== section) return false;
    if (item.minRole && admin) return hasMinRole(admin.role, item.minRole);
    return true;
  });

  // 표시할 항목이 없으면 섹션 자체를 숨김
  if (items.length === 0) return null;

  return (
    <div className="pt-4">
      <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <NavLink key={item.name} item={item} onClick={onClick} />
        ))}
      </div>
    </div>
  );
}
```

**sidebarContent에서 섹션 없는 항목도 필터링**:

```typescript
const sidebarContent = (onNav?: () => void) => (
  <>
    {navigation.filter((i) => {
      if (i.section) return false;
      if (i.minRole && admin) return hasMinRole(admin.role, i.minRole);
      return true;
    }).map((item) => (
      <NavLink key={item.name} item={item} onClick={onNav} />
    ))}
    <NavSection title="큐레이션" section="curation" onClick={onNav} />
    <NavSection title="파트너" section="partner" onClick={onNav} />
    <NavSection title="시스템" section="system" onClick={onNav} />
  </>
);
```

**설계 결정**:
- 섹션 내 모든 항목이 필터링되면 섹션 제목도 숨김 → `moderator`에게는 "파트너", "시스템" 섹션이 보이지 않음
- `minRole` 미지정 항목은 모든 역할에게 표시 (기본값 = `moderator`)

---

### 2.6 `src/pages/Admins.tsx` — 정리

**제거할 코드** (기존 인라인 역할 체크):

```typescript
// 삭제: ProtectedRoute에서 이미 처리
if (currentAdmin?.role !== 'super_admin') {
  return (
    <div className="bg-yellow-50 ...">이 페이지에 접근할 권한이 없습니다.</div>
  );
}
```

**ROLES 상수 변경** (역할 옵션에 `moderator` 추가):

```typescript
const ROLES = [
  { value: 'admin', label: '관리자' },
  { value: 'moderator', label: '모더레이터' },
];
```

> `super_admin`은 생성 폼에 포함하지 않음 — Supabase Dashboard에서 직접 설정 (보안상 제한)

---

## 3. 구현 순서

| Step | 파일 | 작업 | 의존성 |
|------|------|------|--------|
| 1 | `src/types/index.ts` | `AdminRole` 타입 추가, Admin role 확장 | 없음 |
| 2 | `src/utils/roles.ts` | 역할 유틸리티 신규 생성 | Step 1 |
| 3 | `src/contexts/AuthContext.tsx` | JWT role 추출 로직 변경 | Step 1 |
| 4 | `src/App.tsx` | ProtectedRoute 확장 + 라우트 권한 매핑 | Step 2, 3 |
| 5 | `src/components/Layout.tsx` | 사이드바 필터링 | Step 2, 3 |
| 6 | `src/pages/Admins.tsx` | 인라인 역할 체크 제거 + 역할 옵션 추가 | Step 4 |

---

## 4. Supabase 설정 가이드 (코드 외 작업)

어드민 유저에게 역할을 부여하는 방법:

### 방법 1: Supabase Dashboard

1. Authentication → Users → 대상 유저 클릭
2. `app_metadata` 편집:
   ```json
   { "role": "super_admin" }
   ```
3. 저장 → 다음 로그인 시 JWT에 반영

### 방법 2: Supabase Admin API (서버사이드)

```javascript
const { data, error } = await supabase.auth.admin.updateUserById(userId, {
  app_metadata: { role: "admin" }
});
```

> 이 작업은 코드 구현 범위 밖이며, 운영 시 수동으로 설정한다.

---

## 5. 테스트 시나리오

| 시나리오 | 기대 결과 |
|----------|-----------|
| `moderator`로 로그인 → `/dashboard` 접근 | 정상 접근 |
| `moderator`로 로그인 → `/curation` 접근 | 정상 접근 |
| `moderator`로 로그인 → `/partners` 접근 | AccessDenied 표시 |
| `moderator`로 로그인 → `/admins` 접근 | AccessDenied 표시 |
| `moderator`로 로그인 → 사이드바 확인 | 큐레이션 섹션만 표시, 파트너/시스템 섹션 숨김 |
| `admin`으로 로그인 → `/partners` 접근 | 정상 접근 |
| `admin`으로 로그인 → `/admins` 접근 | AccessDenied 표시 |
| `admin`으로 로그인 → 사이드바 확인 | 큐레이션+파트너 표시, 시스템 숨김 |
| `super_admin`으로 로그인 → 모든 페이지 | 정상 접근 |
| `super_admin`으로 로그인 → 사이드바 | 모든 섹션 표시 |
| JWT에 `role` 없는 유저 로그인 | `moderator`로 fallback |
| 로컬 로그인 (`VITE_ADMIN_ROLE=moderator`) | moderator 권한으로 동작 |
| 로컬 로그인 (`VITE_ADMIN_ROLE` 미설정) | super_admin으로 동작 (기존 동작 유지) |
