# Spotline Admin

Spotline은 QR 기반 로컬 연결 서비스의 관리자 시스템입니다. 매장에서 QR 코드를 스캔하면 다음에 갈 만한 장소를 추천해주는 서비스를 관리할 수 있습니다.

## 🚀 빠른 시작

### 사전 요구사항
- Node.js >= 18.0.0
- npm 또는 yarn
- Kakao Developers 계정

### 설치 및 실행

1. **의존성 설치**
```bash
npm install
```

2. **환경 변수 설정**
```bash
cp .env.example .env
```

`.env` 파일에서 다음 값들을 설정하세요:
```env
VITE_API_URL=http://localhost:4000
VITE_KAKAO_REST_API_KEY=your-kakao-api-key
```

3. **Kakao API 설정**
- [Kakao Developers](https://developers.kakao.com/) 접속
- 애플리케이션 생성
- Web 플랫폼 추가: `http://localhost:3002`
- REST API 키 복사하여 환경 변수에 설정

4. **개발 서버 실행**
```bash
npm run dev
```

5. **접속**
- 어드민 페이지: http://localhost:3002
- 기본 로그인 정보:
  - 사용자명: `spotline-admin`
  - 비밀번호: `12341234`

## 🏗️ 주요 기능

### 매장 관리
- **Daum 주소 검색**: 정확한 주소 입력 및 좌표 자동 변환
- **매장 등록/수정**: 상세 정보 관리
- **상태 관리**: 활성화/비활성화 토글
- **검색 및 필터링**: 매장명, 주소, 카테고리별 필터

### 추천 관리
- **추천 관계 설정**: 매장 간 추천 관계 생성
- **우선순위 관리**: 추천 순서 조정
- **성과 추적**: 클릭률 및 전환율 모니터링

### 분석 대시보드
- **실시간 통계**: QR 스캔 수, 추천 클릭률
- **시각화**: 차트와 그래프
- **성과 분석**: 매장별, 기간별 분석

## 🛠️ 기술 스택

- **Frontend**: React 18 + Vite
- **Routing**: React Router DOM
- **State Management**: React Query
- **Forms**: React Hook Form
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Layout.jsx
│   ├── AddressSearch.jsx
│   └── StoreFormModal.jsx
├── pages/              # 페이지 컴포넌트
│   ├── Dashboard.jsx
│   ├── Stores.jsx
│   ├── Recommendations.jsx
│   ├── Analytics.jsx
│   └── Login.jsx
├── services/           # API 서비스
│   └── api.js
├── contexts/           # React Context
│   └── AuthContext.jsx
└── main.jsx           # 앱 진입점
```

## 🔧 개발 가이드

### 새로운 매장 등록 프로세스

1. **매장 관리** 페이지 접속
2. **새 매장 등록** 버튼 클릭
3. 기본 정보 입력 (매장명, 카테고리)
4. **주소 검색** 버튼으로 Daum 주소 검색
5. 자동 좌표 변환 및 지역 정보 입력
6. 추가 정보 입력 (연락처, 영업시간, 태그 등)
7. **등록** 버튼 클릭

### 주소 검색 기능

- **Daum 주소 검색 API**: 정확한 주소 입력
- **Kakao 좌표 변환 API**: 주소를 위도/경도로 자동 변환
- **지역 정보 자동 입력**: 선택된 주소에서 상권/구 정보 추출

## 🔐 환경 변수

```env
# API 서버 URL
VITE_API_URL=http://localhost:4000

# Kakao REST API 키
VITE_KAKAO_REST_API_KEY=your-kakao-api-key
```

## 📝 API 연동

백엔드 API와 연동하여 다음 기능들을 제공합니다:

- 매장 CRUD 작업
- 추천 관계 관리
- 분석 데이터 조회
- 사용자 인증 및 권한 관리

## 🚨 주의사항

### API 키 보안
- 환경 변수로 API 키 관리
- 프로덕션 환경에서는 도메인 제한 설정
- API 키 노출 방지

### 에러 처리
- 네트워크 오류 시 사용자 안내
- 좌표 변환 실패 시 수동 입력 옵션
- API 호출 제한 고려

## 🔧 트러블슈팅

### 주소 검색 팝업이 열리지 않는 경우
```javascript
// 스크립트 로드 확인
if (typeof window.daum === 'undefined') {
  console.error('Daum Postcode script not loaded')
}
```

### 좌표 변환 실패
```javascript
// API 키 확인
if (!import.meta.env.VITE_KAKAO_REST_API_KEY) {
  console.error('Kakao API key not found')
}
```

### CORS 오류
- Kakao Developers에서 도메인 설정 확인
- 개발 환경: `http://localhost:3002`
- 프로덕션 환경: 실제 도메인 등록

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해주세요.