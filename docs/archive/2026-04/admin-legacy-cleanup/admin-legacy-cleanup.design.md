# Admin Legacy Cleanup Design Document

> **Summary**: Express 레거시 잔재 제거 + 미사용 서비스/유틸/컴포넌트/패키지 정리 — 구체적 변경 명세
>
> **Project**: admin-spotLine
> **Author**: AI Assistant
> **Date**: 2026-04-04
> **Status**: Draft
> **Planning Doc**: [admin-legacy-cleanup.plan.md](../../01-plan/features/admin-legacy-cleanup.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- Express 레거시 백엔드 의존성(legacyApiClient, authAPI) 완전 제거
- 미사용 코드 0개 달성 (유틸, 서비스, 컴포넌트)
- 서비스 레이어 import 경로 단순화 (api.ts barrel 제거)
- 빌드/린트/타입체크 통과 유지

### 1.2 Design Principles

- **안전한 삭제**: 각 파일 삭제 전 전체 import 참조 검증
- **단계적 진행**: 의존성 순서대로 삭제 (독립 파일 → 의존 파일)
- **기능 무변경**: 사용자 기능에 영향 없는 내부 정리만 수행

### 1.3 Previous Design Changes

- v0.1 (2026-04-03): @ts-nocheck 복구 + v1 데드 코드(Stores, RecommendationSettings 등) 삭제 중심 — **이미 완료됨**
- v0.2 (2026-04-04): 현재 상태 재분석 — 남은 레거시 잔재 중심으로 재작성

---

## 2. Implementation Specification

### Step 1: 독립 미사용 파일 삭제

의존하는 파일이 없는 완전 독립 파일을 먼저 삭제한다.

| 파일 | 줄 수 | 삭제 근거 |
|------|:-----:|-----------|
| `src/utils/geocoding.ts` | 269 | import 0건. AddressSearchWithMap/DaumAddressEmbed가 인라인 지오코딩 사용 |
| `src/utils/dateUtils.ts` | ~60 | import 0건. 페이지에서 `new Date().toLocaleDateString('ko-KR')` 직접 사용 |
| `src/services/geocoding/geocodingAPI.ts` | ~30 | import 0건 (index.ts/api.ts re-export만 존재, 실제 호출 없음) |
| `src/services/auth/authAPI.ts` | ~30 | import 0건 (index.ts/api.ts re-export만 존재). Supabase Auth로 완전 대체됨 |

**디렉토리 삭제**: `src/services/geocoding/`, `src/services/auth/` (각 디렉토리에 파일 1개뿐)

**검증**: `grep -r "geocodingAPI\|authAPI\|dateUtils" src/ --include="*.ts" --include="*.tsx"` — re-export 외 실제 import 0건 확인

---

### Step 2: apiClient.ts에서 legacyApiClient 제거

**파일**: `src/services/base/apiClient.ts`

**제거 대상**:
- `LEGACY_API_URL` 상수
- `legacyApiClient` axios 인스턴스 생성
- `legacyApiClient` request 인터셉터 (apiClient과 동일 코드 중복)
- `legacyApiClient` response 인터셉터 (apiClient과 동일 코드 중복)

**After** (~44줄, 현재 ~88줄):
```typescript
import axios from "axios";
import { supabase } from "../../lib/supabaseClient";

const API_BASE_URL = import.meta.env['VITE_API_URL'] || "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// 요청 인터셉터 — Supabase access_token 사용
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터 — 401 시 Supabase 로그아웃
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
    const errorMessage = error.response?.data?.message ||
                        error.message ||
                        '서버 오류가 발생했습니다.';
    return Promise.reject({
      ...error,
      message: errorMessage,
      status: error.response?.status
    });
  }
);

export default apiClient;
```

---

### Step 3: adminAPI.ts legacyApiClient → apiClient 전환

**파일**: `src/services/admin/adminAPI.ts`

**변경**: import 1줄만 수정

```typescript
// Before
import { legacyApiClient as apiClient } from '../base/apiClient';

// After
import { apiClient } from '../base/apiClient';
```

**엔드포인트 경로**: `/api/admin/*` 유지 (Spring Boot에서도 동일 경로 사용)

**getAdminList의 localStorage 폴백**: 유지 (네트워크 에러 시 로컬 데이터 반환하는 안전장치)

---

### Step 4: services/api.ts barrel 삭제 + Admins.tsx import 수정

#### 4-A: Admins.tsx import 수정 (먼저)

**파일**: `src/pages/Admins.tsx` (line 3)

```typescript
// Before
import { adminAPI } from '../services/api'

// After
import { adminAPI } from '../services'
```

#### 4-B: services/api.ts 삭제

`api.ts`는 `index.ts`의 완전 중복 barrel. Admins.tsx import 수정 후 삭제.

---

### Step 5: services/index.ts re-export 정리

**파일**: `src/services/index.ts`

삭제된 모듈의 re-export 2줄 제거:

```typescript
// 제거할 라인
export { authAPI } from './auth/authAPI';
export { geocodingAPI } from './geocoding/geocodingAPI';
```

**After**:
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

---

### Step 6: AddressSearchWithMap → DaumAddressEmbed 교체

#### 6-A: SpotFormPanel.tsx 수정

**파일**: `src/components/curation/SpotFormPanel.tsx`

**Import 변경**:
```typescript
// Before
import AddressSearchWithMap from "../AddressSearchWithMap";

// After
import DaumAddressEmbed from "../DaumAddressEmbed";
```

**컴포넌트 교체**:
```tsx
// Before
<AddressSearchWithMap
  onAddressSelect={handleAddressSelect}
  initialAddress={address}
  hideCoordinateInfo
/>

// After
<DaumAddressEmbed
  onAddressSelect={handleAddressSelect}
  initialAddress={address}
/>
```

**handleAddressSelect 콜백 수정**:

DaumAddressEmbed의 `AddressSelectData`는 `detailAddress`와 `fullAddress` 필드를 추가로 제공:

```typescript
// Before (AddressSearchWithMap shape)
const handleAddressSelect = (data: { address: string; coordinates: ... }) => {
  setValue("address", data.address);
  if (data.coordinates) {
    setValue("latitude", data.coordinates.lat);
    setValue("longitude", data.coordinates.lng);
  }
};

// After (DaumAddressEmbed shape)
const handleAddressSelect = (data: {
  address: string;
  detailAddress: string;
  fullAddress: string;
  coordinates: { lat: number; lng: number; source?: string } | null;
  addressData: { zonecode: string; roadAddress: string; jibunAddress: string; buildingName: string; sido: string; sigungu: string; bname: string };
}) => {
  setValue("address", data.address);
  if (data.detailAddress) {
    setValue("addressDetail", data.detailAddress);
  }
  if (data.coordinates) {
    setValue("latitude", data.coordinates.lat);
    setValue("longitude", data.coordinates.lng);
  }
};
```

#### 6-B: AddressSearchWithMap.tsx 삭제

SpotFormPanel 교체 완료 후 삭제.

**검증**: `grep -r "AddressSearchWithMap" src/` — 참조 0건

---

### Step 7: 패키지 + 문서 정리

#### 7-A: 미사용 패키지 제거

```bash
npm uninstall clsx date-fns
```

**검증**: `grep -r "from ['\"]clsx\|from ['\"]date-fns" src/` — import 0건

#### 7-B: 레거시 루트 문서 삭제

| 파일 | 삭제 근거 |
|------|-----------|
| `IMAGE_UPLOAD_FIX_SUMMARY.md` | 빈 파일 |
| `KAKAO_API_SETUP_GUIDE.md` | 구버전 가이드 |
| `MAIN_BANNER_SYSTEM_UPDATE_SUMMARY.md` | 레거시 매장 시스템 |
| `S3_IMAGE_UPLOAD_API_SPEC.md` | mediaAPI로 대체됨 |

#### 7-C: services/README.md 삭제

현재 서비스 구조와 완전 불일치 (존재하지 않는 storeAPI 등 문서화).

---

## 3. Impact Summary

### 3.1 삭제 파일 목록 (11개)

| # | 파일 | Step |
|---|------|------|
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

### 3.2 수정 파일 목록 (4개)

| # | 파일 | Step | 변경 내용 |
|---|------|------|-----------|
| 1 | `src/services/base/apiClient.ts` | 2 | legacyApiClient + 중복 인터셉터 제거 (~44줄 감소) |
| 2 | `src/services/admin/adminAPI.ts` | 3 | import 1줄: legacyApiClient → apiClient |
| 3 | `src/services/index.ts` | 5 | authAPI, geocodingAPI re-export 제거 (2줄) |
| 4 | `src/components/curation/SpotFormPanel.tsx` | 6 | AddressSearchWithMap → DaumAddressEmbed 교체 |

### 3.3 삭제 디렉토리 (2개)

| 디렉토리 | 이유 |
|-----------|------|
| `src/services/auth/` | authAPI.ts 삭제 후 빈 디렉토리 |
| `src/services/geocoding/` | geocodingAPI.ts 삭제 후 빈 디렉토리 |

### 3.4 패키지 제거 (2개)

- `clsx` (import 0건)
- `date-fns` (import 0건)

---

## 4. Verification Checklist

### 4.1 각 Step 후 검증

| Step | 검증 명령 |
|------|-----------|
| 1 | `grep -r "geocodingAPI\|authAPI\|dateUtils\|utils/geocoding" src/ --include="*.ts" --include="*.tsx"` |
| 2~3 | `grep -r "legacyApiClient\|LEGACY_API_URL" src/` — 0건 |
| 4 | `grep -r "services/api['\"]" src/ --include="*.ts" --include="*.tsx"` — 0건 |
| 5 | TypeScript 타입 체크 통과 |
| 6 | `grep -r "AddressSearchWithMap" src/` — 0건 |
| 7 | `grep -r "from ['\"]clsx\|from ['\"]date-fns" src/` — 0건 |

### 4.2 최종 검증

- [ ] `npm run build` 성공
- [ ] `npm run lint` 에러 0개
- [ ] TypeScript 타입 체크 통과
- [ ] `legacyApiClient` 참조 0건
- [ ] 삭제된 파일에 대한 import 참조 0건

---

## 5. Implementation Order

```
Step 1: 독립 파일 삭제 (geocoding.ts, dateUtils.ts, authAPI.ts, geocodingAPI.ts + 디렉토리)
    ↓
Step 2: apiClient.ts 정리 (legacyApiClient 제거)
    ↓
Step 3: adminAPI.ts 전환 (legacyApiClient → apiClient)
    ↓
Step 4: api.ts 삭제 + Admins.tsx import 수정
    ↓
Step 5: index.ts re-export 정리
    ↓
Step 6: AddressSearchWithMap → DaumAddressEmbed 교체
    ↓
Step 7: 패키지 + 문서 정리
    ↓
Final: 빌드/린트/타입체크 검증
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-03 | Initial draft (@ts-nocheck + v1 dead code) | Claude |
| 0.2 | 2026-04-04 | 현재 상태 재분석 — 레거시 잔재 중심 재작성 | AI Assistant |
