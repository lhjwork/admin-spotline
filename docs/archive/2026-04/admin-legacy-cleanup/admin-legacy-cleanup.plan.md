# Admin Legacy Cleanup Planning Document

> **Summary**: Express 레거시 백엔드 잔재 제거 + 미사용 서비스/유틸/컴포넌트/패키지 정리
>
> **Project**: admin-spotLine
> **Author**: AI Assistant
> **Date**: 2026-04-04
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | admin-tech-modernization 완료 후에도 Express 레거시 잔재(authAPI, legacyApiClient, 중복 barrel)와 미사용 유틸(geocoding 269줄, dateUtils), 중복 컴포넌트(AddressSearchWithMap), 미사용 패키지(clsx, date-fns)가 코드베이스에 남아 유지보수 복잡도 증가 |
| **Solution** | 미사용 파일 삭제, legacyApiClient 제거, 중복 컴포넌트 통합, 미사용 패키지/문서 정리를 7단계로 수행 |
| **Function/UX Effect** | 사용자 기능 변화 없음 (내부 코드 정리). 개발자 경험 향상: 코드베이스 ~600줄 감소, import 경로 단순화, 서비스 레이어 명확화 |
| **Core Value** | Express 레거시 의존성 완전 제거. 명확한 서비스 레이어 구조 확립. 미사용 코드 0개 달성 |

---

## 1. Overview

### 1.1 Purpose

admin-tech-modernization(React 19, Vite 6, Tailwind 4, ESLint 9) 완료 후 남아있는 레거시 코드를 제거하여 코드베이스를 깨끗하게 정리한다. 이전 계획(v0.1, 2026-04-03)에서 @ts-nocheck 복구와 v1 데드 코드 삭제는 이미 완료되었으며, 이번에는 남은 레거시 잔재를 처리한다.

### 1.2 Background

- Express+MongoDB → Spring Boot+PostgreSQL+Supabase 전환 완료
- 인증: Supabase Auth 완전 전환 완료, 하지만 `authAPI.ts`가 Express `/api/admin/login` 호출 코드를 여전히 보유
- `legacyApiClient`(Express용 axios 인스턴스) + 중복 인터셉터가 `apiClient.ts`에 잔존
- `geocodingAPI.ts`(서비스)와 `geocoding.ts`(유틸) + `dateUtils.ts` 전체 미사용
- `api.ts` barrel이 `index.ts`와 완전 중복
- `AddressSearchWithMap.tsx`에 console.log 22개 이상 + `DaumAddressEmbed.tsx`와 기능 중복

### 1.3 Related Documents

- Archive: `docs/archive/2026-04/admin-tech-modernization/admin-tech-modernization.report.md`

### 1.4 Previous Plan Changes

- v0.1 (2026-04-03): @ts-nocheck 복구 + v1 데드 코드 삭제 중심 — **이미 완료됨**
- v0.2 (2026-04-04): 현재 상태 재분석 후 남은 레거시 잔재 중심으로 재작성

---

## 2. Scope

### 2.1 In Scope

- [ ] 미사용 서비스 삭제: `authAPI.ts`, `geocodingAPI.ts`
- [ ] 레거시 barrel 삭제: `services/api.ts`
- [ ] `apiClient.ts`에서 `legacyApiClient` + 중복 인터셉터 제거
- [ ] `adminAPI.ts`의 `legacyApiClient` → `apiClient` 전환
- [ ] `services/index.ts`에서 삭제된 서비스 re-export 제거
- [ ] `Admins.tsx` import 경로 수정 (`../services/api` → `../services`)
- [ ] 미사용 유틸 삭제: `utils/geocoding.ts`, `utils/dateUtils.ts`
- [ ] 중복 컴포넌트 교체: `AddressSearchWithMap.tsx` → `DaumAddressEmbed.tsx` (SpotFormPanel)
- [ ] 미사용 패키지 제거: `clsx`, `date-fns`
- [ ] 레거시 루트 문서 삭제: 4개 .md 파일
- [ ] `services/README.md` 삭제 (완전 구버전)

### 2.2 Out of Scope

