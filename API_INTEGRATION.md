# Spotline Admin API 통합 가이드

## 🔄 API 변경사항 요약

### Base URL 변경

- **이전**: `http://localhost:4000`
- **현재**: `https://your-render-app.onrender.com`

### 응답 구조 표준화

모든 API 응답이 다음 형태로 표준화되었습니다:

```json
{
  "success": boolean,
  "message": string,
  "data": any
}
```

### 주요 엔드포인트 변경

#### 인증 API

- `POST /api/admin/login` - 관리자 로그인
- `GET /api/admin/profile` - 관리자 프로필 조회
- `GET /api/admin/verify` - 토큰 검증
- `POST /api/admin/create` - 관리자 계정 생성

#### 매장 관리 API

- `GET /api/stores` - 모든 매장 조회
- `POST /api/stores` - 매장 등록
- `PUT /api/stores/{id}` - 매장 수정
- `DELETE /api/stores/{id}` - 매장 삭제
- `GET /api/stores/{id}` - 특정 매장 조회
- `GET /api/stores/qr/{qrId}` - QR 코드로 매장 조회
- `GET /api/stores/nearby/{lat}/{lng}` - 근처 매장 검색

#### 추천 관리 API

- `POST /api/recommendations` - 추천 관계 생성
- `PUT /api/recommendations/{id}` - 추천 관계 수정
- `DELETE /api/recommendations/{id}` - 추천 관계 삭제
- `GET /api/recommendations/qr/{qrId}` - QR별 추천 조회
- `GET /api/recommendations/store/{storeId}` - 매장별 추천 조회

#### 분석 API (신규)

- `GET /api/analytics/qr/{qrId}` - QR 코드별 통계
- `GET /api/analytics/store/{storeId}` - 매장별 통계
- `GET /api/analytics/recommendations/performance` - 추천 성과 분석
- `GET /api/analytics/traffic/daily` - 일별 트래픽 통계
- `POST /api/analytics/event` - 이벤트 로깅

## 🔧 프론트엔드 변경사항

### 1. 타입 정의 업데이트

- `ApiResponse<T>` 인터페이스 추가
- `Store`, `Recommendation`, `Admin` 타입 구조 변경
- 새로운 분석 관련 타입 추가

### 2. API 서비스 완전 재작성

- 모든 API 호출이 새로운 엔드포인트 구조 반영
- 응답 데이터 구조 변경에 따른 처리 로직 수정
- 에러 처리 개선

### 3. 인증 시스템 강화

- 토큰 검증 기능 추가
- 자동 로그아웃 개선
- 관리자 프로필 조회 기능

## 🚀 사용 방법

### 환경 변수 설정

```env
VITE_API_URL=https://your-render-app.onrender.com
VITE_KAKAO_REST_API_KEY=YOUR_KAKAO_REST_API_KEY
```

### API 호출 예시

```typescript
import { storeAPI, authAPI, analyticsAPI } from "./services/api";

// 로그인
const loginResult = await authAPI.login("admin", "password");
if (loginResult.data.success) {
  const { admin, token } = loginResult.data.data;
  // 토큰 저장 및 상태 업데이트
}

// 매장 목록 조회
const storesResult = await storeAPI.getStores({ category: "cafe" });
if (storesResult.data.success) {
  const stores = storesResult.data.data;
  // 매장 목록 처리
}

// 분석 데이터 조회
const analyticsResult = await analyticsAPI.getQRAnalytics("qr_123");
if (analyticsResult.data.success) {
  const analytics = analyticsResult.data.data;
  // 분석 데이터 처리
}
```

## 🔒 보안 강화

### 1. 브라우저 확장 프로그램 감지

- `ExtensionDetector` 컴포넌트 추가
- 악성 스크립트 주입 감지 및 경고

### 2. Content Security Policy (CSP)

- 외부 스크립트 주입 차단
- 보안 헤더 추가

### 3. 토큰 검증

- 자동 토큰 유효성 검사
- 만료된 토큰 자동 처리

## 📊 새로운 기능

### 1. 실시간 분석 대시보드

- QR 코드별 상세 통계
- 매장별 성과 분석
- 추천 클릭률 분석
- 일별 트래픽 통계

### 2. 향상된 매장 관리

- 지오코딩 API 통합
- 근처 매장 검색
- 상세한 매장 정보 관리

### 3. 추천 시스템 개선

- 카테고리별 추천 관리
- 우선순위 기반 추천
- 성과 분석 기능

## 🐛 문제 해결

### 일반적인 문제

1. **401 Unauthorized**: 토큰이 만료되었거나 유효하지 않음
2. **CORS 에러**: API 서버의 CORS 설정 확인 필요
3. **네트워크 에러**: API 서버 상태 및 URL 확인

### 디버깅 팁

```typescript
// API 응답 로깅
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.data);
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data);
    return Promise.reject(error);
  }
);
```

## 📞 지원

API 통합 관련 문의사항이 있으시면 개발팀에 연락해주세요.
