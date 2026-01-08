# SpotLine Admin 백엔드 API 상태 확인 결과

## 🎯 테스트 결과 요약 (2026-01-09)

### ✅ 작동하는 API
- **로그인 API**: `/api/admin/login` - 정상 작동
- **매장 관리 API**: `/api/admin/stores` - 정상 작동 (4개 매장 데이터 존재)

### ❌ 구현되지 않은 API
- **데모 시스템 API**: `/api/admin/demo/*` - 404 Not Found
- **라이브 시스템 API**: `/api/admin/live/*` - 404 Not Found
- **시스템 관리 API**: `/api/admin/system/*` - 미확인

## 🔍 현재 상황 분석

### 1. 기존 매장 데이터 (4개)
현재 `/api/admin/stores`에서 반환되는 데이터는 모두 **데모용 매장**들입니다:

1. **홍대 북카페** (QR: `demo_bookcafe_001`)
2. **카페 스팟라인** (QR: `demo_cafe_001`) 
3. **디저트 하우스** (QR: `demo_dessert_001`)
4. **아트 갤러리 카페** (QR: `demo_gallery_001`)

모든 QR 코드가 `demo_` 접두사를 사용하고 있어 **데모 시스템용 데이터**임을 확인했습니다.

### 2. 프론트엔드 수정 방향

#### A. 데모 시스템 (`/demo`, `/demo-system`)
- **현재 문제**: 별도의 데모 API를 호출하려 하지만 해당 API가 없음
- **해결책**: 기존 `/api/admin/stores` 데이터를 데모 데이터로 사용
- **필터링**: QR 코드가 `demo_`로 시작하는 매장들만 표시

#### B. 운영 매장 관리 (`/operational-stores`, `/stores`)
- **현재 문제**: 같은 `/api/admin/stores` API를 호출해서 데모 데이터가 표시됨
- **해결책**: QR 코드가 `real_`로 시작하는 매장들만 표시 (현재는 0개)
- **빈 상태**: "등록된 운영 매장이 없습니다" 메시지 표시

#### C. 라이브 시스템 (`/live-system`)
- **현재 문제**: `/api/admin/live/*` API가 구현되지 않음
- **해결책**: 임시로 빈 상태 또는 "준비 중" 메시지 표시

## 🛠️ 즉시 적용할 수정사항

### 1. API 서비스 수정 (`src/services/api.ts`)
```typescript
// 데모 시스템 API - 기존 stores API 활용
export const demoAPI = {
  getDemoStores: () => 
    storeAPI.getStores().then(response => ({
      ...response,
      data: {
        ...response.data,
        data: {
          stores: response.data.data.stores.filter(store => 
            store.qrCode?.id?.startsWith('demo_')
          ),
          total: response.data.data.stores.filter(store => 
            store.qrCode?.id?.startsWith('demo_')
          ).length,
          system: 'demo'
        }
      }
    })),
  
  // 데모 추천은 임시 목 데이터 사용
  getDemoRecommendations: () => Promise.resolve({
    data: {
      success: true,
      data: {
        recommendations: [
          {
            id: "demo-rec-1",
            name: "달콤한 디저트 카페",
            shortDescription: "커피 후 달콤한 디저트는 어떠세요?",
            category: "dessert",
            distance: 150,
            walkingTime: 2,
            representativeImage: "https://images.unsplash.com/photo-1551024506-0bccd828d307"
          }
        ]
      }
    }
  }),
  
  // 데모 설정도 임시 목 데이터
  getDemoSettings: () => Promise.resolve({
    data: {
      success: true,
      data: {
        isEnabled: true,
        loadingSimulationMs: 500,
        version: "2.0",
        lastUpdated: new Date().toISOString()
      }
    }
  })
}

// 운영 매장 API - real_ 접두사 필터링
export const operationalStoreAPI = {
  getStores: (params = {}) => 
    storeAPI.getStores(params).then(response => ({
      ...response,
      data: {
        ...response.data,
        data: {
          stores: response.data.data.stores.filter(store => 
            store.qrCode?.id?.startsWith('real_')
          ),
          pagination: {
            ...response.data.data.pagination,
            count: response.data.data.stores.filter(store => 
              store.qrCode?.id?.startsWith('real_')
            ).length
          }
        }
      }
    })),
  
  // 나머지 메서드들은 기존 storeAPI 위임
  getStore: storeAPI.getStore,
  createStore: storeAPI.createStore,
  updateStore: storeAPI.updateStore,
  deleteStore: storeAPI.deleteStore,
  toggleStatus: storeAPI.toggleStatus
}
```

### 2. 라우팅 수정 (`src/App.tsx`)
```typescript
// /demo 라우트 추가 (이미 완료)
<Route path="demo" element={<DemoSystem />} />
<Route path="demo-system" element={<DemoSystem />} />
```

