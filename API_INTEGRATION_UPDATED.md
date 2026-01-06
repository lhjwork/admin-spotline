# 🔐 Spotline Admin API 완전 가이드 (업데이트)

## 기본 정보
- **서버 URL**: `http://localhost:4000`
- **관리자 계정**: `spotline-admin` / `12341234`
- **프론트엔드**: `http://localhost:3002` (프록시 사용: `/api` 경로)

## 📋 목차
1. [인증 API](#인증-api)
2. [매장 관리 API](#매장-관리-api)
3. [추천 관리 API](#추천-관리-api)
4. [분석 및 통계 API](#분석-및-통계-api)
5. [응답 형식](#응답-형식)
6. [에러 코드](#에러-코드)

---

## 🔑 인증 API

### 1. 관리자 로그인
```http
POST /api/admin/login
```

**요청 본문**:
```json
{
  "username": "spotline-admin",
  "password": "12341234"
}
```

**성공 응답**:
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "admin": {
      "id": "695bad104e53e6bb484d0b35",
      "username": "spotline-admin",
      "email": "admin@spotline.co.kr",
      "role": "super_admin",
      "lastLogin": "2026-01-06T12:24:36.716Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

### 2. 관리자 프로필 조회
```http
GET /api/admin/profile
Authorization: Bearer {token}
```

### 3. 토큰 검증
```http
GET /api/admin/verify
Authorization: Bearer {token}
```

### 4. 관리자 계정 생성
```http
POST /api/admin/create
```

**요청 본문**:
```json
{
  "username": "new-admin",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

---

## 🏪 매장 관리 API

### 1. 매장 목록 조회
```http
GET /api/admin/stores?page=1&limit=20&search=&category=&status=
Authorization: Bearer {token}
```

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `search`: 검색어 (매장명, 주소, QR코드)
- `category`: 카테고리 필터 (`cafe`, `restaurant`, `exhibition`, `hotel`, `retail`, `culture`, `other`)
- `status`: 상태 필터 (`active`, `inactive`)

**성공 응답**:
```json
{
  "success": true,
  "message": "매장 목록 조회 성공",
  "data": {
    "stores": [
      {
        "_id": "store_id",
        "name": "스타벅스 강남점",
        "category": "cafe",
        "location": {
          "address": "서울시 강남구 테헤란로 123",
          "coordinates": {
            "lat": 37.5665,
            "lng": 126.9780
          }
        },
        "phone": "02-1234-5678",
        "description": "강남역 근처 스타벅스",
        "operatingHours": {
          "monday": { "open": "07:00", "close": "22:00" },
          "tuesday": { "open": "07:00", "close": "22:00" }
        },
        "images": ["image1.jpg", "image2.jpg"],
        "qrCode": {
          "id": "QR123456",
          "url": "https://spotline.co.kr/qr/QR123456"
        },
        "stats": {
          "monthlyScans": 1250,
          "weeklyScans": 320,
          "todayScans": 45
        },
        "isActive": true,
        "createdAt": "2026-01-06T12:00:00.000Z",
        "updatedAt": "2026-01-06T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "count": 50,
      "total": 3
    }
  }
}
```

### 2. 매장 상세 조회
```http
GET /api/admin/stores/{id}
Authorization: Bearer {token}
```

### 3. 매장 생성
```http
POST /api/admin/stores
Authorization: Bearer {token}
```

**요청 본문**:
```json
{
  "name": "새로운 카페",
  "category": "cafe",
  "location": {
    "address": "서울시 강남구 테헤란로 456",
    "coordinates": {
      "lat": 37.5665,
      "lng": 126.9780
    }
  },
  "phone": "02-9876-5432",
  "description": "새로 오픈한 카페입니다",
  "operatingHours": {
    "monday": { "open": "08:00", "close": "22:00" },
    "tuesday": { "open": "08:00", "close": "22:00" },
    "wednesday": { "open": "08:00", "close": "22:00" },
    "thursday": { "open": "08:00", "close": "22:00" },
    "friday": { "open": "08:00", "close": "23:00" },
    "saturday": { "open": "09:00", "close": "23:00" },
    "sunday": { "open": "09:00", "close": "21:00" }
  },
  "images": ["cafe1.jpg", "cafe2.jpg"]
}
```

### 4. 매장 수정
```http
PUT /api/admin/stores/{id}
Authorization: Bearer {token}
```

### 5. 매장 상태 토글
```http
PATCH /api/admin/stores/{id}/status
Authorization: Bearer {token}
```

**요청 본문**:
```json
{
  "isActive": false
}
```

### 6. 매장 삭제
```http
DELETE /api/admin/stores/{id}
Authorization: Bearer {token}
```

---

## 🎯 추천 관리 API

### 1. 추천 목록 조회
```http
GET /api/admin/recommendations?page=1&limit=20&fromStore=&toStore=
Authorization: Bearer {token}
```

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `fromStore`: 출발 매장 ID
- `toStore`: 도착 매장 ID

**성공 응답**:
```json
{
  "success": true,
  "message": "추천 목록 조회 성공",
  "data": {
    "recommendations": [
      {
        "_id": "recommendation_id",
        "fromStore": {
          "_id": "store1_id",
          "name": "스타벅스 강남점",
          "category": "cafe"
        },
        "toStore": {
          "_id": "store2_id",
          "name": "교보문고 강남점",
          "category": "culture"
        },
        "category": "culture",
        "priority": 5,
        "description": "커피 후 독서하기 좋은 곳",
        "tags": ["독서", "조용한", "가까운"],
        "isActive": true,
        "createdAt": "2026-01-06T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "count": 25,
      "total": 2
    }
  }
}
```

### 2. 추천 생성
```http
POST /api/admin/recommendations
Authorization: Bearer {token}
```

**요청 본문**:
```json
{
  "fromStore": "store1_id",
  "toStore": "store2_id",
  "category": "dessert",
  "priority": 5,
  "description": "커피 후 달콤한 디저트는 어떠세요?",
  "tags": ["디저트", "가까운", "추천"]
}
```

**카테고리 옵션**:
- `next_meal`: 다음 식사
- `dessert`: 디저트
- `activity`: 액티비티
- `shopping`: 쇼핑
- `culture`: 문화
- `rest`: 휴식

### 3. 추천 수정
```http
PUT /api/admin/recommendations/{id}
Authorization: Bearer {token}
```

### 4. 추천 삭제
```http
DELETE /api/admin/recommendations/{id}
Authorization: Bearer {token}
```

---

## 📊 분석 및 통계 API

### 1. 대시보드 통계 조회
```http
GET /api/admin/dashboard/stats
Authorization: Bearer {token}
```

**성공 응답**:
```json
{
  "success": true,
  "message": "대시보드 통계 조회 성공",
  "data": {
    "overview": {
      "totalStores": 150,
      "totalInactiveStores": 8,
      "todayScans": 1250,
      "weeklyScans": 8750,
      "monthlyScans": 35000,
      "scanGrowth": "+12.5",
      "clickThroughRate": "8.5"
    },
    "storesByCategory": [
      {
        "_id": "cafe",
        "count": 45
      },
      {
        "_id": "restaurant", 
        "count": 38
      },
      {
        "_id": "culture",
        "count": 25
      }
    ],
    "recentActivity": [
      {
        "id": "activity_id",
        "type": "qr_scan",
        "store": "스타벅스 강남점",
        "targetStore": null,
        "timestamp": "2026-01-06T12:00:00.000Z"
      },
      {
        "id": "activity_id2",
        "type": "recommendation_click",
        "store": "스타벅스 강남점",
        "targetStore": "교보문고 강남점",
        "timestamp": "2026-01-06T11:55:00.000Z"
      }
    ]
  }
}
```

### 2. 매장별 통계 조회
```http
GET /api/admin/analytics/stores?storeId=&period=month
Authorization: Bearer {token}
```

**쿼리 파라미터**:
- `storeId`: 특정 매장 ID (선택사항)
- `period`: 통계 기간 (`day`, `week`, `month`, `year`)

---

## 📝 응답 형식

### 성공 응답
```json
{
  "success": true,
  "message": "작업 성공 메시지",
  "data": { /* 응답 데이터 */ }
}
```

### 실패 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "data": null,
  "status": 400
}
```

---

## ⚠️ 에러 코드

| 상태 코드 | 설명 |
|-----------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스를 찾을 수 없음 |
| 409 | 중복 데이터 |
| 500 | 서버 내부 오류 |

---

## 🔧 프론트엔드 사용 예시

### 현재 구현된 API 클라이언트 구조

```javascript
// src/services/api.js
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Axios 인스턴스 생성 (프록시 사용)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 401 에러 시 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_data')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 인증 API (프록시 사용)
export const authAPI = {
  login: (username, password) => 
    axios.post('/api/admin/login', { username, password }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    }),
}

// 대시보드 API
export const dashboardAPI = {
  getStats: () => api.get('/api/admin/dashboard/stats'),
}

// 매장 관리 API
export const storeAPI = {
  getStores: (params) => api.get('/api/admin/stores', { params }),
  getStore: (id) => api.get(`/api/admin/stores/${id}`),
  createStore: (data) => api.post('/api/admin/stores', data),
  updateStore: (id, data) => api.put(`/api/admin/stores/${id}`, data),
  toggleStatus: (id, isActive) => api.patch(`/api/admin/stores/${id}/status`, { isActive }),
  deleteStore: (id) => api.delete(`/api/admin/stores/${id}`),
}

// 추천 관리 API
export const recommendationAPI = {
  getRecommendations: (params) => api.get('/api/admin/recommendations', { params }),
  createRecommendation: (data) => api.post('/api/admin/recommendations', data),
  updateRecommendation: (id, data) => api.put(`/api/admin/recommendations/${id}`, data),
  deleteRecommendation: (id) => api.delete(`/api/admin/recommendations/${id}`),
}
```

### 사용 예시

```javascript
// 로그인
const loginResponse = await authAPI.login('spotline-admin', '12341234');
if (loginResponse.data.success) {
  localStorage.setItem('admin_token', loginResponse.data.data.token);
}

// 매장 목록 조회 (React Query 사용)
const { data: stores } = useQuery(
  ['stores', filters],
  () => storeAPI.getStores(filters),
  {
    select: (response) => response.data,
    keepPreviousData: true
  }
)

// 매장 생성 (React Query Mutation 사용)
const createMutation = useMutation(
  (data) => storeAPI.createStore(data),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['stores'])
    }
  }
)
```

---

## 🚀 테스트 방법

### cURL 테스트
```bash
# 로그인
curl -X POST http://localhost:4000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "spotline-admin", "password": "12341234"}'

# 매장 목록 조회 (토큰 필요)
curl -X GET "http://localhost:4000/api/admin/stores?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 프록시 설정 (vite.config.js)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})
```

### 환경 변수 (.env.local)
```bash
VITE_API_URL=
VITE_KAKAO_REST_API_KEY=YOUR_KAKAO_REST_API_KEY
VITE_TIMEZONE=Asia/Seoul
```

---

## 🎯 현재 구현 상태

### ✅ 완료된 기능
- 로그인/로그아웃 시스템
- 대시보드 (통계, 차트, 최근 활동)
- 매장 관리 (목록, 생성, 수정, 삭제, 상태 토글)
- 추천 관리 (목록, 생성, 삭제)
- 페이지네이션 및 필터링
- 반응형 레이아웃
- React Query를 통한 상태 관리
- 프록시를 통한 API 연동

### 🔄 진행 중인 기능
- 분석 페이지 고도화
- 어드민 관리 기능
- 이미지 업로드
- 지도 연동

### 📦 사용된 기술 스택
- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **State Management**: React Query v3
- **UI**: Tailwind CSS + Lucide React Icons
- **Forms**: React Hook Form
- **Charts**: Recharts
- **HTTP Client**: Axios

---

이제 모든 Admin API가 실제 구현과 일치하도록 문서화되었습니다! 프론트엔드에서 위 엔드포인트들을 사용하여 매장 관리, 추천 관리, 통계 조회 등을 할 수 있습니다.