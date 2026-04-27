# curated-collections Plan

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | 크루가 큐레이션한 200-300개 Spot/SpotLine을 테마별로 묶어 보여줄 방법이 없어 콘텐츠 발견성이 낮고, Cold Start 전략 효과가 제한적 |
| **Solution** | Collection 엔티티(Backend) + 크루 컬렉션 관리 도구(Admin) + 피드/상세 페이지(Frontend) 3단 구현 |
| **Function/UX Effect** | 크루가 "성수동 카페 Top 10" 같은 컬렉션을 만들고, 유저가 피드에서 Featured 컬렉션 캐러셀을 탐색하며 상세 페이지에서 포함된 Spot/SpotLine을 한눈에 확인 |
| **Core Value** | 큐레이션 콘텐츠를 구조화하여 사용자 체류시간과 탐색 깊이를 높이고, 크루 생산성을 가시적 성과로 연결 |

## 1. Overview

### 1.1 Purpose
크루가 큐레이션한 Spot과 SpotLine을 테마별 컬렉션으로 묶어 관리하고, 유저에게 Featured 컬렉션으로 노출하는 시스템 구축.

### 1.2 Background
- Cold Start 전략: 런칭 전 200-300 Spot + 15-20 SpotLine (서울 주요 5개 지역)
- 현재: 개별 Spot/SpotLine 나열만 가능, 테마별 그룹화 불가
- 크루가 "성수동 맛집 Top 10", "주말 데이트 코스 모음" 등을 만들 수 없음
- Phase 2(크루 큐레이션) + Phase 4(피드/탐색) 완성의 핵심 누락 기능

### 1.3 Related Documents
- `front-spotLine/docs/01-plan/features/experience-social-platform.plan.md`
- `CLAUDE.md` — Phase 2, 4 정의

## 2. Scope

### 2.1 In Scope
- [x] Backend: Collection + CollectionItem 엔티티, CRUD API
- [x] Backend: 컬렉션 목록/상세 조회 API (페이지네이션, 필터)
- [x] Admin: 컬렉션 생성/편집/삭제 관리 페이지
- [x] Admin: 컬렉션에 Spot/SpotLine 추가/제거/순서 변경
- [x] Frontend: 피드 페이지 Featured 컬렉션 캐러셀 섹션
- [x] Frontend: 컬렉션 상세 페이지 (`/collection/[slug]`) with SSR + SEO
- [x] Frontend: 컬렉션 목록 페이지 (`/collections`)

### 2.2 Out of Scope
- 유저 개인 컬렉션 (별도 `user-collections` feature로 분리)
- 컬렉션 좋아요/저장 (Social 확장은 후속 feature)
- AI 기반 자동 컬렉션 생성
- 컬렉션 내 Spot/SpotLine 혼합 정렬 알고리즘

## 3. Requirements

### 3.1 Functional Requirements

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Collection 엔티티: title, slug, description, coverImageUrl, theme, area, isFeatured, isPublished, displayOrder | Must | Planned |
| FR-02 | CollectionItem 엔티티: collectionId + spotId OR spotLineId (다형적), itemOrder, itemNote | Must | Planned |
| FR-03 | Collection CRUD API: POST/PUT/DELETE /api/v2/collections | Must | Planned |
| FR-04 | Collection 목록 조회: GET /api/v2/collections?area=&theme=&featured=true&page=&size= | Must | Planned |
| FR-05 | Collection 상세 조회: GET /api/v2/collections/{slug} (items 포함) | Must | Planned |
| FR-06 | CollectionItem 관리 API: POST/PUT/DELETE /api/v2/collections/{slug}/items | Must | Planned |
| FR-07 | Admin 컬렉션 관리 페이지: 목록, 생성, 편집, 삭제 | Must | Planned |
| FR-08 | Admin 컬렉션 아이템 관리: Spot/SpotLine 검색 → 추가, 드래그 순서 변경, 메모 작성 | Must | Planned |
| FR-09 | Frontend 피드: Featured 컬렉션 가로 스크롤 캐러셀 (isFeatured=true, 최대 6개) | Must | Planned |
| FR-10 | Frontend /collection/[slug]: 컬렉션 상세 (커버 이미지, 설명, 아이템 카드 목록) SSR+SEO | Must | Planned |
| FR-11 | Frontend /collections: 전체 컬렉션 목록 (area/theme 필터) | Should | Planned |
| FR-12 | Collection viewsCount 증가 (상세 페이지 조회 시) | Should | Planned |

### 3.2 Non-Functional Requirements

- **Performance**: 컬렉션 목록 API 200ms 이내, 상세 API 300ms 이내
- **SEO**: /collection/[slug] 페이지 SSR + JSON-LD 구조화 데이터
- **Accessibility**: 캐러셀 키보드 탐색 지원

## 4. Success Criteria

