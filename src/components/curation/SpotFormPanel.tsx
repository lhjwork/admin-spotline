import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import type { CreateSpotRequest, SpotCategory, TimeOfDay, WeatherCondition } from "../../types/v2";
import { AREAS, SPOT_CATEGORIES, extractAreaFromAddress } from "../../constants";
import DaumAddressEmbed from "../DaumAddressEmbed";
import SpotMediaUpload, { type MediaItem } from "./SpotMediaUpload";

const TIME_OF_DAY_LABELS: Record<string, string> = {
  DAWN: "새벽",
  MORNING: "오전",
  AFTERNOON: "오후",
  SUNSET: "일몰",
  NIGHT: "밤",
  ANY: "상관없음",
};

const WEATHER_LABELS: Record<string, string> = {
  SUNNY: "맑음",
  CLOUDY: "흐림",
  RAINY: "비",
  SNOWY: "눈",
  ANY: "상관없음",
};

const AUTO_TAG_MAP: Record<string, { timeOfDay: string; weather: string; isIndoor: boolean }> = {
  CAFE: { timeOfDay: "AFTERNOON", weather: "ANY", isIndoor: true },
  RESTAURANT: { timeOfDay: "AFTERNOON", weather: "ANY", isIndoor: true },
  BAR: { timeOfDay: "NIGHT", weather: "ANY", isIndoor: true },
  NATURE: { timeOfDay: "MORNING", weather: "SUNNY", isIndoor: false },
  CULTURE: { timeOfDay: "AFTERNOON", weather: "ANY", isIndoor: true },
  EXHIBITION: { timeOfDay: "AFTERNOON", weather: "ANY", isIndoor: true },
  WALK: { timeOfDay: "AFTERNOON", weather: "SUNNY", isIndoor: false },
  ACTIVITY: { timeOfDay: "MORNING", weather: "SUNNY", isIndoor: false },
  SHOPPING: { timeOfDay: "AFTERNOON", weather: "ANY", isIndoor: true },
  OTHER: { timeOfDay: "ANY", weather: "ANY", isIndoor: false },
};

interface SpotFormPanelProps {
  onSubmit: (data: CreateSpotRequest) => Promise<void>;
  saving: boolean;
  onLocationChange?: (location: { address: string; lat: number; lng: number } | null) => void;
}

interface FormValues {
  title: string;
  category: SpotCategory;
  area: string;
  crewNote: string;
  tags: string;
  description: string;
  address: string;
  addressDetail: string;
  latitude: number;
  longitude: number;
  sido: string;
  sigungu: string;
  dong: string;
  blogUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  naverPlaceId: string;
  kakaoPlaceId: string;
  bestTimeOfDay: string;
  bestWeatherCondition: string;
  isIndoor: boolean;
}

