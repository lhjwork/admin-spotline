# 메인 배너 이미지 업로드 API 명세서

## 개요

SpotLine Admin 시스템에서 매장 메인 배너 이미지 업로드를 위한 API 명세서입니다.

**✅ 업데이트 완료**: 백엔드 변경사항에 맞춰 프론트엔드가 완전히 업데이트되었습니다.

## 기본 정보

- **Base URL**: `http://localhost:4000`
- **인증 방식**: JWT Bearer Token
- **Content-Type**: `multipart/form-data` (업로드), `application/json` (기타)

## ⚠️ 중요 사항

**매장 ID 필수**: 이미지 업로드는 매장이 먼저 생성된 후에만 가능합니다. 새 매장 등록 시에는 다음 순서를 따라야 합니다:

1. 매장 기본 정보 저장 (POST `/api/admin/live/stores`)
2. 반환된 `storeId`로 이미지 업로드
3. 필요시 매장 정보 업데이트 (PUT `/api/admin/live/stores/{storeId}`)

**✅ 메인 배너 이미지 시스템 적용 완료**:
- ~~기존 `representativeImage` + `images`~~ → **새로운 `mainBannerImages` 배열**
- 최대 5개의 메인 배너 이미지 업로드 가능
- 이미지 추가 시 기존 이미지들 유지 (누적 업로드)
- 개별 이미지 삭제 가능
- 필드명은 `image` (단수형)를 사용합니다
- **대표 이미지/갤러리 구분 제거**: 모든 이미지가 메인 배너로 동일하게 처리됩니다

## API 엔드포인트

### 1. 메인 배너 이미지 업로드

**POST** `/api/admin/live/stores/{storeId}/main-banner-images`

매장의 메인 배너 이미지를 업로드합니다. 기존 이미지들은 유지되고 새 이미지가 추가됩니다.

#### 요청

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

**Path Parameters:**
- `storeId` (required): 매장 ID

**Body (Form Data):**
```
image: File (required) - 업로드할 이미지 파일
```

**파일 제한사항:**
- 지원 형식: JPG, PNG, WebP
- 최대 파일 크기: 5MB
- 파일명: 영문, 숫자, 하이픈, 언더스코어만 허용
- 최대 5개까지 업로드 가능

#### 응답

**성공 (200 OK):**
```json
{
  "success": true,
  "message": "메인 배너 이미지가 성공적으로 업로드되었습니다.",
  "data": {
    "url": "https://spotline-bucket.s3.ap-northeast-2.amazonaws.com/stores/main-banner/2024/01/20/uuid-filename.jpg",
    "key": "stores/main-banner/2024/01/20/uuid-filename.jpg",
    "originalName": "banner-image.jpg",
    "size": 1024000,
    "contentType": "image/jpeg"
  }
}
```

### 2. 메인 배너 이미지 삭제

**DELETE** `/api/admin/live/stores/{storeId}/main-banner-images/{imageKey}`

매장의 특정 메인 배너 이미지를 삭제합니다.

#### 요청

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Path Parameters:**
- `storeId` (required): 매장 ID
- `imageKey` (required): 삭제할 이미지의 S3 키 (URL 인코딩 필요)

#### 응답

**성공 (200 OK):**
```json
{
  "success": true,
  "message": "메인 배너 이미지가 성공적으로 삭제되었습니다."
}
```

### 3. 매장 정보 조회 (메인 배너 이미지 포함)

**GET** `/api/admin/live/stores/{storeId}`

매장의 모든 정보를 조회합니다 (메인 배너 이미지 배열 포함).

#### 요청

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Path Parameters:**
- `storeId` (required): 매장 ID

#### 응답

**성공 (200 OK):**
```json
{
  "success": true,
  "message": "매장 정보를 성공적으로 조회했습니다.",
  "data": {
    "_id": "store123",
    "name": "우드코티지",
    "category": "cafe",
    "mainBannerImages": [
      "stores/main-banner/2024/01/20/uuid-banner1.jpg",
      "stores/main-banner/2024/01/20/uuid-banner2.jpg",
      "stores/main-banner/2024/01/20/uuid-banner3.jpg"
    ],
    "location": {
      "address": "서울시 강남구 테헤란로 123",
      "coordinates": {
        "type": "Point",
        "coordinates": [127.0276, 37.4979]
      },
      "area": "강남구"
    }
  }
}
```

**이미지 URL 생성:**
```javascript
const S3_BASE_URL = 'https://lhj-spotline-assets-2026.s3.ap-northeast-2.amazonaws.com';

// 메인 배너 이미지 URLs
const mainBannerImageUrls = storeData.mainBannerImages?.map(imageKey => 
  `${S3_BASE_URL}/${imageKey}`
) || [];
```

## 호환성 라우트 (제거됨)

