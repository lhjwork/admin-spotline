# S3 이미지 업로드 API 명세서

## 개요

SpotLine Admin 시스템에서 매장 이미지 업로드를 위한 S3 연동 API 명세서입니다.

## 기본 정보

- **Base URL**: `http://localhost:4001/api`
- **인증 방식**: JWT Bearer Token
- **Content-Type**: `multipart/form-data` (업로드), `application/json` (기타)

## API 엔드포인트

### 1. 이미지 업로드

**POST** `/upload/image`

매장 이미지를 S3에 업로드합니다.

#### 요청

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data
```

**Body (Form Data):**
```
image: File (required) - 업로드할 이미지 파일
type: string (optional) - 이미지 타입 (기본값: "store")
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
  "message": "이미지가 성공적으로 업로드되었습니다.",
  "data": {
    "url": "https://spotline-bucket.s3.ap-northeast-2.amazonaws.com/stores/2024/01/20/uuid-filename.jpg",
    "key": "stores/2024/01/20/uuid-filename.jpg",
    "originalName": "store-image.jpg",
    "size": 1024000,
    "contentType": "image/jpeg"
  }
}
```

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

### 2. 이미지 삭제

**DELETE** `/upload/image/{imageKey}`

S3에서 이미지를 삭제합니다.

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

**실패 (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "IMAGE_NOT_FOUND",
    "message": "삭제할 이미지를 찾을 수 없습니다.",
    "details": {
      "imageKey": "stores/2024/01/20/uuid-filename.jpg"
    }
  }
}
```

## S3 버킷 구조

```
spotline-bucket/
├── stores/
│   ├── 2024/
│   │   ├── 01/
│   │   │   ├── 20/
│   │   │   │   ├── {uuid}-{filename}.jpg
│   │   │   │   └── {uuid}-{filename}.png
│   │   │   └── 21/
│   │   └── 02/
│   └── 2025/
├── recommendations/
└── temp/
```

## 파일명 규칙

- 형식: `{UUID}-{original-filename}.{extension}`
- UUID: 중복 방지를 위한 고유 식별자
- 원본 파일명: 특수문자 제거 및 소문자 변환
- 확장자: 원본 파일의 확장자 유지

## 에러 코드

| 코드 | 설명 | HTTP 상태 |
|------|------|-----------|
| `INVALID_FILE_FORMAT` | 지원하지 않는 파일 형식 | 400 |
| `FILE_TOO_LARGE` | 파일 크기 초과 | 413 |
| `UPLOAD_FAILED` | S3 업로드 실패 | 500 |
| `IMAGE_NOT_FOUND` | 이미지를 찾을 수 없음 | 404 |
| `DELETE_FAILED` | S3 삭제 실패 | 500 |
| `UNAUTHORIZED` | 인증 실패 | 401 |
| `FORBIDDEN` | 권한 없음 | 403 |

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

### 3. S3 설정
- 버킷 정책: 공개 읽기, 인증된 쓰기
- CORS 설정: Admin 도메인만 허용
- 버전 관리: 활성화 권장
- 수명 주기 정책: 임시 파일 자동 삭제

## 구현 예시 (Node.js + Express)

```javascript
const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// S3 설정
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Multer 설정
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다.'));
    }
  }
});

// 업로드 엔드포인트
app.post('/api/upload/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const type = req.body.type || 'store';
    
    // 파일명 생성
    const uuid = uuidv4();
    const extension = file.originalname.split('.').pop();
    const filename = `${uuid}-${file.originalname}`;
    
    // S3 키 생성
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const key = `${type}s/${year}/${month}/${day}/${filename}`;
    
    // S3 업로드
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };
    
    const result = await s3.upload(uploadParams).promise();
    
    res.json({
      success: true,
      message: '이미지가 성공적으로 업로드되었습니다.',
      data: {
        url: result.Location,
        key: result.Key,
        originalName: file.originalname,
        size: file.size,
        contentType: file.mimetype
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: '이미지 업로드에 실패했습니다.',
        details: error.message
      }
    });
  }
});
```

## 테스트 시나리오

### 1. 정상 업로드 테스트
```bash
curl -X POST http://localhost:4001/api/upload/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@test-image.jpg" \
  -F "type=store"
```

### 2. 파일 크기 초과 테스트
```bash
# 5MB 이상의 파일로 테스트
curl -X POST http://localhost:4001/api/upload/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@large-image.jpg"
```

### 3. 지원하지 않는 형식 테스트
```bash
curl -X POST http://localhost:4001/api/upload/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@test-file.gif"
```

### 4. 이미지 삭제 테스트
```bash
curl -X DELETE "http://localhost:4001/api/upload/image/stores%2F2024%2F01%2F20%2Fuuid-filename.jpg" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 모니터링 및 로깅

### 1. 로그 항목
- 업로드 요청 (사용자, 파일명, 크기)
- 업로드 성공/실패
- 삭제 요청 및 결과
- 에러 발생 시 상세 정보

### 2. 메트릭
- 업로드 성공률
- 평균 업로드 시간
- 파일 크기 분포
- 에러 발생 빈도

### 3. 알림
- 업로드 실패율 임계값 초과
- S3 용량 사용량 경고
- 비정상적인 업로드 패턴 감지

## 추가 고려사항

### 1. 성능 최적화
- 이미지 리사이징 (Lambda 함수 활용)
- CDN 연동 (CloudFront)
- 썸네일 자동 생성

### 2. 비용 최적화
- S3 Intelligent Tiering
- 오래된 파일 자동 아카이빙
- 중복 파일 제거

### 3. 백업 및 복구
- Cross-region 복제
- 정기적인 백업 검증
- 재해 복구 계획