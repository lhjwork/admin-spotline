# 이미지 업로드 API 명세서

## 개요

SpotLine Admin 시스템에서 매장 이미지 업로드를 위한 API 명세서입니다.

## 기본 정보

- **Base URL**: `http://localhost:4000`
- **인증 방식**: JWT Bearer Token
- **Content-Type**: `multipart/form-data` (업로드), `application/json` (기타)

## API 엔드포인트

### 1. 대표 이미지 업로드

**POST** `/api/admin/stores/{storeId}/representative-image`

매장의 대표 이미지를 업로드합니다.

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

#### 응답

**성공 (200 OK):**
```json
{
  "success": true,
  "message": "대표 이미지가 성공적으로 업로드되었습니다.",
  "data": {
    "url": "https://spotline-bucket.s3.ap-northeast-2.amazonaws.com/stores/representative/2024/01/20/uuid-filename.jpg",
    "key": "stores/representative/2024/01/20/uuid-filename.jpg",
    "originalName": "store-image.jpg",
    "size": 1024000,
    "contentType": "image/jpeg"
  }
}
```

### 2. 갤러리 이미지 업로드

**POST** `/api/admin/stores/{storeId}/images`

매장의 갤러리 이미지를 업로드합니다.

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

#### 응답

**성공 (200 OK):**
```json
{
  "success": true,
  "message": "갤러리 이미지가 성공적으로 업로드되었습니다.",
  "data": {
    "url": "https://spotline-bucket.s3.ap-northeast-2.amazonaws.com/stores/gallery/2024/01/20/uuid-filename.jpg",
    "key": "stores/gallery/2024/01/20/uuid-filename.jpg",
    "originalName": "gallery-image.jpg",
    "size": 1024000,
    "contentType": "image/jpeg"
  }
}
```

### 3. 이미지 삭제

**DELETE** `/api/admin/images/{imageKey}`

업로드된 이미지를 삭제합니다.

#### 요청

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Parameters:**
- `imageKey` (path): S3 객체 키 (URL 인코딩 필요)

#### 응답

**성공 (200 OK):**
```json
{
  "success": true,
  "message": "이미지가 성공적으로 삭제되었습니다."
}
```

## 호환성 라우트 (선택사항)

백엔드에서 호환성을 위해 다음 라우트도 지원할 수 있습니다:

- `POST /api/upload/{storeId}/representative-image` → `POST /api/admin/stores/{storeId}/representative-image`
- `POST /api/upload/{storeId}/images` → `POST /api/admin/stores/{storeId}/images`

## S3 버킷 구조

```
spotline-bucket/
├── stores/
│   ├── representative/
│   │   ├── 2024/
│   │   │   ├── 01/
│   │   │   │   ├── 20/
│   │   │   │   │   ├── {uuid}-{filename}.jpg
│   │   │   │   │   └── {uuid}-{filename}.png
│   │   │   │   └── 21/
│   │   │   └── 02/
│   │   └── 2025/
│   └── gallery/
│       ├── 2024/
│       └── 2025/
└── temp/
```

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

**실패 (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "STORE_NOT_FOUND",
    "message": "매장을 찾을 수 없습니다.",
    "details": {
      "storeId": "store123"
    }
  }
}
```

## 에러 코드

| 코드 | 설명 | HTTP 상태 |
|------|------|-----------|
| `INVALID_FILE_FORMAT` | 지원하지 않는 파일 형식 | 400 |
| `FILE_TOO_LARGE` | 파일 크기 초과 | 413 |
| `STORE_NOT_FOUND` | 매장을 찾을 수 없음 | 404 |
| `UPLOAD_FAILED` | S3 업로드 실패 | 500 |
| `IMAGE_NOT_FOUND` | 이미지를 찾을 수 없음 | 404 |
| `DELETE_FAILED` | S3 삭제 실패 | 500 |
| `UNAUTHORIZED` | 인증 실패 | 401 |
| `FORBIDDEN` | 권한 없음 | 403 |

## 클라이언트 사용 예시

### 대표 이미지 업로드

```javascript
const uploadRepresentativeImage = async (storeId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`/api/admin/stores/${storeId}/representative-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: formData
  });
  
  return response.json();
};
```

### 갤러리 이미지 업로드

```javascript
const uploadGalleryImage = async (storeId, file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`/api/admin/stores/${storeId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: formData
  });
  
  return response.json();
};
```

### 진행률과 함께 업로드

```javascript
const uploadWithProgress = (storeId, file, onProgress, isRepresentative = true) => {
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
    
    const endpoint = isRepresentative 
      ? `/api/admin/stores/${storeId}/representative-image`
      : `/api/admin/stores/${storeId}/images`;
      
    xhr.open('POST', endpoint);
    xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`);
    xhr.send(formData);
  });
};
```

## 테스트 시나리오

### 1. 대표 이미지 업로드 테스트
```bash
curl -X POST http://localhost:4000/api/admin/stores/store123/representative-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@representative-image.jpg"
```

### 2. 갤러리 이미지 업로드 테스트
```bash
curl -X POST http://localhost:4000/api/admin/stores/store123/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@gallery-image.jpg"
```

### 3. 이미지 삭제 테스트
```bash
curl -X DELETE "http://localhost:4000/api/admin/images/stores%2Frepresentative%2F2024%2F01%2F20%2Fuuid-filename.jpg" \
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