~~이전 버전에서 사용되던 다음 엔드포인트들은 제거되었습니다:~~
- ~~`POST /api/admin/live/stores/{storeId}/representative-image`~~ (deprecated)
- ~~`POST /api/admin/live/stores/{storeId}/images`~~ (deprecated)
- ~~`DELETE /api/admin/live/stores/{storeId}/representative-image`~~ (deprecated)
- ~~`DELETE /api/admin/live/images/{imageKey}`~~ (deprecated)

**현재 지원되는 엔드포인트만 사용하세요:**
- `POST /api/admin/live/stores/{storeId}/main-banner-images`
- `DELETE /api/admin/live/stores/{storeId}/main-banner-images/{imageKey}`

## 에러 응답

**실패 (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "지원하지 않는 파일 형식입니다.",
    "details": {
      "supportedFormats": ["image/jpeg", "image/png", "image/webp"],
      "receivedFormat": "image/gif"
    }
  }
}
```

**실패 (413 Payload Too Large):**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "파일 크기가 너무 큽니다.",
    "details": {
      "maxSize": "5MB",
      "receivedSize": "8MB"
    }
  }
}
```

**실패 (400 Bad Request - 이미지 개수 초과):**
```json
{
  "success": false,
  "error": {
    "code": "MAX_IMAGES_EXCEEDED",
    "message": "최대 이미지 개수를 초과했습니다.",
    "details": {
      "maxImages": 5,
      "currentImages": 5
    }
  }
}
```

## 에러 코드

| 코드 | 설명 | HTTP 상태 |
|------|------|-----------|
| `INVALID_FILE_FORMAT` | 지원하지 않는 파일 형식 | 400 |
| `FILE_TOO_LARGE` | 파일 크기 초과 | 413 |
| `MAX_IMAGES_EXCEEDED` | 최대 이미지 개수 초과 | 400 |
| `STORE_NOT_FOUND` | 매장을 찾을 수 없음 | 404 |
| `IMAGE_NOT_FOUND` | 이미지를 찾을 수 없음 | 404 |
| `UPLOAD_FAILED` | S3 업로드 실패 | 500 |
| `DELETE_FAILED` | S3 삭제 실패 | 500 |
| `UNAUTHORIZED` | 인증 실패 | 401 |
| `FORBIDDEN` | 권한 없음 | 403 |

## 클라이언트 사용 예시

### 메인 배너 이미지 업로드

```javascript
const uploadMainBannerImage = async (storeId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`/api/admin/live/stores/${storeId}/main-banner-images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: formData
  });
  
  return response.json();
};
```

### 메인 배너 이미지 삭제

```javascript
const deleteMainBannerImage = async (storeId, imageKey) => {
  const encodedImageKey = encodeURIComponent(imageKey);
  const response = await fetch(`/api/admin/live/stores/${storeId}/main-banner-images/${encodedImageKey}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  if (response.ok) {
    console.log('메인 배너 이미지가 삭제되었습니다.');
  }
  
  return response.json();
};
```

### 매장 정보 조회 (메인 배너 이미지 포함)

```javascript
const getStoreWithMainBannerImages = async (storeId) => {
  const response = await fetch(`/api/admin/live/stores/${storeId}`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  const storeData = await response.json();
  
  // 이미지 URL 생성
  const S3_BASE_URL = 'https://lhj-spotline-assets-2026.s3.ap-northeast-2.amazonaws.com';
  
  const mainBannerImageUrls = storeData.data.mainBannerImages?.map(imageKey => 
    `${S3_BASE_URL}/${imageKey}`
  ) || [];
  
  return {
    ...storeData.data,
    mainBannerImageUrls
  };
};
```

### 진행률과 함께 업로드

```javascript
const uploadWithProgress = (storeId, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('image', file);
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.data.url);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    
    xhr.open('POST', `/api/admin/live/stores/${storeId}/main-banner-images`);
    xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`);
    xhr.send(formData);
  });
};
```

## 테스트 시나리오

### 1. 메인 배너 이미지 업로드 테스트
```bash
curl -X POST http://localhost:4000/api/admin/live/stores/store123/main-banner-images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@banner-image.jpg"
```

### 2. 메인 배너 이미지 삭제 테스트
```bash
curl -X DELETE "http://localhost:4000/api/admin/live/stores/store123/main-banner-images/stores%2Fmain-banner%2F2024%2F01%2F20%2Fuuid-filename.jpg" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. 매장 정보 조회 테스트 (메인 배너 이미지 포함)
```bash
curl -X GET http://localhost:4000/api/admin/live/stores/store123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 보안 고려사항

### 1. 파일 검증
- MIME 타입 검증
- 파일 시그니처 검증 (매직 넘버)
- 파일 크기 제한
- 악성 코드 스캔 (선택사항)

### 2. 접근 제어
- JWT 토큰 검증
- 관리자 권한 확인
- Rate limiting (분당 최대 10회 업로드)
- 매장 소유권 확인

### 3. S3 설정
- 버킷 정책: 공개 읽기, 인증된 쓰기
- CORS 설정: Admin 도메인만 허용
- 버전 관리: 활성화 권장
- 수명 주기 정책: 임시 파일 자동 삭제