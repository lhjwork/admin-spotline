# SpotLine Admin API Services

## 📁 구조 개요

API 서비스가 도메인별로 체계적으로 분리되어 관리하기 쉽게 구성되었습니다.

```
src/services/
├── base/                    # 기본 설정
│   ├── apiClient.ts        # Axios 인스턴스 및 인터셉터
│   └── types.ts            # 공통 타입 정의
├── auth/                   # 인증 관련
│   └── authAPI.ts          # 로그인, 로그아웃, 토큰 관리
├── admin/                  # 관리자 관리
│   └── adminAPI.ts         # 관리자 계정 CRUD
├── stores/                 # 매장 관리
│   ├── storeAPI.ts         # 기본 매장 API
│   └── operationalStoreAPI.ts # 운영 매장 (real_ 접두사)
├── demo/                   # 데모 시스템
│   └── demoAPI.ts          # 데모 매장 및 추천 관리
├── recommendations/        # 추천 시스템
│   └── recommendationAPI.ts # 매장 추천 관리
├── upload/                 # 파일 업로드
│   └── s3UploadAPI.ts      # S3 이미지 업로드
├── analytics/              # 분석 및 통계
│   └── analyticsAPI.ts     # QR 스캔, 매장 분석
├── system/                 # 시스템 관리
│   └── systemAPI.ts        # 시스템 상태, 통계
├── dashboard/              # 대시보드
│   └── dashboardAPI.ts     # 통합 대시보드 데이터
├── geocoding/              # 지오코딩
│   └── geocodingAPI.ts     # 카카오 주소 검색
├── experience/             # 체험 설정
│   └── experienceAPI.ts    # SpotLine 체험 관리
├── export/                 # 데이터 내보내기
│   └── exportAPI.ts        # 데이터 내보내기
├── index.ts                # 통합 내보내기
└── api.ts                  # 하위 호환성 유지
```

## 🚀 사용법

### 1. 기본 사용법

```typescript
// 개별 API 가져오기
import { authAPI, storeAPI, s3UploadAPI } from '../services';

// 또는 특정 도메인에서 가져오기
import { authAPI } from '../services/auth/authAPI';
import { storeAPI } from '../services/stores/storeAPI';
```

### 2. 인증 API

```typescript
import { authAPI } from '../services';

// 로그인
const response = await authAPI.login('username', 'password');

// 프로필 조회
const profile = await authAPI.getProfile();

// 로그아웃
await authAPI.logout();
```

### 3. 매장 관리 API

```typescript
import { operationalStoreAPI, demoAPI } from '../services';

// 운영 매장 목록 조회 (real_ 접두사만)
const operationalStores = await operationalStoreAPI.getStores({
  page: 1,
  limit: 20,
  category: 'cafe'
});

// 데모 매장 목록 조회 (demo_ 접두사만)
const demoStores = await demoAPI.getDemoStores();

// 새 운영 매장 생성 (real_ 접두사 자동 추가)
const newStore = await operationalStoreAPI.createStore(storeData);
```

### 4. 이미지 업로드 API

```typescript
import { s3UploadAPI } from '../services';

// 이미지 업로드
const uploadResult = await s3UploadAPI.uploadImage(file, 'store');

// 진행률과 함께 업로드
const imageUrl = await s3UploadAPI.getUploadProgress(file, (progress) => {
  console.log(`업로드 진행률: ${progress}%`);
});

// 이미지 삭제
await s3UploadAPI.deleteImage(imageKey);
```

### 5. 분석 API

```typescript
import { analyticsAPI, dashboardAPI } from '../services';

// QR 성능 분석
const qrAnalytics = await analyticsAPI.getQRPerformance();

// 대시보드 통계
const dashboardStats = await dashboardAPI.getStats();

// 특정 매장 분석
const storeAnalytics = await analyticsAPI.getStoreAnalytics('storeId', {
  period: 'month'
});
```

### 6. 지오코딩 API

```typescript
import { geocodingAPI } from '../services';

// 주소 검색
const addressResults = await geocodingAPI.searchAddress('서울시 강남구');
```

## 🔧 타입 안전성

모든 API는 TypeScript로 작성되어 타입 안전성을 보장합니다:

```typescript
import { ApiResponseType, BaseFilters } from '../services';

// 공통 필터 타입 사용
const filters: BaseFilters = {
  page: 1,
  limit: 20,
  search: '카페',
  category: 'cafe',
  isActive: true
};

// API 응답 타입 자동 추론
const response: ApiResponseType<Store[]> = await storeAPI.getStores(filters);
```

## 🛠️ 설정 및 확장

### 1. 새로운 API 도메인 추가

1. `src/services/새도메인/` 폴더 생성
2. `새도메인API.ts` 파일 작성
3. `src/services/index.ts`에 내보내기 추가
4. `src/services/api.ts`에 하위 호환성 추가

### 2. API 클라이언트 설정 변경

`src/services/base/apiClient.ts`에서 기본 설정을 수정할 수 있습니다:

```typescript
// 기본 URL 변경
const API_BASE_URL = import.meta.env['VITE_API_URL'] || "http://localhost:4000";

// 타임아웃 설정
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10초
  headers: {
    "Content-Type": "application/json",
  },
});
```

### 3. 인터셉터 커스터마이징

```typescript
// 요청 전 로깅 추가
apiClient.interceptors.request.use((config) => {
  console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// 응답 후 처리 추가
apiClient.interceptors.response.use((response) => {
  console.log(`API 응답: ${response.status} ${response.config.url}`);
  return response;
});
```

## 📋 마이그레이션 가이드

### 기존 코드에서 새 구조로 마이그레이션

기존 코드는 수정 없이 그대로 작동합니다:

```typescript
// 기존 방식 (계속 작동함)
import { authAPI, storeAPI } from '../services/api';

// 새로운 방식 (권장)
import { authAPI, storeAPI } from '../services';

// 또는 더 명시적으로
import { authAPI } from '../services/auth/authAPI';
import { storeAPI } from '../services/stores/storeAPI';
```

### 점진적 마이그레이션

1. 새로운 기능은 새 구조 사용
2. 기존 코드는 필요시에만 수정
3. 모든 API가 동일하게 작동하므로 안전함

## 🔍 디버깅 및 모니터링

### API 호출 로깅

모든 API 호출은 `apiClient`의 인터셉터를 통해 자동으로 로깅됩니다:

```typescript
// 콘솔에서 확인 가능
// API Error: [에러 정보]
// 401 에러 시 자동 로그아웃
```

### 에러 처리

```typescript
try {
  const result = await storeAPI.getStores();
} catch (error) {
  // 표준화된 에러 객체
  console.error('에러 메시지:', error.message);
  console.error('상태 코드:', error.status);
}
```

## 🎯 베스트 프랙티스

1. **도메인별 분리**: 관련된 API는 같은 폴더에 그룹화
2. **타입 안전성**: 모든 API 호출에 TypeScript 타입 사용
3. **에러 처리**: try-catch 블록으로 적절한 에러 처리
4. **재사용성**: 공통 타입과 유틸리티 함수 활용
5. **일관성**: 모든 API가 동일한 패턴과 구조 사용

## 🚨 주의사항

1. **하위 호환성**: 기존 `import` 구문은 모두 계속 작동
2. **환경 변수**: `import.meta.env['변수명']` 형식 사용 필수
3. **토큰 관리**: 자동으로 JWT 토큰이 모든 요청에 추가됨
4. **에러 처리**: 401 에러 시 자동 로그아웃 처리됨