### 4.1 Definition of Done
- [ ] Collection + CollectionItem 엔티티 및 마이그레이션 완료
- [ ] 6개 API 엔드포인트 작동 (Swagger 확인)
- [ ] Admin에서 컬렉션 CRUD + 아이템 관리 가능
- [ ] 피드 페이지에 Featured 컬렉션 캐러셀 표시
- [ ] /collection/[slug] SSR 렌더링 + SEO 메타데이터

### 4.2 Quality Criteria
- [ ] 빌드 에러 없음 (3개 레포 모두)
- [ ] Swagger UI에서 모든 API 테스트 가능
- [ ] 모바일/데스크톱 반응형 레이아웃

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CollectionItem이 Spot/SpotLine 둘 다 참조 → 쿼리 복잡도 | Medium | Medium | spotId/spotLineId nullable + JOIN FETCH로 해결, 프론트에서 타입 구분 |
| Admin에서 대량 아이템 순서 변경 성능 | Low | Low | 기존 dnd-kit 패턴 재활용, 벌크 순서 업데이트 API |
| 커버 이미지 관리 부담 | Medium | Low | 첫 Spot/SpotLine 이미지 자동 사용 옵션 제공 |

## 6. Architecture Considerations

### 6.1 Project Level
- **Dynamic** — Full-Stack (Backend + Admin + Frontend)

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| CollectionItem 참조 | 단일 테이블 (spotId+spotLineId nullable) vs 별도 테이블 | 단일 테이블 | SpotLineSpot 패턴과 유사, 간단한 구조 |
| 컬렉션 slug 생성 | 수동 입력 vs title 기반 자동 생성 | 자동 생성 (title slugify) | 크루 편의성, SpotLine과 동일 패턴 |
| 아이템 순서 관리 | itemOrder 컬럼 vs 배열 순서 | itemOrder 정수 컬럼 | DB 정렬 가능, 기존 SpotLineSpot.spotOrder 패턴 동일 |
| Featured 노출 | 별도 API vs 기존 목록 필터 | featured=true 파라미터 필터 | 추가 엔드포인트 불필요, 단순 |

### 6.3 데이터 모델

```
Collection
├── id (UUID, PK)
├── title (String, NOT NULL)
├── slug (String, UNIQUE)
├── description (String)
├── coverImageUrl (String, nullable)
├── theme (SpotLineTheme, nullable)
├── area (String, nullable)
├── isFeatured (Boolean, default false)
├── isPublished (Boolean, default true)
├── displayOrder (Integer, default 0)
├── viewsCount (Long, default 0)
├── itemCount (Integer, default 0)
├── createdBy (String — crew admin name)
├── createdAt (Timestamp)
├── updatedAt (Timestamp)
└── isActive (Boolean, default true)

CollectionItem
├── id (UUID, PK)
├── collection (ManyToOne → Collection)
├── spot (ManyToOne → Spot, nullable)
├── spotLine (ManyToOne → SpotLine, nullable)
├── itemOrder (Integer, NOT NULL)
├── itemNote (String, nullable — 크루 한줄 추천)
├── createdAt (Timestamp)
└── isActive (Boolean, default true)
```

### 6.4 API 엔드포인트

```
# Collection CRUD
POST   /api/v2/collections              — 생성
GET    /api/v2/collections              — 목록 (area, theme, featured, page, size)
GET    /api/v2/collections/{slug}        — 상세 (items 포함)
PUT    /api/v2/collections/{slug}        — 수정
DELETE /api/v2/collections/{slug}        — 삭제 (soft delete)

# CollectionItem 관리
POST   /api/v2/collections/{slug}/items       — 아이템 추가
PUT    /api/v2/collections/{slug}/items/order  — 순서 변경 (벌크)
DELETE /api/v2/collections/{slug}/items/{id}   — 아이템 제거
```

### 6.5 구현 순서

```
1. Backend: Collection + CollectionItem 엔티티/레포지토리
2. Backend: CollectionService + CollectionController (8 endpoints)
3. Admin: collectionAPI 서비스 + CollectionManagement 페이지
4. Admin: CollectionEditor (아이템 추가/순서/삭제)
5. Frontend: collectionAPI + /collections, /collection/[slug] 페이지
6. Frontend: 피드 Featured 컬렉션 캐러셀 컴포넌트
```

## 7. Convention Prerequisites

### 7.1 Existing Conventions (재활용)
- [x] Entity: Lombok @Builder, UUID PK, soft delete (isActive)
- [x] Controller: @RestController, Swagger @Operation, AuthUtil
- [x] Repository: JpaRepository + @Query
- [x] Admin: DataTable + useQuery + 300ms debounce search
- [x] Admin: dnd-kit 드래그 정렬 (SpotLineBuilder 참조)
- [x] Frontend: Axios api client (lib/api.ts), SSR metadata

### 7.2 New Conventions
- CollectionItem의 다형적 참조 (spotId OR spotLineId) — CHECK 제약조건으로 무결성 보장

## 8. Next Steps
- [ ] Design 문서 작성 (`/pdca design curated-collections`)
- [ ] 구현 시작 (`/pdca do curated-collections`)

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-27 | Initial plan | Claude |