## 📋 백엔드 개발자 요청사항

### 즉시 필요한 API 구현
1. **데모 시스템 API**
   - `GET /api/admin/demo/stores` - 데모 매장 목록
   - `GET /api/admin/demo/recommendations` - 데모 추천 목록  
   - `GET /api/admin/demo/settings` - 데모 설정

2. **라이브 시스템 API**
   - `GET /api/admin/live/stores` - 실제 서비스 매장 목록
   - `GET /api/admin/live/analytics` - 라이브 분석 데이터

3. **시스템 관리 API**
   - `GET /api/admin/system/health` - 시스템 상태
   - `GET /api/admin/system/stats` - 통합 통계

### 데이터 분리 방안
- **현재**: 모든 매장이 `/api/admin/stores`에 혼재
- **제안**: 
  - 데모 매장: `demo_` 접두사 QR 코드
  - 운영 매장: `real_` 접두사 QR 코드
  - 또는 별도 테이블/컬렉션으로 분리

## ✅ 프론트엔드 임시 해결책 적용 완료

1. `/demo` 라우트 추가
2. 데모 시스템에서 `demo_` 접두사 매장만 표시
3. 운영 매장에서 `real_` 접두사 매장만 표시 (현재 0개 = 빈 상태)
4. 라이브 시스템은 "준비 중" 상태로 표시

이제 사용자가 `/demo`에 접근하면 4개의 데모 매장이 표시되고, `/operational-stores`에서는 "등록된 운영 매장이 없습니다" 메시지가 표시됩니다.

## 🔍 확인이 필요한 API 엔드포인트

### 1. 매장 관리 API (기존 시스템)
**현재 상황:** 아직 등록된 매장이 없어야 하는 상태
**기대 동작:** 빈 데이터 또는 적절한 빈 상태 응답

```bash
# 1-1. 매장 목록 조회
GET /api/admin/stores?page=1&limit=20
Authorization: Bearer {token}

# 기대 응답 (빈 상태):
{
  "success": true,
  "message": "매장 목록 조회 성공",
  "data": {
    "stores": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "count": 0,
      "total": 0
    }
  }
}
```

### 2. 데모 시스템 API (새로운 시스템)
**현재 상황:** 업주 소개용 데모 데이터가 미리 준비되어 있어야 함
**기대 동작:** 미리 준비된 데모 매장 데이터 반환

```bash
# 2-1. 데모 매장 목록 조회
GET /api/admin/demo/stores
Authorization: Bearer {token}

# 기대 응답 (데모 데이터 포함):
{
  "success": true,
  "message": "데모 매장 목록을 성공적으로 가져왔습니다.",
  "data": {
    "stores": [
      {
        "id": "demo-store-1",
        "name": "아늑한 카페 스토리",
        "shortDescription": "따뜻한 분위기의 동네 카페",
        "representativeImage": "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
        "category": "cafe",
        "location": {
          "address": "서울시 강남구 테헤란로 123",
          "coordinates": [127.0276, 37.4979]
        },
        "qrCode": {
          "id": "demo_cafe_001",
          "isActive": true
        }
      },
      {
        "id": "demo-store-2",
        "name": "모던 베이커리",
        "shortDescription": "신선한 빵과 디저트를 만나보세요",
        "representativeImage": "https://images.unsplash.com/photo-1509440159596-0249088772ff",
        "category": "bakery",
        "location": {
          "address": "서울시 홍대입구역 근처",
          "coordinates": [126.9240, 37.5563]
        },
        "qrCode": {
          "id": "demo_bakery_001",
          "isActive": true
        }
      }
    ],
    "total": 2,
    "system": "demo"
  }
}

# 2-2. 데모 추천 목록 조회
GET /api/admin/demo/recommendations
Authorization: Bearer {token}

# 기대 응답:
{
  "success": true,
  "message": "데모 추천 목록을 성공적으로 가져왔습니다.",
  "data": {
    "recommendations": [
      {
        "id": "demo-rec-1",
        "name": "달콤한 디저트 카페",
        "shortDescription": "커피 후 달콤한 디저트는 어떠세요?",
        "category": "dessert",
        "distance": 150,
        "walkingTime": 2,
        "representativeImage": "https://images.unsplash.com/photo-1551024506-0bccd828d307"
      },
      {
        "id": "demo-rec-2",
        "name": "조용한 독서 공간",
        "shortDescription": "책과 함께하는 여유로운 시간",
        "category": "culture",
        "distance": 200,
        "walkingTime": 3,
        "representativeImage": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570"
      }
    ]
  }
}

# 2-3. 데모 설정 조회
GET /api/admin/demo/settings
Authorization: Bearer {token}

# 기대 응답:
{
  "success": true,
  "message": "데모 시스템 설정을 성공적으로 가져왔습니다.",
  "data": {
    "isEnabled": true,
    "loadingSimulationMs": 500,
    "version": "2.0",
    "lastUpdated": "2026-01-09T10:00:00.000Z"
  }
}
```

