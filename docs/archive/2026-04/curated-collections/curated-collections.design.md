# curated-collections — Design Document

> Feature: `curated-collections`
> Plan: `docs/01-plan/features/curated-collections.plan.md`
> Created: 2026-04-27
> Status: Design

## Executive Summary

| Perspective | Description |
|-------------|-------------|
| **Problem** | 크루가 큐레이션한 200-300개 Spot/SpotLine을 테마별로 묶어 보여줄 방법이 없어 콘텐츠 발견성이 낮고, Cold Start 전략 효과가 제한적 |
| **Solution** | Collection + CollectionItem 엔티티(Backend) + 크루 컬렉션 관리 도구(Admin) + 피드 캐러셀/상세 페이지(Frontend) 3단 구현 |
| **Function UX Effect** | 크루가 "성수동 카페 Top 10" 같은 컬렉션을 만들고, 유저가 피드에서 Featured 캐러셀을 탐색하며 상세 페이지에서 Spot/SpotLine을 한눈에 확인 |
| **Core Value** | 큐레이션 콘텐츠를 구조화하여 사용자 체류시간과 탐색 깊이를 높이고, 크루 생산성을 가시적 성과로 연결 |

---

## 1. Design Items Overview

| # | Design Item | Repo | FR | Type | Files |
|---|-------------|------|----|------|-------|
| DI-01 | Collection Entity | backend | FR-01 | NEW | `Collection.java` |
| DI-02 | CollectionItem Entity | backend | FR-02 | NEW | `CollectionItem.java` |
| DI-03 | Collection Repository | backend | FR-01,02 | NEW | `CollectionRepository.java`, `CollectionItemRepository.java` |
| DI-04 | Collection DTOs | backend | FR-03~06 | NEW | 4 Request/Response DTOs |
| DI-05 | CollectionService | backend | FR-03~06,12 | NEW | `CollectionService.java` |
| DI-06 | CollectionController | backend | FR-03~06 | NEW | `CollectionController.java` |
| DI-07 | collectionAPI Service | admin | FR-07,08 | NEW | `collectionAPI.ts` |
| DI-08 | CollectionManagement Page | admin | FR-07 | NEW | `CollectionManagement.tsx` |
| DI-09 | CollectionEditor Page | admin | FR-08 | NEW | `CollectionEditor.tsx` |
| DI-10 | Admin Navigation + Routes | admin | FR-07 | MODIFY | `Layout.tsx`, `App.tsx` |
| DI-11 | Frontend Collection Types | frontend | FR-09~11 | NEW | `types/index.ts` (MODIFY) |
| DI-12 | Frontend collectionAPI | frontend | FR-09~11 | NEW | `lib/collectionApi.ts` |
| DI-13 | Collection Detail Page | frontend | FR-10 | NEW | `collection/[slug]/page.tsx` |
| DI-14 | Collections List Page | frontend | FR-11 | NEW | `collections/page.tsx` |
| DI-15 | Feed Featured Carousel | frontend | FR-09 | NEW | `FeedCollectionSection.tsx` (MODIFY `FeedPage.tsx`) |

---

## 2. DI-01: Collection Entity

**File**: `springboot-spotLine-backend/src/main/java/com/spotline/api/domain/entity/Collection.java`

```java
@Entity
@Table(name = "collections", indexes = {
    @Index(name = "idx_collection_slug", columnList = "slug", unique = true),
    @Index(name = "idx_collection_area", columnList = "area"),
    @Index(name = "idx_collection_theme", columnList = "theme"),
    @Index(name = "idx_collection_featured", columnList = "isFeatured"),
    @Index(name = "idx_collection_active", columnList = "isActive")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Collection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String coverImageUrl;

    @Enumerated(EnumType.STRING)
    private SpotLineTheme theme;     // nullable — reuses existing enum

    private String area;             // nullable — e.g. "성수", "연남"

    @Builder.Default
    private Boolean isFeatured = false;

    @Builder.Default
    private Boolean isPublished = true;

    @Builder.Default
    private Integer displayOrder = 0;

    @Builder.Default
    private Long viewsCount = 0L;

    @Builder.Default
    private Integer itemCount = 0;

    private String createdBy;        // crew admin name

    @OneToMany(mappedBy = "collection", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("itemOrder ASC")
    @Builder.Default
    private List<CollectionItem> items = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Builder.Default
    private Boolean isActive = true;
}
```

