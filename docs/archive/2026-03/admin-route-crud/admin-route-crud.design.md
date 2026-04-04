# admin-route-crud Design

## 1. Backend API 설계 (springboot-spotLine-backend)

### 1.1 UpdateRouteRequest.java (신규)

```java
// dto/request/UpdateRouteRequest.java
@Data
public class UpdateRouteRequest {
    private String title;
    private String description;
    private RouteTheme theme;
    private String area;
    private List<CreateRouteRequest.SpotLineSpotRequest> spots; // null이면 spots 변경 안 함
}
```

- 모든 필드 optional (UpdateSpotRequest 패턴 준수)
- spots가 null이면 기존 spots 유지, non-null이면 전체 교체
- spots 교체 시 기존 SpotLineSpot `clear()` → 새로 추가 (orphanRemoval=true 활용)

### 1.2 RouteService.update() (추가)

```java
@Transactional
public RouteDetailResponse update(String slug, UpdateRouteRequest request) {
    Route route = getBySlug(slug);

    if (request.getTitle() != null) route.setTitle(request.getTitle());
    if (request.getDescription() != null) route.setDescription(request.getDescription());
    if (request.getTheme() != null) route.setTheme(request.getTheme());
    if (request.getArea() != null) route.setArea(request.getArea());

    if (request.getSpots() != null) {
        route.getSpots().clear(); // orphanRemoval 자동 삭제

        int totalDuration = 0;
        int totalDistance = 0;
        for (int i = 0; i < request.getSpots().size(); i++) {
            CreateRouteRequest.SpotLineSpotRequest spotReq = request.getSpots().get(i);
            Spot spot = spotRepository.findById(spotReq.getSpotId())
                .orElseThrow(() -> new ResourceNotFoundException("Spot", spotReq.getSpotId().toString()));

            SpotLineSpot routeSpot = SpotLineSpot.builder()
                .route(route)
                .spot(spot)
                .spotOrder(spotReq.getOrder() != null ? spotReq.getOrder() : i + 1)
                .suggestedTime(spotReq.getSuggestedTime())
                .stayDuration(spotReq.getStayDuration())
                .walkingTimeToNext(spotReq.getWalkingTimeToNext())
                .distanceToNext(spotReq.getDistanceToNext())
                .transitionNote(spotReq.getTransitionNote())
                .build();

            route.getSpots().add(routeSpot);
            if (spotReq.getStayDuration() != null) totalDuration += spotReq.getStayDuration();
            if (spotReq.getWalkingTimeToNext() != null) totalDuration += spotReq.getWalkingTimeToNext();
            if (spotReq.getDistanceToNext() != null) totalDistance += spotReq.getDistanceToNext();
        }
        route.setTotalDuration(totalDuration);
        route.setTotalDistance(totalDistance);
    }

    return RouteDetailResponse.from(routeRepository.save(route));
}
```

### 1.3 RouteService.delete() (추가)

```java
@Transactional
public void delete(String slug) {
    Route route = getBySlug(slug);
    route.setIsActive(false);
    routeRepository.save(route);
}
```

### 1.4 RouteController 엔드포인트 (추가)

```java
@PutMapping("/{slug}")
public ResponseEntity<RouteDetailResponse> update(
        @PathVariable String slug,
        @Valid @RequestBody UpdateRouteRequest request) {
    return ResponseEntity.ok(routeService.update(slug, request));
}

@DeleteMapping("/{slug}")
public ResponseEntity<Void> delete(@PathVariable String slug) {
    routeService.delete(slug);
    return ResponseEntity.noContent().build();
}
```

---

## 2. Admin Frontend 설계 (admin-spotLine)

### 2.1 routeAPI.ts 확장

```typescript
// 기존 routeAPI 객체에 추가
update: (slug: string, data: UpdateRouteRequest) =>
  apiClient.put<RouteDetailResponse>(`/api/v2/routes/${slug}`, data),

delete: (slug: string) =>
  apiClient.delete(`/api/v2/routes/${slug}`),
```

### 2.2 types/v2.ts 확장

```typescript
export interface UpdateRouteRequest {
  title?: string;
  description?: string;
  theme?: RouteTheme;
  area?: string;
  spots?: SpotLineSpotRequest[];
}
```

### 2.3 RouteDetailModal.tsx (신규)

- RouteManagement 목록에서 행 클릭 시 열리는 모달
- routeAPI.getBySlug()로 상세 조회
- 표시 내용: 제목, 테마, 지역, 설명, Spot 목록 (순서대로), 총 거리/시간, 생성자
- 하단 액션: "수정" 버튼 (RouteEditPage로 이동), "삭제" 버튼 (확인 다이얼로그)

```
┌─────────────────────────────────────┐
│ Route 상세                     [X]  │
│─────────────────────────────────────│
│ 제목: 성수동 카페 투어              │
│ 테마: 카페투어  지역: 성수          │
│ 설명: 성수동 인기 카페 ...          │
│                                     │
│ ┌─ Spots ────────────────────────┐  │
│ │ 1. 카페 온사이드 (성수)        │  │
│ │    체류 60분 → 도보 5분        │  │
│ │ 2. 대림창고 (성수)             │  │
│ │    체류 45분 → 도보 8분        │  │
│ │ 3. 할아버지 공장 (성수)        │  │
│ │    체류 40분                   │  │
│ └────────────────────────────────┘  │
│                                     │
│ 총 거리: 1.2km  소요시간: 158분     │
│ 좋아요: 12  저장: 5  복제: 3        │
│                                     │
│     [수정하기]          [삭제]      │
└─────────────────────────────────────┘
```

