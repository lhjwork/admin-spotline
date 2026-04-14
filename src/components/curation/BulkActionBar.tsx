import { useState } from "react";
import { Tags, ChevronDown } from "lucide-react";
import type { BulkMeta, SpotCategory } from "../../types/v2";
import { SPOT_CATEGORIES, AREAS } from "../../constants";

interface BulkActionBarProps {
  bulkMeta: BulkMeta;
  onChange: (meta: BulkMeta) => void;
  selectedCount: number;
}

export default function BulkActionBar({ bulkMeta, onChange, selectedCount }: BulkActionBarProps) {
  const [tagInput, setTagInput] = useState(bulkMeta.tags.join(", "));

  const updateField = <K extends keyof BulkMeta>(key: K, value: BulkMeta[K]) => {
    onChange({ ...bulkMeta, [key]: value });
  };

  const handleTagBlur = () => {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    updateField("tags", tags);
  };

  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Tags className="h-4 w-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-blue-900">
          일괄 설정 ({selectedCount}개 선택됨)
        </h4>
      </div>

      <div className="space-y-3">
        {/* 태그 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">태그</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onBlur={handleTagBlur}
            placeholder="쉼표로 구분 (예: 성수맛집, 브런치)"
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 카테고리 + 지역 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">카테고리</label>
            <div className="relative">
              <select
                value={bulkMeta.category ?? ""}
                onChange={(e) =>
                  updateField("category", e.target.value ? (e.target.value as SpotCategory) : null)
                }
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">자동 감지</option>
                {Object.entries(SPOT_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">지역</label>
            <div className="relative">
              <select
                value={bulkMeta.area ?? ""}
                onChange={(e) => updateField("area", e.target.value || null)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm appearance-none bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">자동 추출</option>
                {AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 크루노트 */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">크루노트</label>
          <input
            type="text"
            value={bulkMeta.crewNote}
            onChange={(e) => updateField("crewNote", e.target.value)}
            placeholder="일괄 적용할 크루노트"
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