**Rationale**: SpotLine.java 패턴 동일 — UUID PK, @Builder.Default, soft delete, @Index, @CreationTimestamp/@UpdateTimestamp.

---

## 3. DI-02: CollectionItem Entity

**File**: `springboot-spotLine-backend/src/main/java/com/spotline/api/domain/entity/CollectionItem.java`

```java
@Entity
@Table(name = "collection_items", indexes = {
    @Index(name = "idx_ci_collection_id", columnList = "collection_id"),
    @Index(name = "idx_ci_spot_id", columnList = "spot_id"),
    @Index(name = "idx_ci_spotline_id", columnList = "spot_line_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CollectionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collection_id", nullable = false)
    private Collection collection;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spot_id")
    private Spot spot;               // nullable — polymorphic

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spot_line_id")
    private SpotLine spotLine;       // nullable — polymorphic

    @Column(nullable = false)
    private Integer itemOrder;

    private String itemNote;         // crew 한줄 추천

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Builder.Default
    private Boolean isActive = true;
}
```

**DB 제약조건** (migration SQL):
```sql
ALTER TABLE collection_items ADD CONSTRAINT chk_ci_item_type
  CHECK ((spot_id IS NOT NULL AND spot_line_id IS NULL)
      OR (spot_id IS NULL AND spot_line_id IS NOT NULL));
```

---

## 4. DI-03: Repositories

**File**: `CollectionRepository.java`
```java
public interface CollectionRepository extends JpaRepository<Collection, UUID> {

    Optional<Collection> findBySlugAndIsActiveTrue(String slug);

    boolean existsBySlug(String slug);

    // Featured collections (피드 캐러셀)
    List<Collection> findByIsFeaturedTrueAndIsPublishedTrueAndIsActiveTrueOrderByDisplayOrderAsc();

    // 목록 (area + theme 필터)
    Page<Collection> findByIsPublishedTrueAndIsActiveTrueOrderByDisplayOrderAsc(Pageable pageable);

    @Query("SELECT c FROM Collection c WHERE c.isPublished = true AND c.isActive = true " +
           "AND (:area IS NULL OR c.area LIKE %:area%) " +
           "AND (:theme IS NULL OR c.theme = :theme) " +
           "ORDER BY c.displayOrder ASC")
    Page<Collection> findByFilters(@Param("area") String area,
                                   @Param("theme") SpotLineTheme theme,
                                   Pageable pageable);

    // Admin: all collections including unpublished
    Page<Collection> findByIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT c FROM Collection c WHERE c.isActive = true " +
           "AND (:keyword IS NULL OR c.title LIKE %:keyword%) " +
           "ORDER BY c.createdAt DESC")
    Page<Collection> findByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
```

**File**: `CollectionItemRepository.java`
```java
public interface CollectionItemRepository extends JpaRepository<CollectionItem, UUID> {

    List<CollectionItem> findByCollectionIdAndIsActiveTrueOrderByItemOrderAsc(UUID collectionId);

    void deleteByCollectionIdAndId(UUID collectionId, UUID itemId);
}
```

---

## 5. DI-04: DTOs

### Request DTOs

**`CreateCollectionRequest.java`**:
```java
@Data
@Schema(description = "컬렉션 생성 요청")
public class CreateCollectionRequest {
    @NotBlank private String title;
    private String description;
    private String coverImageUrl;
    private SpotLineTheme theme;
    private String area;
    private Boolean isFeatured;
    private Boolean isPublished;
    private Integer displayOrder;
    private String createdBy;
    private List<ItemRequest> items;

    @Data
    public static class ItemRequest {
        private UUID spotId;       // one of these two
        private UUID spotLineId;   // one of these two
        private Integer itemOrder;
        private String itemNote;
    }
}
```

**`UpdateCollectionRequest.java`**:
```java
@Data
@Schema(description = "컬렉션 수정 요청")
public class UpdateCollectionRequest {
    private String title;
    private String description;
    private String coverImageUrl;
    private SpotLineTheme theme;
    private String area;
    private Boolean isFeatured;
    private Boolean isPublished;
    private Integer displayOrder;
}
```

