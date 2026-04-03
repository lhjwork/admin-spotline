import { useState } from "react";
import { useQuery } from "react-query";
import { Search, MapPin } from "lucide-react";
import { spotAPI } from "../services/v2/spotAPI";
import type { CreatePartnerRequest, UpdatePartnerRequest, PartnerTier, PartnerDetailResponse, SpotDetailResponse } from "../types/v2";

interface PartnerFormProps {
  mode?: "create" | "edit";
  initialData?: PartnerDetailResponse;
  onSubmit: (data: CreatePartnerRequest | UpdatePartnerRequest) => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function PartnerForm({ mode = "create", initialData, onSubmit, isSubmitting, error }: PartnerFormProps) {
  const isEdit = mode === "edit";

  const [spotSearch, setSpotSearch] = useState("");
  const [selectedSpot, setSelectedSpot] = useState<SpotDetailResponse | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [tier, setTier] = useState<PartnerTier>(initialData?.tier ?? "BASIC");
  const [brandColor, setBrandColor] = useState(initialData?.brandColor ?? "#6366F1");
  const [benefitText, setBenefitText] = useState(initialData?.benefitText ?? "");
  const [contractStartDate, setContractStartDate] = useState(
    initialData?.contractStartDate ?? new Date().toISOString().split("T")[0]
  );
  const [contractEndDate, setContractEndDate] = useState(initialData?.contractEndDate ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");

  const { data: spotsData } = useQuery({
    queryKey: ["spots-search", spotSearch],
    queryFn: () => spotAPI.getList({ page: 1, size: 10 }),
    select: (res) => res.data.content,
    enabled: !isEdit && spotSearch.length > 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !selectedSpot) return;

    if (isEdit) {
      onSubmit({
        tier,
        brandColor,
        benefitText: benefitText || undefined,
        contractEndDate: contractEndDate || undefined,
        note: note || undefined,
      } as UpdatePartnerRequest);
    } else {
      onSubmit({
        spotId: selectedSpot!.id,
        tier,
        brandColor,
        benefitText: benefitText || undefined,
        contractStartDate,
        note: note || undefined,
      } as CreatePartnerRequest);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Spot 선택 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Spot 선택 *</label>
        {isEdit ? (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{initialData?.spotTitle}</p>
              <p className="text-sm text-gray-500">{initialData?.spotArea}</p>
            </div>
            <span className="text-xs text-gray-400">변경 불가</span>
          </div>
        ) : selectedSpot ? (
          <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
            <MapPin className="h-5 w-5 text-primary-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{selectedSpot.title}</p>
              <p className="text-sm text-gray-500">{selectedSpot.area} · {selectedSpot.address}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSpot(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              변경
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={spotSearch}
              onChange={(e) => {
                setSpotSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="매장명으로 검색..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
            />
            {showDropdown && spotsData && spotsData.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {spotsData.map((spot) => (
                  <li
                    key={spot.id}
                    onClick={() => {
                      setSelectedSpot(spot);
                      setShowDropdown(false);
                      setSpotSearch("");
                    }}
                    className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <p className="font-medium text-gray-900">{spot.title}</p>
                    <p className="text-xs text-gray-500">{spot.area}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 계약 시작일 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">계약 시작일 *</label>
        <input
          type="date"
          value={contractStartDate}
          onChange={(e) => setContractStartDate(e.target.value)}
          required
          disabled={isEdit}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      {/* 계약 종료일 */}
      {isEdit && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">계약 종료일</label>
          <input
            type="date"
            value={contractEndDate}
            onChange={(e) => setContractEndDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      )}

      {/* 파트너 등급 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">파트너 등급 *</label>
        <div className="flex gap-4">
          {(["BASIC", "PREMIUM"] as PartnerTier[]).map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="tier"
                value={t}
                checked={tier === t}
                onChange={() => setTier(t)}
                className="text-primary-600"
              />
              {t === "BASIC" ? "Basic" : "Premium"}
            </label>
          ))}
        </div>
      </div>

      {/* 브랜딩 컬러 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">브랜딩 컬러</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded border border-gray-300"
          />
          <input
            type="text"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>

      {/* 혜택 텍스트 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">혜택 텍스트</label>
        <input
          type="text"
          value={benefitText}
          onChange={(e) => setBenefitText(e.target.value)}
          placeholder="예: QR 스캔 고객 10% 할인"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {/* 메모 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">메모</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="내부 메모..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={(!isEdit && !selectedSpot) || isSubmitting}
        className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? (isEdit ? "저장 중..." : "등록 중...") : (isEdit ? "수정 저장" : "파트너 등록")}
      </button>
    </form>
  );
}
