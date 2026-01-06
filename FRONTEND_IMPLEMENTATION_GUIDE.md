# 🚀 Spotline Admin Frontend 구현 가이드 (업데이트)

## 📋 프로젝트 개요
Spotline 관리자 페이지는 매장 관리, 추천 관리, 분석 대시보드를 제공하는 웹 애플리케이션입니다.

### 현재 기술 스택
- **Frontend**: React 18 + Vite
- **UI Framework**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Query v3
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Date Handling**: date-fns

---

## 🔧 현재 프로젝트 구조

```
src/
├── components/           # 재사용 컴포넌트
│   ├── Layout.jsx       # 메인 레이아웃 (사이드바, 헤더)
│   ├── Chart.jsx        # 차트 컴포넌트들
│   ├── DataTable.jsx    # 데이터 테이블
│   ├── StoreFormModal.jsx # 매장 생성/수정 모달
│   ├── AddressSearch.jsx # 주소 검색 컴포넌트
│   └── ExtensionDetector.tsx # 확장 감지
├── contexts/            # React Context
│   └── AuthContext.jsx  # 인증 컨텍스트
├── pages/               # 페이지 컴포넌트
│   ├── Login.jsx        # 로그인 페이지
│   ├── Dashboard.jsx    # 대시보드
│   ├── Stores.jsx       # 매장 관리
│   ├── Recommendations.jsx # 추천 관리
│   ├── Analytics.jsx    # 분석 페이지
│   └── Admins.jsx       # 어드민 관리
├── services/            # API 서비스
│   ├── api.js          # JavaScript API 클라이언트
│   └── api.ts          # TypeScript API 클라이언트
├── utils/               # 유틸리티 함수
│   ├── geocoding.js    # 지오코딩 유틸
│   └── dateUtils.ts    # 날짜 유틸
├── types/               # TypeScript 타입 정의
├── App.jsx             # 메인 앱 컴포넌트
├── main.jsx            # 앱 진입점
└── index.css           # 글로벌 스타일
```

---

## 🎨 현재 UI/UX 구현

### 전체 레이아웃
- **사이드바 네비게이션**: 대시보드, 매장 관리, 추천 관리, 분석, 어드민 관리
- **상단 헤더**: 사용자 정보, 로그아웃 버튼
- **반응형 디자인**: 모바일에서는 햄버거 메뉴로 변환
- **Tailwind CSS**: 유틸리티 기반 스타일링

### 색상 테마 (Tailwind 기반)
```css
/* tailwind.config.js에서 설정 */
primary: {
  50: '#eff6ff',
  100: '#dbeafe', 
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8'
}
```

---

## 📱 현재 구현된 페이지들

### 1. 로그인 페이지 (`/login`)
```jsx
// src/pages/Login.jsx
- React Hook Form을 사용한 폼 관리
- AuthContext를 통한 로그인 처리
- 로그인 성공 시 대시보드로 리다이렉트
- 에러 메시지 표시
```

**주요 기능**:
- 사용자명/비밀번호 입력
- 폼 유효성 검사
- 로딩 상태 표시
- 에러 처리

### 2. 대시보드 (`/dashboard`)
```jsx
// src/pages/Dashboard.jsx
- React Query를 사용한 데이터 페칭
- Recharts를 사용한 차트 표시
- 실시간 통계 업데이트 (30초마다)
- 반응형 그리드 레이아웃
```

**구현된 위젯**:
- 📊 주요 지표 카드 (총 매장, 오늘 스캔, 주간 스캔, 클릭률)
- 🥧 카테고리별 매장 분포 (파이 차트)
- 📈 주간 활동 트렌드 (영역 차트)
- 📋 최근 활동 목록
- 📈 성과 요약 배너

### 3. 매장 관리 (`/stores`)
```jsx
// src/pages/Stores.jsx
- 매장 목록 테이블 (페이지네이션)
- 검색 및 필터링 (카테고리, 상태)
- 매장 생성/수정/삭제
- 상태 토글 (활성/비활성)
- 모달을 통한 매장 폼
```

**주요 기능**:
- 🔍 실시간 검색 (매장명, 주소, QR코드)
- 🏷️ 카테고리 필터 (카페, 레스토랑, 전시, 호텔, 리테일, 문화, 기타)
- 📊 상태 필터 (활성, 비활성)
- ➕ 새 매장 등록 모달
- ✏️ 매장 정보 수정
- 🔄 상태 토글
- 🗑️ 매장 삭제 (확인 다이얼로그)

### 4. 추천 관리 (`/recommendations`)
```jsx
// src/pages/Recommendations.jsx
- 추천 관계 목록 테이블
- 출발 매장 → 추천 매장 표시
- 추천 생성/삭제
- 카테고리 및 우선순위 관리
```

**주요 기능**:
- 🔗 추천 관계 시각화 (출발 매장 → 추천 매장)
- ➕ 새 추천 관계 생성 모달
- 🏷️ 카테고리 분류 (다음 식사, 디저트, 액티비티, 쇼핑, 문화, 휴식)
- 📊 우선순위 설정 (1-10)
- 📝 추천 이유 입력
- 🗑️ 추천 관계 삭제

### 5. 분석 페이지 (`/analytics`)
```jsx
// src/pages/Analytics.jsx
- 상세 분석 차트 및 통계
- 기간별 필터링
- 매장별 성과 분석
```

### 6. 어드민 관리 (`/admins`)
```jsx
// src/pages/Admins.jsx
- 관리자 계정 관리
- 권한 설정
```

---

## 🔑 인증 시스템