**`UpdateItemOrderRequest.java`**:
```java
@Data
@Schema(description = "아이템 순서 벌크 변경")
public class UpdateItemOrderRequest {
    @NotEmpty private List<ItemOrder> items;

    @Data
    public static class ItemOrder {
        @NotNull private UUID id;
        @NotNull private Integer itemOrder;
    }
}
```

### Response DTOs

**`CollectionDetailResponse.java`**:
```java
@Data @Builder
@Schema(description = "컬렉션 상세 응답")
public class CollectionDetailResponse {
    private UUID id;
    private String slug;
    private String title;
    private String description;
    private String coverImageUrl;
    private String theme;
    private String area;
    private Boolean isFeatured;
    private Boolean isPublished;
    private Integer displayOrder;
    private Long viewsCount;
    private Integer itemCount;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CollectionItemDetail> items;

    @Data @Builder
    public static class CollectionItemDetail {
        private UUID id;
        private String itemType;     // "SPOT" | "SPOTLINE"
        private Integer itemOrder;
        private String itemNote;

        // Spot fields (when itemType=SPOT)
        private UUID spotId;
        private String spotSlug;
        private String spotTitle;
        private String spotCategory;
        private String spotArea;
        private String spotCoverImage;

        // SpotLine fields (when itemType=SPOTLINE)
        private UUID spotLineId;
        private String spotLineSlug;
        private String spotLineTitle;
        private String spotLineTheme;
        private String spotLineArea;
        private Integer spotLineSpotCount;
        private String spotLineCoverImage;
    }

    public static CollectionDetailResponse from(Collection c) {
        List<CollectionItemDetail> itemDetails = c.getItems().stream()
            .filter(i -> Boolean.TRUE.equals(i.getIsActive()))
            .map(CollectionDetailResponse::mapItem)
            .toList();

        return CollectionDetailResponse.builder()
            .id(c.getId()).slug(c.getSlug()).title(c.getTitle())
            .description(c.getDescription()).coverImageUrl(c.getCoverImageUrl())
            .theme(c.getTheme() != null ? c.getTheme().name() : null)
            .area(c.getArea())
            .isFeatured(c.getIsFeatured()).isPublished(c.getIsPublished())
            .displayOrder(c.getDisplayOrder())
            .viewsCount(c.getViewsCount()).itemCount(c.getItemCount())
            .createdBy(c.getCreatedBy())
            .createdAt(c.getCreatedAt()).updatedAt(c.getUpdatedAt())
            .items(itemDetails)
            .build();
    }

    private static CollectionItemDetail mapItem(CollectionItem ci) {
        var b = CollectionItemDetail.builder()
            .id(ci.getId()).itemOrder(ci.getItemOrder()).itemNote(ci.getItemNote());

        if (ci.getSpot() != null) {
            Spot s = ci.getSpot();
            b.itemType("SPOT").spotId(s.getId()).spotSlug(s.getSlug())
             .spotTitle(s.getTitle()).spotCategory(s.getCategory() != null ? s.getCategory().name() : null)
             .spotArea(s.getArea())
             .spotCoverImage(s.getMedia() != null && !s.getMedia().isEmpty() ? s.getMedia().get(0) : null);
        } else if (ci.getSpotLine() != null) {
            SpotLine sl = ci.getSpotLine();
            b.itemType("SPOTLINE").spotLineId(sl.getId()).spotLineSlug(sl.getSlug())
             .spotLineTitle(sl.getTitle()).spotLineTheme(sl.getTheme() != null ? sl.getTheme().name() : null)
             .spotLineArea(sl.getArea())
             .spotLineSpotCount(sl.getSpots() != null ? sl.getSpots().size() : 0);
        }
        return b.build();
    }
}
```

**`CollectionPreviewResponse.java`**:
```java
@Data @Builder
@Schema(description = "컬렉션 미리보기 응답")
public class CollectionPreviewResponse {
    private UUID id;
    private String slug;
    private String title;
    private String description;
    private String coverImageUrl;
    private String theme;
    private String area;
    private Integer itemCount;
    private Long viewsCount;

    public static CollectionPreviewResponse from(Collection c) {
        return CollectionPreviewResponse.builder()
            .id(c.getId()).slug(c.getSlug()).title(c.getTitle())
            .description(c.getDescription())
            .coverImageUrl(c.getCoverImageUrl())
            .theme(c.getTheme() != null ? c.getTheme().name() : null)
            .area(c.getArea())
            .itemCount(c.getItemCount()).viewsCount(c.getViewsCount())
            .build();
    }
}
```