### 3. 라이브 시스템 API
**현재 상황:** 실제 서비스 운영 매장 관리 (승인 대기 매장들이 있을 수 있음)

```bash
# 3-1. 라이브 매장 목록 조회
GET /api/admin/live/stores?page=1&limit=20
Authorization: Bearer {token}

# 기대 응답:
{
  "success": true,
  "message": "실제 매장 목록을 성공적으로 가져왔습니다.",
  "data": {
    "stores": [
      // 실제 업주들이 등록한 매장들 (승인 대기 상태일 수 있음)
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "pages": 1
    },
    "summary": {
      "total": 0,
      "active": 0,
      "pending": 0,
      "suspended": 0
    }
  }
}
```

## 🧪 테스트 방법

### cURL 테스트 명령어
```bash
# 1. 로그인하여 토큰 획득
TOKEN=$(curl -s -X POST "http://localhost:4000/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "spotline-admin", "password": "12341234"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. 매장 관리 API 테스트 (빈 상태 확인)
echo "=== 매장 관리 API 테스트 ==="
curl -X GET "http://localhost:4000/api/admin/stores?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

# 3. 데모 시스템 API 테스트 (데모 데이터 확인)
echo "=== 데모 매장 API 테스트 ==="
curl -X GET "http://localhost:4000/api/admin/demo/stores" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

echo "=== 데모 추천 API 테스트 ==="
curl -X GET "http://localhost:4000/api/admin/demo/recommendations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

echo "=== 데모 설정 API 테스트 ==="
curl -X GET "http://localhost:4000/api/admin/demo/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

# 4. 라이브 시스템 API 테스트
echo "=== 라이브 매장 API 테스트 ==="
curl -X GET "http://localhost:4000/api/admin/live/stores?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

## 🔧 백엔드에서 확인해야 할 사항

### 1. 데모 시스템 초기 데이터 설정
- [ ] 데모 매장 데이터가 미리 생성되어 있는가?
- [ ] 데모 추천 데이터가 미리 생성되어 있는가?
- [ ] 데모 설정이 올바르게 설정되어 있는가?

### 2. API 엔드포인트 구현 상태
- [ ] `/api/admin/stores` - 매장 관리 API 구현됨
- [ ] `/api/admin/demo/stores` - 데모 매장 API 구현됨
- [ ] `/api/admin/demo/recommendations` - 데모 추천 API 구현됨
- [ ] `/api/admin/demo/settings` - 데모 설정 API 구현됨
- [ ] `/api/admin/live/stores` - 라이브 매장 API 구현됨

### 3. 응답 형식 확인
- [ ] 모든 API가 `{success: boolean, message: string, data: any}` 형식으로 응답하는가?
- [ ] 페이지네이션이 올바르게 구현되어 있는가?
- [ ] 빈 데이터 상태에서도 올바른 응답을 반환하는가?

## 🚨 예상되는 문제점과 해결책

### 문제 1: 데모 데이터가 없는 경우
**증상:** 데모 시스템에서도 빈 화면이 나타남
**해결책:** 백엔드에서 데모용 초기 데이터를 생성해야 함

### 문제 2: API 엔드포인트가 구현되지 않은 경우
**증상:** 404 Not Found 오류 발생
**해결책:** 해당 엔드포인트를 백엔드에서 구현해야 함

### 문제 3: 응답 형식이 다른 경우
**증상:** 프론트엔드에서 데이터를 올바르게 파싱하지 못함
**해결책:** 백엔드 응답 형식을 문서와 일치하도록 수정

## 📞 백엔드 개발자에게 요청사항

1. **즉시 확인 필요:**
   - 위의 cURL 테스트를 실행하여 각 API의 현재 상태 확인
   - 응답 형식이 문서와 일치하는지 확인

2. **데모 데이터 준비:**
   - 데모 매장 2-3개 미리 생성
   - 데모 추천 4-5개 미리 생성
   - 데모 설정 기본값 설정

3. **API 구현 확인:**
   - 모든 엔드포인트가 올바르게 구현되어 있는지 확인
   - 에러 처리가 적절히 되어 있는지 확인

4. **응답 형식 통일:**
   - 모든 API가 일관된 응답 형식을 사용하는지 확인
   - 페이지네이션 형식이 일치하는지 확인

## 📋 체크리스트

- [ ] 매장 관리 API 테스트 완료
- [ ] 데모 시스템 API 테스트 완료
- [ ] 라이브 시스템 API 테스트 완료
- [ ] 데모 초기 데이터 확인 완료
- [ ] 응답 형식 일치 확인 완료
- [ ] 에러 처리 확인 완료

이 문서를 바탕으로 백엔드 상태를 확인하고 필요한 수정사항을 파악해주세요.