export default function SpotFormPanel({ onSubmit, saving, onLocationChange }: SpotFormPanelProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      category: "OTHER",
      area: "",
      crewNote: "",
      tags: "",
      description: "",
      address: "",
      addressDetail: "",
      latitude: 0,
      longitude: 0,
      sido: "",
      sigungu: "",
      dong: "",
      blogUrl: "",
      instagramUrl: "",
      websiteUrl: "",
      naverPlaceId: "",
      kakaoPlaceId: "",
      bestTimeOfDay: "",
      bestWeatherCondition: "",
      isIndoor: false,
    },
  });

  const address = watch("address");
  const sido = watch("sido");
  const sigungu = watch("sigungu");
  const dong = watch("dong");

  const handleAddressSelect = (data: {
    address: string;
    detailAddress: string;
    fullAddress: string;
    coordinates: { lat: number; lng: number; source?: string } | null;
    addressData: { zonecode: string; roadAddress: string; jibunAddress: string; buildingName: string; sido: string; sigungu: string; bname: string };
  }) => {
    setValue("address", data.address);
    if (data.detailAddress) {
      setValue("addressDetail", data.detailAddress);
    }

    if (data.coordinates) {
      setValue("latitude", data.coordinates.lat);
      setValue("longitude", data.coordinates.lng);
      onLocationChange?.({ address: data.address, lat: data.coordinates.lat, lng: data.coordinates.lng });
    } else {
      onLocationChange?.(null);
    }

    // Daum Postcode addressData에서 지역 분류 자동 추출
    if (data.addressData) {
      const ad = data.addressData;
      if (ad.sido) setValue("sido", ad.sido);
      if (ad.sigungu) setValue("sigungu", ad.sigungu);
      if (ad.bname) {
        setValue("dong", ad.bname);
        const area = extractAreaFromAddress(data.address) || ad.bname;
        setValue("area", area);
      }
    } else {
      const area = extractAreaFromAddress(data.address);
      if (area) setValue("area", area);
    }
  };

  const doSubmit = async (values: FormValues) => {
    const req: CreateSpotRequest = {
      title: values.title,
      category: values.category,
      source: "CREW",
      crewNote: values.crewNote || undefined,
      description: values.description || undefined,
      address: values.addressDetail
        ? `${values.address} ${values.addressDetail}`
        : values.address,
      latitude: values.latitude,
      longitude: values.longitude,
      area: values.area,
      sido: values.sido || undefined,
      sigungu: values.sigungu || undefined,
      dong: values.dong || undefined,
      blogUrl: values.blogUrl || undefined,
      instagramUrl: values.instagramUrl || undefined,
      websiteUrl: values.websiteUrl || undefined,
      naverPlaceId: values.naverPlaceId || undefined,
      kakaoPlaceId: values.kakaoPlaceId || undefined,
      tags: values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
      mediaItems: mediaItems.length > 0
        ? mediaItems.map((m) => ({
            s3Key: m.s3Key,
            mediaType: m.mediaType,
            thumbnailS3Key: m.thumbnailS3Key,
            durationSec: m.durationSec,
            displayOrder: m.displayOrder,
            fileSizeBytes: m.fileSizeBytes,
            mimeType: m.mimeType,
          }))
        : undefined,
      creatorName: "crew",
      bestTimeOfDay: (values.bestTimeOfDay as TimeOfDay) || undefined,
      bestWeatherCondition: (values.bestWeatherCondition as WeatherCondition) || undefined,
      isIndoor: values.isIndoor || undefined,
    };
    await onSubmit(req);
    reset();
    setMediaItems([]);
    onLocationChange?.(null);
  };

  return (
    <form onSubmit={handleSubmit(doSubmit)} className="space-y-4">
      {/* 업체명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">업체명 *</label>
        <input
          {...register("title", { required: "업체명을 입력하세요" })}
          placeholder="예: 바모스커피 연남점"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
      </div>

      {/* 주소 검색 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">주소 *</label>
        <DaumAddressEmbed
          onAddressSelect={handleAddressSelect}
          initialAddress={address}
        />
        <input type="hidden" {...register("address", { required: "주소를 검색해주세요" })} />
        {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
        {address && (
          <input
            {...register("addressDetail")}
            placeholder="상세주소 (예: 2층, 101호)"
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        )}
      </div>

      {/* 지역 분류 (자동 채움) */}
      {address && (sido || sigungu || dong) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs font-medium text-blue-700 mb-1">지역 분류 (자동)</p>
          <div className="flex gap-3 text-sm text-blue-800">
            {sido && <span>{sido}</span>}
            {sigungu && <span>{'>'} {sigungu}</span>}
            {dong && <span>{'>'} {dong}</span>}
          </div>
        </div>
      )}

      {/* 카테고리 + 지역 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
          <select
            {...register("category", { required: "카테고리를 선택하세요" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {Object.entries(SPOT_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">지역 *</label>
          <select
            {...register("area", { required: "지역을 선택하세요" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">선택</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          {errors.area && <p className="mt-1 text-xs text-red-500">{errors.area.message}</p>}
        </div>
      </div>

      {/* crewNote */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">크루 노트 * (한줄 추천)</label>
        <textarea
          {...register("crewNote", {
            required: "크루 노트를 입력하세요",
            maxLength: { value: 200, message: "200자 이내로 입력하세요" },
          })}
          rows={2}
          placeholder="이 Spot만의 특별한 포인트를 한줄로 설명해주세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {errors.crewNote && <p className="mt-1 text-xs text-red-500">{errors.crewNote.message}</p>}
      </div>

      {/* 날씨/시간 정보 */}
      <div className="space-y-3 bg-sky-50 border border-sky-200 rounded-md p-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-sky-700">날씨/시간 정보</label>
          <button
            type="button"
            onClick={() => {
              const cat = watch("category");
              const defaults = AUTO_TAG_MAP[cat] ?? AUTO_TAG_MAP.OTHER;
              if (defaults && !watch("bestTimeOfDay")) setValue("bestTimeOfDay", defaults.timeOfDay);
              if (defaults && !watch("bestWeatherCondition")) setValue("bestWeatherCondition", defaults.weather);
              if (defaults && !watch("isIndoor")) setValue("isIndoor", defaults.isIndoor);
            }}
            className="text-xs px-2 py-1 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded transition-colors"
          >
            자동 태깅
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-sky-600 mb-1">추천 시간대</label>
            <select
              {...register("bestTimeOfDay")}
              className="w-full px-3 py-2 border border-sky-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">선택 안함</option>
              {Object.entries(TIME_OF_DAY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-sky-600 mb-1">추천 날씨</label>
            <select
              {...register("bestWeatherCondition")}
              className="w-full px-3 py-2 border border-sky-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">선택 안함</option>
              {Object.entries(WEATHER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-sky-700">
          <input
            type="checkbox"
            {...register("isIndoor")}
            className="rounded border-sky-300 text-sky-600 focus:ring-sky-500"
          />
          실내 장소
        </label>
      </div>

      {/* 미디어 */}
      <SpotMediaUpload value={mediaItems} onChange={setMediaItems} />

      {/* 태그 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">태그 (쉼표 구분)</label>
        <input
          {...register("tags")}
          placeholder="뷰맛집, 루프탑, 브런치"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* 외부 링크 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">외부 링크 (선택)</label>
        <input
          {...register("blogUrl")}
          placeholder="블로그 URL"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <input
          {...register("instagramUrl")}
          placeholder="Instagram URL"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <input
          {...register("websiteUrl")}
          placeholder="웹사이트 URL"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* 설명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
        <textarea
          {...register("description")}
          rows={2}
          placeholder="추가 설명..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* 숨은 필드 */}
      <input type="hidden" {...register("latitude", { valueAsNumber: true })} />
      <input type="hidden" {...register("longitude", { valueAsNumber: true })} />
      <input type="hidden" {...register("sido")} />
      <input type="hidden" {...register("sigungu")} />
      <input type="hidden" {...register("dong")} />
      <input type="hidden" {...register("naverPlaceId")} />
      <input type="hidden" {...register("kakaoPlaceId")} />

      {/* 좌표 표시 */}
      {address && watch("latitude") !== 0 && (
        <p className="text-xs text-gray-400">
          좌표: {watch("latitude").toFixed(4)}, {watch("longitude").toFixed(4)}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            저장 중...
          </>
        ) : (
          "Spot 저장"
        )}
      </button>
    </form>
  );
}