---

## 6. DI-05: CollectionService

**File**: `springboot-spotLine-backend/src/main/java/com/spotline/api/service/CollectionService.java`

```java
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class CollectionService {

    private final CollectionRepository collectionRepository;
    private final CollectionItemRepository collectionItemRepository;
    private final SpotRepository spotRepository;
    private final SpotLineRepository spotLineRepository;
    private final Slugify slugify = Slugify.builder().transliterator(true).build();

    // --- Read ---

    public CollectionDetailResponse getBySlug(String slug) {
        Collection c = collectionRepository.findBySlugAndIsActiveTrue(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Collection", slug));
        return CollectionDetailResponse.from(c);
    }

    public List<CollectionPreviewResponse> getFeatured() {
        return collectionRepository
            .findByIsFeaturedTrueAndIsPublishedTrueAndIsActiveTrueOrderByDisplayOrderAsc()
            .stream().map(CollectionPreviewResponse::from).toList();
    }

    public Page<CollectionPreviewResponse> getPublicList(String area, SpotLineTheme theme, Pageable pageable) {
        return collectionRepository.findByFilters(area, theme, pageable)
            .map(CollectionPreviewResponse::from);
    }

    public Page<CollectionDetailResponse> getAdminList(String keyword, Pageable pageable) {
        return collectionRepository.findByKeyword(keyword, pageable)
            .map(CollectionDetailResponse::from);
    }

    // --- Write ---

    @Transactional
    public CollectionDetailResponse create(CreateCollectionRequest req) {
        String slug = generateUniqueSlug(req.getTitle());
        Collection c = Collection.builder()
            .title(req.getTitle()).slug(slug)
            .description(req.getDescription()).coverImageUrl(req.getCoverImageUrl())
            .theme(req.getTheme()).area(req.getArea())
            .isFeatured(req.getIsFeatured() != null ? req.getIsFeatured() : false)
            .isPublished(req.getIsPublished() != null ? req.getIsPublished() : true)
            .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : 0)
            .createdBy(req.getCreatedBy())
            .build();

        if (req.getItems() != null) {
            addItemsToCollection(c, req.getItems());
        }

        return CollectionDetailResponse.from(collectionRepository.save(c));
    }

    @Transactional
    public CollectionDetailResponse update(String slug, UpdateCollectionRequest req) {
        Collection c = collectionRepository.findBySlugAndIsActiveTrue(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Collection", slug));

        if (req.getTitle() != null) c.setTitle(req.getTitle());
        if (req.getDescription() != null) c.setDescription(req.getDescription());
        if (req.getCoverImageUrl() != null) c.setCoverImageUrl(req.getCoverImageUrl());
        if (req.getTheme() != null) c.setTheme(req.getTheme());
        if (req.getArea() != null) c.setArea(req.getArea());
        if (req.getIsFeatured() != null) c.setIsFeatured(req.getIsFeatured());
        if (req.getIsPublished() != null) c.setIsPublished(req.getIsPublished());
        if (req.getDisplayOrder() != null) c.setDisplayOrder(req.getDisplayOrder());

        return CollectionDetailResponse.from(collectionRepository.save(c));
    }

    @Transactional
    public void delete(String slug) {
        Collection c = collectionRepository.findBySlugAndIsActiveTrue(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Collection", slug));
        c.setIsActive(false);
        collectionRepository.save(c);
    }

    // --- Items ---

    @Transactional
    public CollectionDetailResponse addItem(String slug, CreateCollectionRequest.ItemRequest req) {
        Collection c = collectionRepository.findBySlugAndIsActiveTrue(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Collection", slug));

        CollectionItem item = buildItem(c, req);
        c.getItems().add(item);
        c.setItemCount(c.getItemCount() + 1);

        return CollectionDetailResponse.from(collectionRepository.save(c));
    }

    @Transactional
    public void updateItemOrder(String slug, UpdateItemOrderRequest req) {
        Collection c = collectionRepository.findBySlugAndIsActiveTrue(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Collection", slug));

        Map<UUID, Integer> orderMap = req.getItems().stream()
            .collect(Collectors.toMap(UpdateItemOrderRequest.ItemOrder::getId,
                                      UpdateItemOrderRequest.ItemOrder::getItemOrder));

        c.getItems().forEach(item -> {
            Integer newOrder = orderMap.get(item.getId());
            if (newOrder != null) item.setItemOrder(newOrder);
        });

        collectionRepository.save(c);
    }

    @Transactional
    public void removeItem(String slug, UUID itemId) {
        Collection c = collectionRepository.findBySlugAndIsActiveTrue(slug)
            .orElseThrow(() -> new ResourceNotFoundException("Collection", slug));
        c.getItems().removeIf(i -> i.getId().equals(itemId));
        c.setItemCount(Math.max(0, c.getItemCount() - 1));
        collectionRepository.save(c);
    }

    // --- Views ---

    @Transactional
    public void incrementViews(String slug) {
        Collection c = collectionRepository.findBySlugAndIsActiveTrue(slug).orElse(null);
        if (c != null) {
            c.setViewsCount(c.getViewsCount() + 1);
            collectionRepository.save(c);
        }
    }

    // --- Helpers ---

    private String generateUniqueSlug(String title) {
        String base = slugify.slugify(title);
        if (base.isEmpty()) base = UUID.randomUUID().toString().substring(0, 8);
        String slug = base;
        int counter = 1;
        while (collectionRepository.existsBySlug(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }

    private void addItemsToCollection(Collection c, List<CreateCollectionRequest.ItemRequest> items) {
        for (int i = 0; i < items.size(); i++) {
            var req = items.get(i);
            if (req.getItemOrder() == null) req.setItemOrder(i + 1);
            c.getItems().add(buildItem(c, req));
        }
        c.setItemCount(items.size());
    }

    private CollectionItem buildItem(Collection c, CreateCollectionRequest.ItemRequest req) {
        CollectionItem.CollectionItemBuilder b = CollectionItem.builder()
            .collection(c).itemOrder(req.getItemOrder()).itemNote(req.getItemNote());

        if (req.getSpotId() != null) {
            Spot spot = spotRepository.findById(req.getSpotId())
                .orElseThrow(() -> new ResourceNotFoundException("Spot", req.getSpotId().toString()));
            b.spot(spot);
        } else if (req.getSpotLineId() != null) {
            SpotLine sl = spotLineRepository.findById(req.getSpotLineId())
                .orElseThrow(() -> new ResourceNotFoundException("SpotLine", req.getSpotLineId().toString()));
            b.spotLine(sl);
        }
        return b.build();
    }
}
```

