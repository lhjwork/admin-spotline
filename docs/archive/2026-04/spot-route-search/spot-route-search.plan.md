# spot-route-search Plan

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | Spot/Route 관리 페이지에 드롭다운 필터(area, category/theme)만 존재하여, 크루가 제목/설명으로 콘텐츠를 빠르게 찾을 수 없음. 200~300개 Spot 목표에서 드롭다운만으로는 관리 불가 |
| **Solution** | Admin의 SpotManagement, RouteManagement에 키워드 텍스트 검색 추가 + Backend에 검색 API 엔드포인트 구현 |
| **Function/UX Effect** | 검색창에 키워드 입력 시 제목/crewNote 기반 실시간 필터링. 기존 area/category 드롭다운과 조합 가능 |
| **Core Value** | 런칭 전 200~300 Spot 큐레이션 워크플로우 속도 향상. 크루 운영 효율성 확보 |

---

## 1. 현황 분석

### 1.1 현재 구현 상태

**Admin Frontend (admin-spotLine)**

| 페이지 | 필터 | 텍스트 검색 |
|--------|------|-------------|
| SpotManagement | area 드롭다운 (20개) + category 드롭다운 (10개) | **없음** |
| RouteManagement | area 드롭다운 (20개) + theme 드롭다운 (7개) | **없음** |
| SpotCuration | Place API 텍스트 검색 (외부 API) | ✅ (Place API용) |

**Backend API (springboot-spotLine-backend)**

| 엔드포인트 | area | category/theme | sort | 텍스트 검색 |
|-----------|------|----------------|------|-------------|
| `GET /api/v2/spots` | ✅ LIKE | ✅ exact | ✅ POPULAR/NEWEST | **없음** |
| `GET /api/v2/routes/popular` | ✅ LIKE | ✅ exact | ✅ POPULAR/NEWEST | **없음** |

**Repository 쿼리**
- `SpotRepository`: area LIKE + category exact 조합 쿼리 존재. title/crewNote 검색 없음
- `RouteRepository`: area LIKE + theme exact 조합 쿼리 존재. title/description 검색 없음

### 1.2 핵심 문제

1. 크루가 "연남 브런치"를 찾으려면 → area "연남동" 선택 후 목록에서 눈으로 스캔해야 함
2. crewNote에 "분위기 좋은" 적은 Spot을 찾으려면 → 방법 없음
3. Route 제목으로 검색 불가 → 목록 전체를 페이지네이션하며 찾아야 함
4. 콘텐츠가 200개 이상 늘어나면 드롭다운 필터만으로 관리 불가능

---

## 2. 구현 범위

### 2.1 Backend — 검색 쿼리 추가

**레포**: springboot-spotLine-backend

**SpotRepository**: `keyword` 파라미터 추가
- `name LIKE %keyword%` OR `crewNote LIKE %keyword%` 조건
- 기존 area/category 필터와 조합 가능

**RouteRepository**: `keyword` 파라미터 추가
- `title LIKE %keyword%` OR `description LIKE %keyword%` 조건
- 기존 area/theme 필터와 조합 가능

**SpotController / RouteController**: `@RequestParam keyword` 추가

**SpotService / RouteService**: keyword 조건을 기존 필터 로직에 통합

### 2.2 Admin Frontend — 검색 UI

**레포**: admin-spotLine

**SpotManagement.tsx**:
- 기존 드롭다운 필터 상단에 텍스트 검색창 추가
- 디바운스 300ms 적용
- 기존 area/category 필터와 조합 가능
- 검색 시 페이지 1로 리셋

**RouteManagement.tsx**:
- 동일 패턴의 텍스트 검색창 추가
- 기존 area/theme 필터와 조합 가능

**API 서비스**:
- `spotAPI.ts` — `SpotListParams`에 `keyword` 추가
- `routeAPI.ts` — `RouteListParams`에 `keyword` 추가

---

## 3. 구현 순서

### Step 1: Backend — Repository 검색 쿼리 추가
- SpotRepository에 keyword 조건 쿼리 메서드 추가
- RouteRepository에 keyword 조건 쿼리 메서드 추가

### Step 2: Backend — Service 로직 확장
- SpotService: keyword 파라미터를 기존 필터 분기에 통합
- RouteService: keyword 파라미터를 기존 필터 분기에 통합

### Step 3: Backend — Controller 파라미터 추가
- SpotController: `@RequestParam(required = false) String keyword`
- RouteController: `@RequestParam(required = false) String keyword`

### Step 4: Admin — API 서비스 확장
- spotAPI.ts: `SpotListParams.keyword` 추가
- routeAPI.ts: `RouteListParams.keyword` 추가

### Step 5: Admin — UI 검색창 구현
- SpotManagement.tsx: 검색 input + 디바운스 + 필터 조합
- RouteManagement.tsx: 동일 패턴 적용

---

## 4. 영향 범위

### springboot-spotLine-backend (4~6개 파일)

| 파일 | 변경 |
|------|------|
| `SpotRepository.java` | keyword LIKE 쿼리 메서드 추가 |
| `RouteRepository.java` | keyword LIKE 쿼리 메서드 추가 |
| `SpotService.java` | keyword 파라미터 통합 |
| `RouteService.java` | keyword 파라미터 통합 |
| `SpotController.java` | keyword RequestParam 추가 |
| `RouteController.java` | keyword RequestParam 추가 |

### admin-spotLine (4개 파일)

| 파일 | 변경 |
|------|------|
| `src/services/v2/spotAPI.ts` | SpotListParams.keyword 추가 |
| `src/services/v2/routeAPI.ts` | RouteListParams.keyword 추가 |
| `src/pages/SpotManagement.tsx` | 검색 input UI + 디바운스 |
| `src/pages/RouteManagement.tsx` | 검색 input UI + 디바운스 |

---

## 5. 설계 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| 검색 방식 | SQL LIKE `%keyword%` | PostgreSQL full-text search는 현재 데이터 규모(200~300)에 과도함 |
| 디바운스 | 300ms | SpotCuration의 400ms 참고, 관리 도구이므로 조금 더 빠르게 |
| 검색 대상 (Spot) | name + crewNote | 크루가 관리하는 핵심 필드 |
| 검색 대상 (Route) | title + description | Route의 핵심 식별 필드 |
| 기존 필터와 관계 | AND 조합 | keyword + area + category 모두 적용 (교집합) |
| 최소 글자 수 | 없음 (1자부터 검색) | 관리 도구이므로 자유도 우선 |

---

## 6. 리스크 및 제약

| 리스크 | 대응 |
|--------|------|
| LIKE `%keyword%`는 인덱스를 활용 못함 | 현재 규모(200~300건)에서는 성능 문제 없음. 수천 건 이상 시 full-text search 전환 |
| 한글 검색 정확도 | PostgreSQL LIKE는 한글 부분 매칭 정상 지원 |
| 기존 쿼리 메서드 폭발 | keyword 조합으로 쿼리 수 증가 → Specification 패턴 또는 JPQL로 동적 쿼리 구성 권장 |

---

## 7. 완료 기준

- [ ] Spot 목록에서 키워드로 name/crewNote 검색 가능
- [ ] Route 목록에서 키워드로 title/description 검색 가능
- [ ] 키워드 + area + category/theme 드롭다운 동시 필터링 가능
- [ ] 검색 시 페이지네이션이 1페이지로 리셋됨
- [ ] 빈 키워드 시 기존 동작과 동일 (전체 목록)
- [ ] 기존 기능 (필터, 정렬, 페이지네이션) 영향 없음
