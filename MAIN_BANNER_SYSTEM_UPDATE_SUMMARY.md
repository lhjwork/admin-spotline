# 메인 배너 이미지 시스템 업데이트 완료

## 📋 업데이트 개요

백엔드 API 변경사항에 맞춰 프론트엔드를 완전히 업데이트했습니다.

### 🔄 주요 변경사항

**이전 시스템:**
- `representativeImage` (대표 이미지 1개)
- `images` (갤러리 이미지 배열)
- 대표 이미지와 갤러리 이미지 구분

**새로운 시스템:**
- `mainBannerImages` (메인 배너 이미지 배열, 최대 5개)
- 모든 이미지가 동일한 메인 배너로 처리
- 대표/갤러리 구분 제거

## ✅ 업데이트된 파일들

### 1. 컴포넌트 업데이트

#### `src/components/ImageUpload.tsx`
- 대표 이미지 설정 기능 제거
- 메인 배너 이미지 순서 표시 추가
- 인터페이스 단순화 (representativeImageId, onRepresentativeChange 제거)
- 업로드 가이드 메시지 업데이트

#### `src/components/ExistingImageManager.tsx`
- 이미 메인 배너 시스템으로 구현되어 있음 (변경 없음)
- `mainBannerImages` 배열 처리
- S3 URL 생성 로직 유지

### 2. 페이지 업데이트

#### `src/pages/OperationalStores.tsx`
- `StoreFormData` 인터페이스 업데이트: `images` → `mainBannerImages`
- 폼 기본값 업데이트
- 이미지 변경 핸들러 단순화
- 폼 제출 로직 업데이트 (GeoJSON 좌표 변환 유지)
- ImageUpload 컴포넌트 props 단순화

### 3. 타입 정의 업데이트

#### `src/types/index.ts`
- `Store` 인터페이스에 `mainBannerImages?: string[]` 추가
- 기존 `images` 필드는 호환성을 위해 유지 (deprecated)

### 4. API 서비스 업데이트

#### `src/services/upload/s3UploadAPI.ts`
- 이미 메인 배너 시스템으로 구현되어 있음 (변경 없음)
- 호환성 메서드들이 새 API로 리다이렉트

### 5. 문서 업데이트

#### `S3_IMAGE_UPLOAD_API_SPEC.md`
- 업데이트 완료 상태 표시
- 메인 배너 시스템 적용 완료 안내

## 🔧 API 엔드포인트

### 현재 사용 중인 엔드포인트
- `POST /api/admin/live/stores/{storeId}/main-banner-images` - 메인 배너 이미지 업로드
- `DELETE /api/admin/live/stores/{storeId}/main-banner-images/{imageKey}` - 메인 배너 이미지 삭제
- `GET /api/admin/live/stores/{storeId}` - 매장 정보 조회 (mainBannerImages 포함)

### 제거된 엔드포인트 (deprecated)
- ~~`POST /api/admin/live/stores/{storeId}/representative-image`~~
- ~~`POST /api/admin/live/stores/{storeId}/images`~~
- ~~`DELETE /api/admin/live/stores/{storeId}/representative-image`~~
- ~~`DELETE /api/admin/live/images/{imageKey}`~~

## 🎯 사용자 경험 개선사항

### 1. 단순화된 이미지 관리
- 대표 이미지/갤러리 구분 제거로 사용자 혼란 감소
- 모든 이미지가 메인 배너로 동일하게 처리
- 이미지 순서 표시로 직관적인 관리

### 2. 일관된 업로드 플로우
- 매장 저장 → 이미지 업로드 → 자동 새로고침
- 최대 5개 이미지 제한 명확히 표시
- 업로드 진행률 표시 유지

### 3. 향상된 이미지 표시
- 기존 이미지 관리 컴포넌트에서 미리보기 및 삭제 기능
- S3 URL 자동 생성
- 이미지 순서 번호 표시

## 🧪 테스트 시나리오

### 1. 새 매장 등록
1. 매장 기본 정보 입력 및 저장
2. 수정 모드에서 메인 배너 이미지 업로드 (최대 5개)
3. 이미지 미리보기 및 삭제 테스트

### 2. 기존 매장 수정
1. 기존 매장의 mainBannerImages 배열 표시 확인
2. 새 이미지 추가 (기존 이미지 유지)
3. 개별 이미지 삭제 테스트

### 3. 호환성 테스트
1. 기존 images 필드가 있는 매장 데이터 처리
2. mainBannerImages로 자동 변환 확인

## 🚀 배포 준비사항

### 1. 백엔드 확인사항
- 새로운 API 엔드포인트 활성화 확인
- mainBannerImages 필드 스키마 적용 확인
- 기존 데이터 마이그레이션 완료 확인

### 2. 프론트엔드 확인사항
- 모든 컴포넌트 TypeScript 에러 해결 완료
- 이미지 업로드/삭제 기능 정상 작동 확인
- 매장 정보 새로고침 기능 확인

## 📝 추가 고려사항

### 1. 데이터 마이그레이션
- 기존 `representativeImage` + `images` → `mainBannerImages` 변환
- 백엔드에서 처리되어야 함

### 2. 캐시 무효화
- 이미지 업로드/삭제 후 매장 정보 쿼리 무효화
- React Query 캐시 관리 최적화

### 3. 에러 처리
- 이미지 업로드 실패 시 사용자 피드백
- 네트워크 오류 처리
- 파일 크기/형식 제한 안내

## 🎉 완료 상태

✅ **모든 업데이트 완료**: 백엔드 변경사항에 맞춰 프론트엔드가 완전히 업데이트되었습니다.

이제 새로운 메인 배너 이미지 시스템을 사용하여 매장 이미지를 관리할 수 있습니다.