---

## 7. DI-06: CollectionController

**File**: `springboot-spotLine-backend/src/main/java/com/spotline/api/controller/CollectionController.java`

```java
@Tag(name = "Collection", description = "컬렉션 CRUD + 탐색")
@RestController
@RequestMapping("/api/v2/collections")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    // --- Public ---

    @Operation(summary = "Featured 컬렉션 (피드 캐러셀)")
    @GetMapping("/featured")
    public ResponseEntity<List<CollectionPreviewResponse>> featured() {
        return ResponseEntity.ok(collectionService.getFeatured());
    }

    @Operation(summary = "컬렉션 목록 (공개)")
    @GetMapping
    public ResponseEntity<Page<CollectionPreviewResponse>> list(
            @RequestParam(required = false) String area,
            @RequestParam(required = false) SpotLineTheme theme,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(collectionService.getPublicList(area, theme, pageable));
    }

    @Operation(summary = "컬렉션 상세 조회 (slug)")
    @GetMapping("/{slug}")
    public ResponseEntity<CollectionDetailResponse> getBySlug(@PathVariable String slug) {
        collectionService.incrementViews(slug);
        return ResponseEntity.ok(collectionService.getBySlug(slug));
    }

    // --- Admin ---

    @Operation(summary = "컬렉션 생성")
    @PostMapping
    public ResponseEntity<CollectionDetailResponse> create(
            @Valid @RequestBody CreateCollectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(collectionService.create(request));
    }

    @Operation(summary = "컬렉션 수정")
    @PutMapping("/{slug}")
    public ResponseEntity<CollectionDetailResponse> update(
            @PathVariable String slug,
            @Valid @RequestBody UpdateCollectionRequest request) {
        return ResponseEntity.ok(collectionService.update(slug, request));
    }

    @Operation(summary = "컬렉션 삭제 (soft)")
    @DeleteMapping("/{slug}")
    public ResponseEntity<Void> delete(@PathVariable String slug) {
        collectionService.delete(slug);
        return ResponseEntity.noContent().build();
    }

    // --- Item Management ---

    @Operation(summary = "컬렉션 아이템 추가")
    @PostMapping("/{slug}/items")
    public ResponseEntity<CollectionDetailResponse> addItem(
            @PathVariable String slug,
            @Valid @RequestBody CreateCollectionRequest.ItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(collectionService.addItem(slug, request));
    }

    @Operation(summary = "아이템 순서 변경 (벌크)")
    @PutMapping("/{slug}/items/order")
    public ResponseEntity<Void> updateItemOrder(
            @PathVariable String slug,
            @Valid @RequestBody UpdateItemOrderRequest request) {
        collectionService.updateItemOrder(slug, request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "컬렉션 아이템 제거")
    @DeleteMapping("/{slug}/items/{itemId}")
    public ResponseEntity<Void> removeItem(
            @PathVariable String slug, @PathVariable UUID itemId) {
        collectionService.removeItem(slug, itemId);
        return ResponseEntity.noContent().build();
    }
}
```

