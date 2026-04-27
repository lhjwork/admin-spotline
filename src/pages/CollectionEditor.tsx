import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Loader2, GripVertical, Trash2, Plus, Search, MapPin, Route } from "lucide-react";
import { collectionAPI, type CreateCollectionRequest, type CollectionItemDetail } from "../services/v2/collectionAPI";
import { spotAPI } from "../services/v2/spotAPI";
import { spotLineAPI } from "../services/v2/spotLineAPI";
import type { SpotDetailResponse, SpotLinePreviewResponse, SpotLineTheme } from "../types/v2";
import { AREAS, SPOTLINE_THEMES } from "../constants";

interface FormValues {
  title: string;
  description: string;
  coverImageUrl: string;
  theme: SpotLineTheme | "";
  area: string;
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
}

interface CollectionItem {
  id: string; // existing item id or temp id
  itemType: "SPOT" | "SPOTLINE";
  title: string;
  area: string | null;
  coverImage: string | null;
  itemNote: string;
  // references
  spotId?: string;
  spotLineId?: string;
}

// --- Sortable Item Card ---

function SortableItemCard({
  item,
  onRemove,
  onNoteChange,
}: {
  item: CollectionItem;
  onRemove: () => void;
  onNoteChange: (note: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 bg-white border border-gray-200 rounded-lg p-3 mb-2">
      <button type="button" {...attributes} {...listeners} className="mt-1 cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            item.itemType === "SPOT" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
          }`}>
            {item.itemType === "SPOT" ? "Spot" : "SpotLine"}
          </span>
          <span className="text-sm font-medium text-gray-900 truncate">{item.title}</span>
        </div>
        {item.area && <p className="text-xs text-gray-500 mt-0.5">{item.area}</p>}
        <input
          type="text"
          value={item.itemNote}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="메모 (선택)"
          className="mt-1 w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <button type="button" onClick={onRemove} className="mt-1 text-gray-400 hover:text-red-500">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// --- Search Panel ---

function ItemSearchPanel({ onAdd, addedIds }: { onAdd: (item: CollectionItem) => void; addedIds: Set<string> }) {
  const [tab, setTab] = useState<"spot" | "spotline">("spot");
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    debounceRef.current = setTimeout(() => setSearchKeyword(searchInput), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const { data: spotData, isLoading: spotLoading } = useQuery({
    queryKey: ["collection-search-spots", searchKeyword],
    queryFn: () => spotAPI.getList({ page: 1, size: 20, keyword: searchKeyword || undefined }),
    enabled: tab === "spot" && searchKeyword.length > 0,
    placeholderData: keepPreviousData,
  });

  const { data: spotLineData, isLoading: spotLineLoading } = useQuery({
    queryKey: ["collection-search-spotlines", searchKeyword],
    queryFn: () => spotLineAPI.getPopular({ page: 1, size: 20, keyword: searchKeyword || undefined }),
    enabled: tab === "spotline" && searchKeyword.length > 0,
    placeholderData: keepPreviousData,
  });

  const spots = spotData?.data?.content ?? [];
  const spotLines = spotLineData?.data?.content ?? [];
  const isLoading = tab === "spot" ? spotLoading : spotLineLoading;

  const handleAddSpot = (spot: SpotDetailResponse) => {
    if (addedIds.has(`spot-${spot.id}`)) return;
    onAdd({
      id: `spot-${spot.id}`,
      itemType: "SPOT",
      title: spot.title,
      area: spot.area,
      coverImage: spot.media?.[0] ?? null,
      itemNote: "",
      spotId: spot.id,
    });
  };

  const handleAddSpotLine = (sl: SpotLinePreviewResponse) => {
    if (addedIds.has(`spotline-${sl.id}`)) return;
    onAdd({
      id: `spotline-${sl.id}`,
      itemType: "SPOTLINE",
      title: sl.title,
      area: sl.area,
      coverImage: null,
      itemNote: "",
      spotLineId: sl.id,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-3">
        <button
          type="button"
          onClick={() => { setTab("spot"); setSearchInput(""); setSearchKeyword(""); }}
          className={`flex items-center gap-1 px-3 py-2 text-sm font-medium border-b-2 ${
            tab === "spot" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" /> Spot
        </button>
        <button
          type="button"
          onClick={() => { setTab("spotline"); setSearchInput(""); setSearchKeyword(""); }}
          className={`flex items-center gap-1 px-3 py-2 text-sm font-medium border-b-2 ${
            tab === "spotline" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Route className="h-3.5 w-3.5" /> SpotLine
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={tab === "spot" ? "Spot 검색..." : "SpotLine 검색..."}
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {isLoading && <p className="text-sm text-gray-500 text-center py-4">검색 중...</p>}
        {!isLoading && searchKeyword.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">검색어를 입력하세요</p>
        )}

        {tab === "spot" && spots.map((spot) => {
          const added = addedIds.has(`spot-${spot.id}`);
          return (
            <div key={spot.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{spot.title}</p>
                <p className="text-xs text-gray-500">{spot.area}</p>
              </div>
              <button
                type="button"
                onClick={() => handleAddSpot(spot)}
                disabled={added}
                className="ml-2 flex-shrink-0 p-1 rounded text-primary-600 hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          );
        })}

        {tab === "spotline" && spotLines.map((sl) => {
          const added = addedIds.has(`spotline-${sl.id}`);
          return (
            <div key={sl.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{sl.title}</p>
                <p className="text-xs text-gray-500">
                  {sl.area} {sl.theme && `· ${SPOTLINE_THEMES[sl.theme] ?? sl.theme}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAddSpotLine(sl)}
                disabled={added}
                className="ml-2 flex-shrink-0 p-1 rounded text-primary-600 hover:bg-primary-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function CollectionEditor() {
  const { slug } = useParams<{ slug?: string }>();
  const isEdit = Boolean(slug);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      coverImageUrl: "",
      theme: "",
      area: "",
      isFeatured: false,
      isPublished: true,
      displayOrder: 0,
    },
  });

  // Edit mode: load existing data
  const { data: existing } = useQuery({
    queryKey: ["collection", slug],
    queryFn: () => collectionAPI.getBySlug(slug!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing && !initialized) {
      const c = existing.data;
      reset({
        title: c.title,
        description: c.description ?? "",
        coverImageUrl: c.coverImageUrl ?? "",
        theme: (c.theme as SpotLineTheme) ?? "",
        area: c.area ?? "",
        isFeatured: c.isFeatured,
        isPublished: c.isPublished,
        displayOrder: c.displayOrder,
      });
      setItems(
        c.items
          .sort((a: CollectionItemDetail, b: CollectionItemDetail) => a.itemOrder - b.itemOrder)
          .map((item: CollectionItemDetail) => ({
            id: item.id,
            itemType: item.itemType,
            title: item.itemType === "SPOT" ? (item.spotTitle ?? "") : (item.spotLineTitle ?? ""),
            area: item.itemType === "SPOT" ? (item.spotArea ?? null) : (item.spotLineArea ?? null),
            coverImage: item.itemType === "SPOT" ? (item.spotCoverImage ?? null) : (item.spotLineCoverImage ?? null),
            itemNote: item.itemNote ?? "",
            spotId: item.spotId,
            spotLineId: item.spotLineId,
          })),
      );
      setInitialized(true);
    }
  }, [existing, initialized, reset]);

  const addedIds = new Set(items.map((i) => i.id));

  // dnd-kit sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateCollectionRequest) => collectionAPI.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      navigate(`/collections/${res.data.slug}/edit`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { meta: Parameters<typeof collectionAPI.update>[1]; items: CollectionItem[] }) =>
      collectionAPI.update(slug!, data.meta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collection", slug] });
      navigate("/collections");
    },
  });

  const mutation = isEdit ? updateMutation : createMutation;

  const doSubmit = (values: FormValues) => {
    const meta = {
      title: values.title,
      description: values.description || undefined,
      coverImageUrl: values.coverImageUrl || undefined,
      theme: values.theme || undefined,
      area: values.area || undefined,
      isFeatured: values.isFeatured,
      isPublished: values.isPublished,
      displayOrder: values.displayOrder,
    };

    if (isEdit) {
      updateMutation.mutate({ meta, items });
    } else {
      createMutation.mutate({
        ...meta,
        items: items.map((item, i) => ({
          spotId: item.spotId,
          spotLineId: item.spotLineId,
          itemOrder: i + 1,
          itemNote: item.itemNote || undefined,
        })),
      });
    }
  };

  // Item management for edit mode (individual add/remove/reorder)
  const handleAddItem = async (item: CollectionItem) => {
    if (isEdit && slug) {
      try {
        await collectionAPI.addItem(slug, {
          spotId: item.spotId,
          spotLineId: item.spotLineId,
          itemOrder: items.length + 1,
          itemNote: item.itemNote || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["collection", slug] });
        setInitialized(false); // re-fetch
      } catch {
        // fallback to local state
        setItems((prev) => [...prev, item]);
      }
    } else {
      setItems((prev) => [...prev, item]);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (isEdit && slug) {
      try {
        await collectionAPI.removeItem(slug, itemId);
        queryClient.invalidateQueries({ queryKey: ["collection", slug] });
        setInitialized(false);
      } catch {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    } else {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const handleSaveOrder = async () => {
    if (!isEdit || !slug) return;
    try {
      await collectionAPI.updateItemOrder(
        slug,
        items.map((item, i) => ({ id: item.id, itemOrder: i + 1 })),
      );
      queryClient.invalidateQueries({ queryKey: ["collection", slug] });
    } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "컬렉션 수정" : "새 컬렉션"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? "컬렉션 정보를 수정합니다" : "Spot과 SpotLine을 모아 컬렉션을 구성합니다"}
        </p>
      </div>

      {mutation.isError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          컬렉션 {isEdit ? "수정" : "생성"}에 실패했습니다: {(mutation.error as Error)?.message ?? "알 수 없는 오류"}
        </div>
      )}

      <form onSubmit={handleSubmit(doSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel: Metadata Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">컬렉션 정보</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  {...register("title", { required: "제목을 입력하세요" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="성수 카페 모음"
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="컬렉션 설명..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">커버 이미지 URL</label>
                <input
                  {...register("coverImageUrl")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">테마</label>
                  <select
                    {...register("theme")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">선택 안 함</option>
                    {Object.entries(SPOTLINE_THEMES).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
                  <select
                    {...register("area")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">선택 안 함</option>
                    {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">표시 순서</label>
                <input
                  type="number"
                  {...register("displayOrder", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" {...register("isFeatured")} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" {...register("isPublished")} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  공개
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isEdit ? "컬렉션 수정" : "컬렉션 생성"}
              </button>
              {isEdit && items.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  순서 저장
                </button>
              )}
            </div>
          </div>

          {/* Right Panel: Item Management */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm p-4 h-[320px]">
              <ItemSearchPanel onAdd={handleAddItem} addedIds={addedIds} />
            </div>

            {/* Item List */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                아이템 목록 ({items.length}개)
              </h3>
              {items.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  위에서 Spot 또는 SpotLine을 검색하여 추가하세요
                </p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map((item) => (
                      <SortableItemCard
                        key={item.id}
                        item={item}
                        onRemove={() => handleRemoveItem(item.id)}
                        onNoteChange={(note) =>
                          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, itemNote: note } : i)))
                        }
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
