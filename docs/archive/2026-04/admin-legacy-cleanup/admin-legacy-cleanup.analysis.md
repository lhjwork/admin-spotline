# admin-legacy-cleanup Analysis Report

> **Analysis Type**: Gap Analysis (Design v0.2 vs Implementation)
>
> **Project**: admin-spotLine
> **Analyst**: gap-detector
> **Date**: 2026-04-04
> **Design Doc**: [admin-legacy-cleanup.design.md](../02-design/features/admin-legacy-cleanup.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Design v0.2 문서에서 명시한 7 Steps (30개 검증 항목)의 레거시 정리 작업이 실제 구현에 모두 반영되었는지 검증한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/admin-legacy-cleanup.design.md` (v0.2, 2026-04-04)
- **Implementation Path**: `src/`, `package.json`, root `.md` files
- **Analysis Date**: 2026-04-04

---

## 2. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 100% | MATCH |
| Verification Checks | 100% | MATCH |
| **Overall** | **100%** | **MATCH** |

---

## 3. Step-by-Step Gap Analysis

### Step 1: Independent Unused File Deletion (6/6)

| Design Item | Expected | Actual | Status |
|-------------|----------|--------|:------:|
| `src/utils/geocoding.ts` | DELETED | File not found | MATCH |
| `src/utils/dateUtils.ts` | DELETED | File not found | MATCH |
| `src/services/auth/authAPI.ts` | DELETED | File not found | MATCH |
| `src/services/geocoding/geocodingAPI.ts` | DELETED | File not found | MATCH |
| `src/services/auth/` directory | DELETED | Directory not found | MATCH |
| `src/services/geocoding/` directory | DELETED | Directory not found | MATCH |

### Step 2: apiClient.ts Cleanup (4/4)

| Design Item | Expected | Actual | Status |
|-------------|----------|--------|:------:|
| `legacyApiClient` removed | 0 references | `grep` = 0 matches | MATCH |
| `LEGACY_API_URL` removed | 0 references | `grep` = 0 matches | MATCH |
| Duplicate interceptors removed | Single set only | 46 lines, single interceptor pair | MATCH |
| Final file matches design spec | ~44 lines | 46 lines (matches design structure exactly) | MATCH |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/admin-spotLine/src/services/base/apiClient.ts` (46 lines)
- Lines 1-11: axios import, `API_BASE_URL`, `apiClient` creation
- Lines 13-23: Single request interceptor (Supabase token)
- Lines 25-44: Single response interceptor (401 handling)
- Line 46: `export default apiClient`

### Step 3: adminAPI.ts Conversion (2/2)

| Design Item | Expected | Actual (line 1) | Status |
|-------------|----------|-----------------|:------:|
| Import statement | `import { apiClient } from '../base/apiClient'` | Exact match | MATCH |
| localStorage fallback | Maintained | Present (lines 6-21) | MATCH |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/admin-spotLine/src/services/admin/adminAPI.ts`

### Step 4: api.ts Barrel Deletion + Admins.tsx Fix (3/3)

| Design Item | Expected | Actual | Status |
|-------------|----------|--------|:------:|
| `src/services/api.ts` | DELETED | File not found | MATCH |
| `Admins.tsx` import | `from '../services'` | Line 3: `from '../services'` | MATCH |
| `services/api` references | 0 matches | `grep` = 0 matches | MATCH |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/admin-spotLine/src/pages/Admins.tsx`

### Step 5: index.ts Re-export Cleanup (3/3)

| Design Item | Expected | Actual | Status |
|-------------|----------|--------|:------:|
| `authAPI` export removed | Not present | Not in file | MATCH |
| `geocodingAPI` export removed | Not present | Not in file | MATCH |
| Remaining exports correct | 7 exports | All 7 present (lines 1-16) | MATCH |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/admin-spotLine/src/services/index.ts` (16 lines)

Actual contents:
```typescript
export { apiClient } from './base/apiClient';
export type { ApiResponse, PaginationParams, PaginationResponse, BaseFilters, ApiResponseType } from './base/types';
export { adminAPI } from './admin/adminAPI';
export { mediaAPI } from './media/mediaAPI';
export { placeAPI } from './v2/placeAPI';
export { spotAPI } from './v2/spotAPI';
export { routeAPI } from './v2/routeAPI';
export { apiClient as default } from './base/apiClient';
```

### Step 6: AddressSearchWithMap -> DaumAddressEmbed Replacement (5/5)

| Design Item | Expected | Actual | Status |
|-------------|----------|--------|:------:|
| `AddressSearchWithMap.tsx` | DELETED | File not found | MATCH |
| SpotFormPanel import | `DaumAddressEmbed` | Line 6: `import DaumAddressEmbed from "../DaumAddressEmbed"` | MATCH |
| Component usage | `<DaumAddressEmbed onAddressSelect={...} initialAddress={...} />` | Lines 167-170 | MATCH |
| `handleAddressSelect` has `detailAddress` + `fullAddress` | Present in callback | Lines 74-108, both fields present | MATCH |
| `AddressSearchWithMap` references | 0 matches | `grep` = 0 matches | MATCH |

**File**: `/Users/hanjinlee/Desktop/projects/qrAd/admin-spotLine/src/components/curation/SpotFormPanel.tsx`

`handleAddressSelect` signature (lines 74-80):
```typescript
const handleAddressSelect = (data: {
  address: string;
  detailAddress: string;
  fullAddress: string;
  coordinates: { lat: number; lng: number; source?: string } | null;
  addressData: { zonecode: string; roadAddress: string; jibunAddress: string;
                 buildingName: string; sido: string; sigungu: string; bname: string };
}) => { ... }
```

### Step 7: Package + Document Cleanup (7/7)

| Design Item | Expected | Actual | Status |
|-------------|----------|--------|:------:|
| `clsx` removed from dependencies | Not in package.json | Not present | MATCH |
| `date-fns` removed from dependencies | Not in package.json | Not present | MATCH |
| `IMAGE_UPLOAD_FIX_SUMMARY.md` | DELETED | File not found | MATCH |
| `KAKAO_API_SETUP_GUIDE.md` | DELETED | File not found | MATCH |
| `MAIN_BANNER_SYSTEM_UPDATE_SUMMARY.md` | DELETED | File not found | MATCH |
| `S3_IMAGE_UPLOAD_API_SPEC.md` | DELETED | File not found | MATCH |
| `src/services/README.md` | DELETED | File not found | MATCH |

---

## 4. Verification Checks

| Check | Expected | Result | Status |
|-------|----------|--------|:------:|
| `grep -r "legacyApiClient" src/` | 0 matches | 0 matches | PASS |
| `grep -r "AddressSearchWithMap" src/` | 0 matches | 0 matches | PASS |
| `grep -r "LEGACY_API_URL" src/` | 0 matches | 0 matches | PASS |
| `grep -r "authAPI\|geocodingAPI" src/` | 0 matches | 0 matches | PASS |
| `grep -r "services/api" src/` (import) | 0 matches | 0 matches | PASS |
| `grep -r "clsx\|date-fns" src/` (import) | 0 matches | 0 matches | PASS |
| `npm run build` | Success | Confirmed passing | PASS |
| `npm run lint` | 0 errors | 0 errors, 28 warnings | PASS |

---

## 5. Extra Changes (Design X, Implementation O)

| Item | Location | Description | Impact |
|------|----------|-------------|--------|
| Area auto-extraction from addressData | SpotFormPanel.tsx:94-107 | `sido/sigungu/bname` 자동 추출 + area 자동 매핑 | Positive (UX 개선) |

This extra logic enhances the address selection UX by auto-populating region classification fields from Daum Postcode data. Beneficial addition with no negative impact.

---

## 6. Deleted Files Summary (11 files confirmed deleted)

| # | File | Step |
|---|------|:----:|
| 1 | `src/utils/geocoding.ts` | 1 |
| 2 | `src/utils/dateUtils.ts` | 1 |
| 3 | `src/services/auth/authAPI.ts` | 1 |
| 4 | `src/services/geocoding/geocodingAPI.ts` | 1 |
| 5 | `src/services/api.ts` | 4 |
| 6 | `src/services/README.md` | 7 |
| 7 | `src/components/AddressSearchWithMap.tsx` | 6 |
| 8 | `IMAGE_UPLOAD_FIX_SUMMARY.md` | 7 |
| 9 | `KAKAO_API_SETUP_GUIDE.md` | 7 |
| 10 | `MAIN_BANNER_SYSTEM_UPDATE_SUMMARY.md` | 7 |
| 11 | `S3_IMAGE_UPLOAD_API_SPEC.md` | 7 |

---

## 7. Match Rate

```
Total Items:    30
Matched:        30 (100%)
Partial:         0 (0%)
Missing:         0 (0%)
Extra:           1 (beneficial, non-breaking)

Match Rate: 100%
```

---

## 8. Recommended Actions

None required. Design and implementation match at 100%.

---

## 9. Next Steps

- [x] All 7 Steps implemented and verified
- [x] All 8 verification checks passed
- [x] 0 legacy references remaining
- [ ] Generate completion report (`/pdca report admin-legacy-cleanup`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-03 | Initial analysis (design v0.1) | gap-detector |
| 2.0 | 2026-04-04 | Re-analysis against design v0.2 -- 100% match | gap-detector |
