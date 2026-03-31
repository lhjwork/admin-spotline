import type { PlaceInfo } from "../../types/v2";
import { MapPin, Phone, Star, ExternalLink } from "lucide-react";

interface PlaceSearchResultCardProps {
  place: PlaceInfo;
  onSelect: (place: PlaceInfo) => void;
  selected?: boolean;
  bulkMode?: boolean;
  checked?: boolean;
  onCheckChange?: (checked: boolean) => void;
  onQuickRegister?: (place: PlaceInfo) => void;
}

export default function PlaceSearchResultCard({
  place,
  onSelect,
  selected,
  bulkMode,
  checked,
  onCheckChange,
  onQuickRegister,
}: PlaceSearchResultCardProps) {
  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
        selected ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
      onClick={() => {
        if (bulkMode && onCheckChange) {
          onCheckChange(!checked);
        } else {
          onSelect(place);
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {bulkMode && (
            <input
              type="checkbox"
              checked={checked ?? false}
              onChange={(e) => {
                e.stopPropagation();
                onCheckChange?.(e.target.checked);
              }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{place.name}</h4>
            {place.category && (
              <span className="text-xs text-gray-500">{place.category}</span>
            )}
          </div>
        </div>
        {place.url && (
          <a
            href={place.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-primary-500 ml-2"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <div className="mt-1 space-y-0.5">
        <p className="text-xs text-gray-600 flex items-center">
          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="truncate">{place.address}</span>
        </p>
        {place.phone && (
          <p className="text-xs text-gray-500 flex items-center">
            <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
            {place.phone}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {place.rating != null && (
            <span className="text-xs text-yellow-600 flex items-center">
              <Star className="h-3 w-3 mr-0.5 fill-yellow-400" />
              {place.rating}
            </span>
          )}
          {place.reviewCount != null && (
            <span className="text-xs text-gray-400">리뷰 {place.reviewCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {bulkMode && onQuickRegister && (
            <button
              onClick={(e) => { e.stopPropagation(); onQuickRegister(place); }}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              바로 등록
            </button>
          )}
          {!bulkMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(place); }}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              선택
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