---

## 8. DI-07: Admin collectionAPI Service

**File**: `admin-spotLine/src/services/v2/collectionAPI.ts`

```typescript
import apiClient from "../base/apiClient";
import type { SpringPage } from "../../types";

// --- Types ---

export interface CollectionPreview {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  theme: string | null;
  area: string | null;
  itemCount: number;
  viewsCount: number;
}

export interface CollectionDetail extends CollectionPreview {
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: CollectionItemDetail[];
}

export interface CollectionItemDetail {
  id: string;
  itemType: "SPOT" | "SPOTLINE";
  itemOrder: number;
  itemNote: string | null;
  spotId?: string;
  spotSlug?: string;
  spotTitle?: string;
  spotCategory?: string;
  spotArea?: string;
  spotCoverImage?: string;
  spotLineId?: string;
  spotLineSlug?: string;
  spotLineTitle?: string;
  spotLineTheme?: string;
  spotLineArea?: string;
  spotLineSpotCount?: number;
  spotLineCoverImage?: string;
}

export interface CreateCollectionRequest {
  title: string;
  description?: string;
  coverImageUrl?: string;
  theme?: string;
  area?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  displayOrder?: number;
  createdBy?: string;
  items?: CollectionItemRequest[];
}

export interface CollectionItemRequest {
  spotId?: string;
  spotLineId?: string;
  itemOrder?: number;
  itemNote?: string;
}

export interface UpdateCollectionRequest {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  theme?: string;
  area?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  displayOrder?: number;
}

export interface CollectionListParams {
  page?: number;  // 1-indexed (UI)
  size?: number;
  keyword?: string;
}

// --- API ---

export const collectionAPI = {
  list: (params: CollectionListParams = {}) => {
    const { page = 1, size = 20, ...rest } = params;
    return apiClient.get<SpringPage<CollectionDetail>>(
      "/api/v2/collections",
      { params: { page: page - 1, size, ...rest } }
    );
  },

  getBySlug: (slug: string) =>
    apiClient.get<CollectionDetail>(`/api/v2/collections/${slug}`),

  create: (data: CreateCollectionRequest) =>
    apiClient.post<CollectionDetail>("/api/v2/collections", data),

  update: (slug: string, data: UpdateCollectionRequest) =>
    apiClient.put<CollectionDetail>(`/api/v2/collections/${slug}`, data),

  delete: (slug: string) =>
    apiClient.delete(`/api/v2/collections/${slug}`),

  // Item management
  addItem: (slug: string, data: CollectionItemRequest) =>
    apiClient.post<CollectionDetail>(`/api/v2/collections/${slug}/items`, data),

  updateItemOrder: (slug: string, items: { id: string; itemOrder: number }[]) =>
    apiClient.put(`/api/v2/collections/${slug}/items/order`, { items }),

  removeItem: (slug: string, itemId: string) =>
    apiClient.delete(`/api/v2/collections/${slug}/items/${itemId}`),
};
```

---

## 9. DI-08: CollectionManagement Page