### 2.4 RouteBuilder.tsx 수정 — Edit Mode

기존 RouteBuilder를 확장하여 edit mode 지원:

**변경 사항:**
1. URL 파라미터 `slug`를 받으면 edit mode 활성화
2. edit mode 시 `routeAPI.getBySlug(slug)`로 기존 데이터 로드
3. form defaultValues를 기존 데이터로 설정
4. SpotLineSpotItem 목록을 기존 spots로 초기화
5. 저장 버튼 텍스트: "Route 수정" (create → update API 호출)
6. 페이지 제목: "Route 수정" (edit mode) / "Route 빌더" (create mode)

```typescript
// RouteBuilder.tsx 변경 핵심
interface RouteBuilderProps {
  // React Router params로 slug를 받음
}

// useParams()로 slug 확인
const { slug } = useParams<{ slug?: string }>();
const isEditMode = !!slug;

// edit mode: 기존 데이터 로드
const { data: existingRoute } = useQuery(
  ["route", slug],
  () => routeAPI.getBySlug(slug!),
  { enabled: isEditMode }
);

// 로드 완료 시 form + items 초기화
useEffect(() => {
  if (existingRoute) {
    reset({
      title: existingRoute.data.title,
      description: existingRoute.data.description ?? "",
      theme: existingRoute.data.theme,
      area: existingRoute.data.area,
    });
    setItems(existingRoute.data.spots.map(s => ({
      spot: s as SpotDetailResponse, // SpotLineSpotDetail → SpotDetailResponse 매핑
      meta: { spotId: s.spotId, order: s.order, ... }
    })));
  }
}, [existingRoute]);

// 저장: edit mode면 update, 아니면 create
const mutation = useMutation(
  isEditMode
    ? (data: UpdateRouteRequest) => routeAPI.update(slug!, data)
    : (data: CreateRouteRequest) => routeAPI.create(data),
  { onSuccess: () => navigate("/routes") }
);
```

### 2.5 RouteManagement.tsx 수정

기존 빈 액션 핸들러를 실제 기능으로 교체:

```typescript
actions={(row) => (
  <div className="py-1">
    <button onClick={() => setDetailSlug(row.slug)}>
      <Eye /> 상세 보기
    </button>
    <button onClick={() => navigate(`/routes/${row.slug}/edit`)}>
      <Pencil /> 수정
    </button>
    <button onClick={() => handleDelete(row.slug)}>
      <Trash2 /> 삭제
    </button>
  </div>
)}
```

삭제 시 확인 다이얼로그:
```typescript
const handleDelete = async (slug: string) => {
  if (!window.confirm("이 Route를 삭제하시겠습니까?")) return;
  await routeAPI.delete(slug);
  queryClient.invalidateQueries(["routes"]);
};
```

### 2.6 App.tsx 라우트 추가

```typescript
<Route path="/routes/:slug/edit" element={<RouteBuilder />} />
```

---

## 3. 구현 순서 및 체크리스트

| # | 작업 | 파일 | 레포 |
|---|------|------|------|
| 1 | UpdateRouteRequest DTO 생성 | `dto/request/UpdateRouteRequest.java` | backend |
| 2 | RouteService.update() 구현 | `service/RouteService.java` | backend |
| 3 | RouteService.delete() 구현 | `service/RouteService.java` | backend |
| 4 | RouteController PUT/DELETE 추가 | `controller/RouteController.java` | backend |
| 5 | UpdateRouteRequest 타입 추가 | `types/v2.ts` | admin |
| 6 | routeAPI update/delete 추가 | `services/v2/routeAPI.ts` | admin |
| 7 | RouteDetailModal 컴포넌트 생성 | `components/curation/RouteDetailModal.tsx` | admin |
| 8 | RouteBuilder edit mode 추가 | `pages/RouteBuilder.tsx` | admin |
| 9 | RouteManagement 액션 연결 | `pages/RouteManagement.tsx` | admin |
| 10 | App.tsx 라우트 추가 | `App.tsx` | admin |

---

## 4. SpotLineSpotDetail → SpotDetailResponse 매핑 주의

RouteDetailResponse의 spots는 `SpotLineSpotDetail` 타입:
```typescript
interface SpotLineSpotDetail {
  spotId: string;
  spotTitle: string;
  spotSlug: string;
  spotCategory: SpotCategory;
  spotArea: string;
  order: number;
  suggestedTime: string | null;
  stayDuration: number | null;
  walkingTimeToNext: number | null;
  distanceToNext: number | null;
  transitionNote: string | null;
}
```

RouteBuilder의 SpotLineSpotItem은 `SpotDetailResponse`를 요구하므로, edit mode에서 SpotLineSpotDetail을 SpotDetailResponse 형태로 매핑 필요:

```typescript
// 최소한의 매핑 — SpotLineSpotList에서 사용하는 필드만 충족
const toSpotDetail = (rs: SpotLineSpotDetail): SpotDetailResponse => ({
  id: rs.spotId,
  slug: rs.spotSlug,
  title: rs.spotTitle,
  category: rs.spotCategory,
  area: rs.spotArea,
  // 나머지 필드는 빈 값
  ...
});
```
