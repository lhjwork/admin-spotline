# admin-spotLine Changelog

All notable changes to the admin-spotLine project are documented in this file.

---

## [2026-04-03] - admin-role-enforcement v1.0.0

### Added
- 3-tier role hierarchy system (super_admin > admin > moderator)
- JWT `app_metadata.role` extraction from Supabase with fallback chain
- `src/utils/roles.ts` with role utility functions:
  - `hasMinRole(userRole, requiredRole)` - role permission validation
  - `getRoleLabel(role)` - Korean role labels
  - `toSafeRole(value)` - role validation/normalization
- ProtectedRoute wrapper with role-aware access control
- AccessDenied component for permission failures
- Sidebar menu filtering by role (4/7 items conditional)
- Role label display in Layout header
- `moderator` role option in admin creation form
- Role badge color differentiation (moderator=green)
- Environment variable support: `VITE_ADMIN_ROLE` for local dev override

### Changed
- `sessionToAdmin()` now reads actual JWT role instead of hardcoding super_admin
- ProtectedRoute enhanced with optional `requiredRole` prop
- NavigationItem interface extended with `minRole` field
- Admin page role checks moved from component to route-level protection

### Fixed
- Hardcoded role vulnerability (all users were acting as super_admin)
- Missing role validation in role assignment
- Sidebar permission overpermissioning (moderators could see restricted menus)
- Route access control entirely missing for 9 of 10 routes

### Security
- Frontend RBAC now prevents unauthorized route access
- Invalid JWT roles fallback to minimal `moderator` permission (least privilege)
- Supabase `app_metadata.role` source of truth (tamper-proof)

### Quality
- Design match rate: 97% (exceeds 90% threshold)
- 0 TypeScript errors
- 0 breaking changes to existing APIs
- Bundle impact: ~3.2KB gzipped

---

## Project Information

**Repository**: admin-spotLine
**Version**: 1.0.0
**Last Updated**: 2026-04-03

**Completed PDCA Cycles**:
1. admin-role-enforcement (Complete, 97% match rate)

**In Progress**: None

---