**File**: `admin-spotLine/src/pages/CollectionManagement.tsx`

**구조**: SpotLineManagement.tsx 패턴 동일

### 핵심 상태:
```typescript
const [page, setPage] = useState(1);
const [searchInput, setSearchInput] = useState("");
const [keyword, setKeyword] = useState("");
```

### Query:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ["collections", page, keyword],
  queryFn: () => collectionAPI.list({ page, size: 20, keyword: keyword || undefined }),
  placeholderData: keepPreviousData,
});
```

### DataTable Columns:
| Column | Key | Render |
|--------|-----|--------|
| 제목 | `title` | text |
| 테마 | `theme` | Badge (SPOTLINE_THEMES label) |
| 지역 | `area` | text |
| 아이템 수 | `itemCount` | number |
| Featured | `isFeatured` | ✅/- |
| 공개 | `isPublished` | ✅/- |
| 조회수 | `viewsCount` | number |

### Actions:
- **새 컬렉션** 버튼 → `navigate("/collections/new")`
- **행 클릭** → `navigate("/collections/{slug}/edit")`
- **삭제** → confirm + `collectionAPI.delete(slug)` + invalidate

---

## 10. DI-09: CollectionEditor Page

**File**: `admin-spotLine/src/pages/CollectionEditor.tsx`

**구조**: SpotLineBuilder 패턴 참조 (2-panel: 좌=폼, 우=아이템 관리)

### 좌측 패널: 컬렉션 메타데이터 폼
- title (text input)
- description (textarea)
- coverImageUrl (text input — URL)
- theme (select — SpotLineTheme enum)
- area (select — 서울 지역 목록)
- isFeatured (checkbox)
- isPublished (checkbox)
- displayOrder (number input)

### 우측 패널: 아이템 관리
1. **검색 탭** (Spot / SpotLine 탭 전환)
   - Spot 검색: `spotAPI.search({ keyword })` → 결과 카드 표시 → "추가" 버튼
   - SpotLine 검색: `spotLineAPI.getPopular({ keyword })` → 결과 카드 표시 → "추가" 버튼
2. **아이템 목록** (dnd-kit 드래그 정렬)
   - 각 아이템: 타입 배지(SPOT/SPOTLINE) + 제목 + area + 메모 input + 삭제 버튼
   - `@dnd-kit/sortable` — SpotLineBuilder의 SortableSpotCard 패턴 동일
3. **저장**: 편집 모드에서 `collectionAPI.update()` + 아이템은 개별 add/remove/reorder

### 모드 판별:
```typescript
const { slug } = useParams<{ slug: string }>();
const isEdit = Boolean(slug);
// New: POST create → redirect to edit
// Edit: GET by slug → pre-fill form
```

---

## 11. DI-10: Admin Navigation + Routes

### `Layout.tsx` — Navigation 추가
```typescript
// Curation section에 추가
{ name: "컬렉션 관리", href: "/collections", icon: FolderOpen, section: "curation" },
```

### `App.tsx` — Routes 추가
```tsx
const CollectionManagement = lazy(() => import("./pages/CollectionManagement"));
const CollectionEditor = lazy(() => import("./pages/CollectionEditor"));

// Inside <Route path="/">
<Route path="collections" element={<Suspense fallback={<LoadingSpinner />}><CollectionManagement /></Suspense>} />
<Route path="collections/new" element={<Suspense fallback={<LoadingSpinner />}><CollectionEditor /></Suspense>} />
<Route path="collections/:slug/edit" element={<Suspense fallback={<LoadingSpinner />}><CollectionEditor /></Suspense>} />
```

---

## 12. DI-11: Frontend Collection Types

**File**: `front-spotLine/src/types/index.ts` — 추가

```typescript
export interface CollectionPreview {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  theme: SpotLineTheme | null;
  area: string | null;
  itemCount: number;
  viewsCount: number;
}

export interface CollectionDetail extends CollectionPreview {
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  items: CollectionItemDetail[];
}