- Chart.tsx 미사용 함수 정리 (현재 사용 중인 컴포넌트, 별도 리팩터링)
- 카카오 API 키 환경변수 분리 (별도 보안 피처)
- adminAPI.ts의 Spring Boot 엔드포인트 API 스펙 변경 (현재 전환만, 로직 변경 없음)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 미사용 서비스 삭제: `authAPI.ts`, `geocodingAPI.ts` | High | Pending |
| FR-02 | `apiClient.ts`에서 `legacyApiClient` + 중복 인터셉터 제거 | High | Pending |
| FR-03 | `adminAPI.ts` legacyApiClient → apiClient 전환 | High | Pending |
| FR-04 | `services/api.ts` barrel 삭제 + `Admins.tsx` import 수정 | High | Pending |
| FR-05 | `services/index.ts` re-export 정리 | High | Pending |
| FR-06 | 미사용 유틸 삭제: `geocoding.ts`, `dateUtils.ts` | High | Pending |
| FR-07 | `AddressSearchWithMap.tsx` → `DaumAddressEmbed.tsx` 교체 | Medium | Pending |
| FR-08 | 미사용 패키지 제거: `clsx`, `date-fns` | Low | Pending |
| FR-09 | 레거시 루트 문서 삭제 (4개 .md) | Low | Pending |
| FR-10 | `services/README.md` 삭제 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Zero Regression | 기존 기능 동작 유지 | `npm run build` + `npm run lint` + TypeScript 통과 |
| Code Reduction | ~600줄 이상 감소 | `git diff --stat` |
| Zero Legacy | `legacyApiClient` import 0건 | `grep -r "legacyApiClient" src/` |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모든 FR 항목 구현 완료
- [ ] `npm run build` 성공
- [ ] `npm run lint` 에러 0개
- [ ] TypeScript 타입 체크 통과
- [ ] `legacyApiClient` 참조 0건
- [ ] 삭제된 파일에 대한 import 참조 0건

### 4.2 Quality Criteria

- [ ] Zero lint errors
- [ ] Build succeeds
- [ ] No broken imports

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| adminAPI.ts 전환 시 Admins 페이지 런타임 에러 | Medium | Medium | 전환 후 빌드+타입체크 즉시 검증 |
| SpotFormPanel에서 컴포넌트 교체 시 Props 불일치 | Medium | Low | DaumAddressEmbed Props 호환성 사전 확인 |
| services/index.ts 정리 시 숨은 import 존재 | High | Low | 삭제 전 grep으로 전체 import 검증 |

---

## 6. Architecture Considerations

### 6.1 Project Level

| Level | Selected |
|-------|:--------:|
| **Dynamic** | ✅ |

### 6.2 Implementation Order (7 Steps)

| Step | 작업 | 파일 | 의존성 |
|------|------|------|--------|
| 1 | 독립 미사용 파일 삭제 | `utils/geocoding.ts`, `utils/dateUtils.ts`, `services/geocoding/geocodingAPI.ts`, `services/auth/authAPI.ts` | 없음 |
| 2 | `apiClient.ts` 정리 | legacyApiClient + 중복 인터셉터 제거 | Step 1 |
| 3 | `adminAPI.ts` 전환 | legacyApiClient → apiClient | Step 2 |
| 4 | barrel + import 정리 | `services/api.ts` 삭제, `Admins.tsx` import 수정 | Step 3 |
| 5 | `services/index.ts` re-export 정리 | 삭제된 모듈 re-export 제거 | Step 4 |
| 6 | 컴포넌트 교체 | AddressSearchWithMap → DaumAddressEmbed (SpotFormPanel) | 독립 |
| 7 | 패키지 + 문서 정리 | package.json, 루트 .md 4개, services/README.md | 독립 |

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] ESLint configuration (`eslint.config.js` — flat config, ESLint 9)
- [x] TypeScript configuration (`tsconfig.json` — strict mode)
- [x] Vite 6 configuration (`vite.config.ts`)
- [x] Tailwind CSS 4 (`src/index.css` — CSS-first)

---

## 8. Next Steps

1. [ ] Write design document (`admin-legacy-cleanup.design.md`)
2. [ ] Start implementation (Step 1~7)
3. [ ] Gap analysis after implementation

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-03 | Initial draft (@ts-nocheck + v1 dead code) | Claude |
| 0.2 | 2026-04-04 | 현재 상태 재분석 — 남은 레거시 잔재 중심으로 재작성 | AI Assistant |
