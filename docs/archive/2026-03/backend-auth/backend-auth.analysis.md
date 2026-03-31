# backend-auth Gap Analysis

> **Author**: gap-detector
> **Created**: 2026-03-31
> **Status**: Approved

## Summary

| Metric | Value |
|--------|-------|
| Feature | backend-auth |
| Design Document | `springboot-spotLine-backend/docs/02-design/features/backend-auth.design.md` |
| Design Items | 9 |
| Passed | 9 |
| Gaps | 0 |
| Match Rate | **100%** |

## Detail

### Item 1: SupabaseJwtProperties.java

- **Status**: PASS
- **Design**: `@Configuration` + `@ConfigurationProperties(prefix = "supabase")` + `@Data` with fields `url`, `anonKey`, `jwtSecret`
- **Implementation**: Exact match. All annotations, class structure, and fields are identical to the design specification.

### Item 2: JwtTokenProvider.java

- **Status**: PASS
- **Design**: `@Component` + `@RequiredArgsConstructor` + `@Slf4j`, `validateToken()` using JJWT 0.12.6 `Jwts.parser().verifyWith()`, `getUserId()`, `getEmail()`, `getRole()` methods, HMAC-SHA256 signing, separate catch for `ExpiredJwtException` and `JwtException`
- **Implementation**: Exact match. All methods, exception handling, logging messages, and JJWT API usage are identical.

### Item 3: JwtAuthenticationFilter.java

- **Status**: PASS
- **Design**: Extends `OncePerRequestFilter`, `resolveToken()` extracts Bearer token from Authorization header, sets `UsernamePasswordAuthenticationToken` with userId as principal, `ROLE_` + role.toUpperCase() authority, `WebAuthenticationDetailsSource`
- **Implementation**: Exact match. Filter chain logic, token resolution, SecurityContext setup, and debug logging all match the design.

### Item 4: SecurityConfig.java

- **Status**: PASS
- **Design**: Inject `CorsConfig` + `JwtAuthenticationFilter`, CORS/CSRF/headers/stateless session config, GET permitAll for `/api/v2/spots/**`, `/api/v2/routes/**`, `/api/v2/places/**`, actuator, health, h2-console; POST/PUT/DELETE `/api/v2/**` authenticated; `addFilterBefore` JWT filter
- **Implementation**: Exact match. All request matchers, HTTP method rules, and filter registration are identical.

### Item 5: @supabase/supabase-js installed (package.json)

- **Status**: PASS
- **Design**: `pnpm add @supabase/supabase-js`
- **Implementation**: `"@supabase/supabase-js": "^2.101.0"` present in dependencies.

### Item 6: supabaseClient.ts

- **Status**: PASS
- **Design**: Import `createClient`, read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env`, throw error if missing, export `supabase` client
- **Implementation**: Exact match. Environment variable names, error message, and export are identical.

### Item 7: AuthContext.tsx

- **Status**: PASS
- **Design**: `AuthContextType` interface with `admin`, `isAuthenticated`, `loading`, `login`, `logout`; `sessionToAdmin()` mapper; `useEffect` with `getSession()` + `onAuthStateChange`; `signInWithPassword` login; `signOut` logout; no localStorage management
- **Implementation**: Exact match. All state management, Supabase auth integration, session-to-admin mapping, and cleanup logic match the design.

### Item 8: Login.tsx

- **Status**: PASS
- **Design**: `LoginFormData` with `email` (not `username`), `type="email"`, placeholder `admin@spotline.kr`, label "이메일", `login(data.email, data.password)`, no `console.log`
- **Implementation**: Exact match. Form field is `email`, input type is `email`, placeholder and label match, `login(data.email, data.password)` call present, no console.log statements.

### Item 9: apiClient.ts

- **Status**: PASS
- **Design**: Import `supabase` from `supabaseClient`, request interceptor gets session via `supabase.auth.getSession()` and sets `Bearer` token, response interceptor calls `supabase.auth.signOut()` on 401 and redirects to `/login`, legacy client uses same pattern
- **Implementation**: Exact match. Both `apiClient` and `legacyApiClient` have identical interceptor patterns. Supabase session-based token retrieval replaces localStorage. Error message formatting matches.

## Recommendations

No gaps found. The implementation is a 100% match with the design document.

The following minor observations are noted for future consideration (not gaps):

1. **legacyApiClient interceptors**: The design mentioned `legacyApiClient`도 동일 패턴 적용 (또는 레거시 제거)` - the implementation chose to apply the same pattern, which is the correct approach during migration. Consider removing `legacyApiClient` entirely once Express backend migration is complete.

2. **PATCH method**: SecurityConfig does not explicitly list `PATCH` as authenticated. If PATCH endpoints are added later, the security rules should be updated. Currently this is not a gap since no PATCH endpoints exist in the design.

## Related Documents

- Design: [backend-auth.design.md](../../springboot-spotLine-backend/docs/02-design/features/backend-auth.design.md)