export interface CollectionItemDetail {
  id: string;
  itemType: "SPOT" | "SPOTLINE";
  itemOrder: number;
  itemNote: string | null;
  // Spot fields
  spotId?: string;
  spotSlug?: string;
  spotTitle?: string;
  spotCategory?: string;
  spotArea?: string;
  spotCoverImage?: string;
  // SpotLine fields
  spotLineId?: string;
  spotLineSlug?: string;
  spotLineTitle?: string;
  spotLineTheme?: string;
  spotLineArea?: string;
  spotLineSpotCount?: number;
  spotLineCoverImage?: string;
}
```

---

## 13. DI-12: Frontend collectionApi

**File**: `front-spotLine/src/lib/collectionApi.ts`

```typescript
import api from "./api";
import type { CollectionDetail, CollectionPreview, PaginatedResponse } from "@/types";

export async function fetchFeaturedCollections(): Promise<CollectionPreview[]> {
  const { data } = await api.get("/api/v2/collections/featured");
  return data;
}

export async function fetchCollections(params?: {
  area?: string; theme?: string; page?: number; size?: number;
}): Promise<PaginatedResponse<CollectionPreview>> {
  const { data } = await api.get("/api/v2/collections", { params });
  return data;
}

export async function fetchCollectionDetail(slug: string): Promise<CollectionDetail | null> {
  try {
    const { data } = await api.get(`/api/v2/collections/${slug}`);
    return data;
  } catch {
    return null;
  }
}
```

---

## 14. DI-13: Collection Detail Page (SSR + SEO)

**File**: `front-spotLine/src/app/(main)/collection/[slug]/page.tsx`

### 구조: `spotline/[slug]/page.tsx` 패턴 동일

```typescript
// generateMetadata — SSR SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await fetchCollectionDetail(slug);
  if (!collection) return { title: "컬렉션을 찾을 수 없습니다" };
  return {
    title: `${collection.title} | Spotline`,
    description: collection.description || `${collection.area}의 ${collection.title}`,
    openGraph: { ... },
  };
}

// Page component
export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const collection = await fetchCollectionDetail(slug);
  if (!collection) notFound();

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <JsonLd data={generateCollectionJsonLd(collection)} />
      <Breadcrumb items={[
        { name: "컬렉션", url: "/collections" },
        { name: collection.title },
      ]} />

      {/* Hero: coverImageUrl or gradient fallback */}
      <CollectionHero collection={collection} />

      {/* Items grid */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h2 className="text-lg font-bold mb-4">
          {collection.itemCount}개의 추천 장소/코스
        </h2>
        <div className="space-y-4">
          {collection.items.map(item => (
            item.itemType === "SPOT"
              ? <SpotCard key={item.id} ... />
              : <SpotLineCard key={item.id} ... />
          ))}
        </div>
      </div>
    </main>
  );
}
```

### JSON-LD:
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "{title}",
  "description": "{description}",
  "numberOfItems": "{itemCount}",
  "hasPart": [...]
}
```

---

## 15. DI-14: Collections List Page

**File**: `front-spotLine/src/app/(main)/collections/page.tsx`

### 구조: Client component with filters

```typescript
"use client";

// Area/Theme filter chips + collection card grid
// fetchCollections({ area, theme, page }) → PaginatedResponse
// Responsive grid: 1col mobile, 2col tablet, 3col desktop
// Each card: coverImage + title + description + itemCount + area badge
// Click → /collection/{slug}
```

---

## 16. DI-15: Feed Featured Collections Carousel

**File**: `front-spotLine/src/components/feed/FeedCollectionSection.tsx`

### 구조:
```typescript
"use client";

// Horizontal scroll carousel (기존 FeedSpotLineSection 패턴)
// fetchFeaturedCollections() → max 6 CollectionPreview
// Each card: coverImage (aspect-video) + title + itemCount badge
// snap-x snap-mandatory scroll-pl-4 for mobile swipe
```

### FeedPage.tsx 수정:
```tsx
// feedTab === "explore" 내부, FeedSpotLineSection 위에 추가
<FeedCollectionSection />
```

---

## 17. Implementation Order

```
Step 1: Backend Entity + Repository (DI-01, DI-02, DI-03)
Step 2: Backend DTOs + Service + Controller (DI-04, DI-05, DI-06)
Step 3: Admin API + Routes + Navigation (DI-07, DI-10)
Step 4: Admin CollectionManagement + CollectionEditor (DI-08, DI-09)
Step 5: Frontend Types + API + Pages (DI-11, DI-12, DI-13, DI-14)
Step 6: Frontend Feed Carousel (DI-15)
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-27 | Initial design | Claude |
