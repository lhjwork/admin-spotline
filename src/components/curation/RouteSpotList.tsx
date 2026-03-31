import { useState } from "react";
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
import { GripVertical, Trash2 } from "lucide-react";
import type { SpotDetailResponse, RouteSpotRequest } from "../../types/v2";
import { SPOT_CATEGORIES } from "../../constants";

export interface RouteSpotItem {
  spot: SpotDetailResponse;
  meta: RouteSpotRequest;
}

interface RouteSpotListProps {
  items: RouteSpotItem[];
  onChange: (items: RouteSpotItem[]) => void;
  distances: { distanceToNext: number | null; walkingTimeToNext: number | null }[];
}

function formatDistance(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`;
}

function SortableSpotCard({
  item,
  index,
  distance,
  onRemove,
  onUpdateMeta,
}: {
  item: RouteSpotItem;
  index: number;
  distance: { distanceToNext: number | null; walkingTimeToNext: number | null };
  onRemove: () => void;
  onUpdateMeta: (field: keyof RouteSpotRequest, value: string | number) => void;
}) {
  const [overrideWalking, setOverrideWalking] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.spot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const autoWalking = distance.walkingTimeToNext;
  const autoDist = distance.distanceToNext;
  const hasManualWalking = item.meta.walkingTimeToNext != null && item.meta.walkingTimeToNext > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 rounded-lg p-3 bg-white ${
        isDragging ? "opacity-50 ring-2 ring-primary-300" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-medium text-gray-900">{item.spot.title}</p>
            <p className="text-xs text-gray-500">
              {SPOT_CATEGORIES[item.spot.category]} · {item.spot.area}
            </p>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-red-400 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">추천 시간</label>
          <input
            type="text"
            value={item.meta.suggestedTime ?? ""}
            onChange={(e) => onUpdateMeta("suggestedTime", e.target.value)}
            placeholder="예: 14:00"
            className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">체류 시간 (분)</label>
          <input
            type="number"
            value={item.meta.stayDuration ?? ""}
            onChange={(e) => onUpdateMeta("stayDuration", parseInt(e.target.value) || 0)}
            placeholder="60"
            className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500">전환 노트</label>
          <input
            type="text"
            value={item.meta.transitionNote ?? ""}
            onChange={(e) => onUpdateMeta("transitionNote", e.target.value)}
            placeholder="도보 이동, 경치 좋음"
            className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
          />
        </div>
      </div>

      {/* Distance info between spots */}
      {autoDist != null && (
        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex items-center gap-2 text-xs text-gray-500">
          <span>→ 다음까지:</span>
          <span className="font-medium text-gray-700">{formatDistance(autoDist)}</span>
          <span>·</span>
          {overrideWalking || hasManualWalking ? (
            <div className="flex items-center gap-1">
              <span>도보</span>
              <input
                type="number"
                value={item.meta.walkingTimeToNext ?? autoWalking ?? ""}
                onChange={(e) => onUpdateMeta("walkingTimeToNext", parseInt(e.target.value) || 0)}
                className="w-12 px-1 py-0.5 border border-gray-300 rounded text-xs"
              />
              <span>분</span>
              <button
                onClick={() => {
                  onUpdateMeta("walkingTimeToNext", 0);
                  setOverrideWalking(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-xs underline ml-1"
              >
                자동
              </button>
            </div>
          ) : (
            <button
              onClick={() => setOverrideWalking(true)}
              className="text-gray-600 hover:text-primary-600"
            >
              도보 {autoWalking}분
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function RouteSpotList({ items, onChange, distances }: RouteSpotListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.spot.id === active.id);
    const newIndex = items.findIndex((i) => i.spot.id === over.id);
    const moved = arrayMove(items, oldIndex, newIndex);
    onChange(moved.map((item, i) => ({ ...item, meta: { ...item.meta, order: i + 1 } })));
  };

  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next.map((item, i) => ({ ...item, meta: { ...item.meta, order: i + 1 } })));
  };

  const updateMeta = (index: number, field: keyof RouteSpotRequest, value: string | number) => {
    const next = [...items];
    next[index] = { ...next[index], meta: { ...next[index].meta, [field]: value } };
    onChange(next);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        왼쪽에서 Spot을 선택해주세요
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.spot.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((item, index) => (
            <SortableSpotCard
              key={item.spot.id}
              item={item}
              index={index}
              distance={distances[index] ?? { distanceToNext: null, walkingTimeToNext: null }}
              onRemove={() => remove(index)}
              onUpdateMeta={(field, value) => updateMeta(index, field, value)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