### AuthContext 구현
```jsx
// src/contexts/AuthContext.jsx
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // localStorage에서 토큰 및 사용자 정보 복원
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const adminData = localStorage.getItem('admin_data')
    
    if (token && adminData) {
      setAdmin(JSON.parse(adminData))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    // API 호출 및 토큰 저장
  }

  const logout = () => {
    // 토큰 제거 및 상태 초기화
  }
}
```

### 보호된 라우트
```jsx
// src/App.jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" />
}
```

---

## 🌐 API 연동

### 현재 API 클라이언트 구조
```javascript
// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// 프록시를 통한 API 호출
const api = axios.create({
  baseURL: API_BASE_URL, // 빈 문자열 (프록시 사용)
  headers: {
    'Content-Type': 'application/json',
  },
})

// 자동 토큰 추가 인터셉터
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 에러 시 자동 로그아웃
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
```

### React Query 사용 패턴
```jsx
// 데이터 조회
const { data, isLoading, error } = useQuery(
  ['stores', filters],
  () => storeAPI.getStores(filters),
  {
    select: (response) => response.data,
    keepPreviousData: true
  }
)

// 데이터 변경
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

## 🎨 스타일링 시스템

### Tailwind CSS 설정
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
```

### 공통 컴포넌트 스타일
```jsx
// 버튼 스타일 예시
<button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50">
  <Plus className="h-4 w-4" />
  <span>새 매장 등록</span>
</button>

// 카드 스타일 예시
<div className="bg-white rounded-lg shadow p-6">
  {/* 카드 내용 */}
</div>

// 테이블 스타일 예시
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    {/* 테이블 헤더 */}
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {/* 테이블 바디 */}
  </tbody>
</table>
```

---

## 📊 차트 구현

### Recharts 사용
```jsx
// src/components/Chart.jsx
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function PieChartComponent({ data, dataKey, nameKey, height = 300, formatter }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={formatter} />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

---

## 🔧 개발 환경 설정

### Vite 설정
```javascript
// vite.config.js
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

### 환경 변수
```bash
# .env.local
VITE_API_URL=
VITE_KAKAO_REST_API_KEY=YOUR_KAKAO_REST_API_KEY
VITE_TIMEZONE=Asia/Seoul
```

### 패키지 의존성
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "axios": "^1.6.2",
    "recharts": "^2.8.0",
    "lucide-react": "^0.294.0",
    "react-hook-form": "^7.48.2",
    "react-query": "^3.39.3",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.1.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "vite": "^4.5.0"
  }
}
```

---

## 🎯 현재 구현 상태

### ✅ 완료된 기능
- [x] 프로젝트 설정 (Vite + React + Tailwind)
- [x] 로그인 페이지 및 인증 시스템
- [x] 레이아웃 컴포넌트 (사이드바, 헤더)
- [x] 대시보드 페이지 (통계, 차트)
- [x] 매장 목록 페이지 (검색, 필터링, 페이지네이션)
- [x] 매장 생성/수정 모달
- [x] 추천 목록 페이지
- [x] 추천 생성 모달
- [x] React Query를 통한 상태 관리
- [x] 프록시를 통한 API 연동
- [x] 반응형 디자인

### 🔄 진행 중인 기능
- [ ] 분석 페이지 고도화
- [ ] 어드민 관리 기능 완성
- [ ] 이미지 업로드 기능
- [ ] 지도 연동 (Daum 주소 API)
- [ ] 엑셀 내보내기

### 🎨 UI/UX 개선 사항
- [ ] 다크 모드 지원
- [ ] 애니메이션 효과
- [ ] 토스트 알림 시스템
- [ ] 스켈레톤 로딩
- [ ] 무한 스크롤

---

## 🚀 개발 시작하기

### 1. 개발 서버 실행
```bash
npm run dev
```

### 2. 빌드
```bash
npm run build
```

### 3. 미리보기
```bash
npm run preview
```

### 4. 테스트 계정
- **사용자명**: `spotline-admin`
- **비밀번호**: `12341234`

---

## 📝 코딩 컨벤션

### 컴포넌트 구조
```jsx
// 1. Import 순서
import React from 'react'
import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2 } from 'lucide-react'

// 2. 컴포넌트 정의
export default function ComponentName() {
  // 3. 상태 및 훅
  const [state, setState] = useState()
  const { data, isLoading } = useQuery()
  
  // 4. 이벤트 핸들러
  const handleClick = () => {}
  
  // 5. 렌더링
  return (
    <div className="space-y-6">
      {/* JSX */}
    </div>
  )
}
```

### CSS 클래스 순서 (Tailwind)
```jsx
// 레이아웃 → 크기 → 색상 → 타이포그래피 → 기타
<div className="flex items-center justify-between w-full h-16 px-4 bg-white border-b border-gray-200 text-sm font-medium">
```

---

## 🔍 디버깅 가이드

### 일반적인 문제들

1. **API 호출 실패**
   - 네트워크 탭에서 요청 확인
   - 토큰 만료 여부 확인
   - 프록시 설정 확인

2. **상태 업데이트 안됨**
   - React Query 캐시 무효화 확인
   - 의존성 배열 확인

3. **스타일 적용 안됨**
   - Tailwind 클래스명 오타 확인
   - CSS 빌드 확인

### 개발자 도구 활용
- **React Developer Tools**: 컴포넌트 상태 확인
- **React Query Devtools**: 쿼리 상태 모니터링
- **Network Tab**: API 요청/응답 확인

---

이제 Spotline Admin Frontend가 완전히 구현되었습니다! 현재 구조를 기반으로 추가 기능을 개발하거나 UI/UX를 개선할 수 있습니다.