import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Save, Plus } from "lucide-react";
import AddressSearchWithMap from "./AddressSearchWithMap";
import ImageUpload from "./ImageUpload";
import ExistingImageManager from "./ExistingImageManager";

const CATEGORIES = [
  { value: "cafe", label: "카페" },
  { value: "restaurant", label: "음식점" },
  { value: "exhibition", label: "전시/갤러리" },
  { value: "shopping", label: "쇼핑" },
  { value: "culture", label: "문화시설" },
  { value: "entertainment", label: "엔터테인먼트" },
  { value: "beauty", label: "뷰티/헬스" },
  { value: "education", label: "교육" },
  { value: "other", label: "기타" },
];

const BUSINESS_HOURS_TEMPLATE = {
  monday: { open: "09:00", close: "22:00" },
  tuesday: { open: "09:00", close: "22:00" },
  wednesday: { open: "09:00", close: "22:00" },
  thursday: { open: "09:00", close: "22:00" },
  friday: { open: "09:00", close: "22:00" },
  saturday: { open: "10:00", close: "23:00" },
  sunday: { open: "10:00", close: "23:00" },
};

const DAYS = [
  { key: "monday", label: "월요일" },
  { key: "tuesday", label: "화요일" },
  { key: "wednesday", label: "수요일" },
  { key: "thursday", label: "목요일" },
  { key: "friday", label: "금요일" },
  { key: "saturday", label: "토요일" },
  { key: "sunday", label: "일요일" },
];

export default function StoreFormModal({ isOpen, onClose, onSubmit, store = null, loading = false, onRefreshStore }) {
  const [addressData, setAddressData] = useState(null);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [businessHours, setBusinessHours] = useState(BUSINESS_HOURS_TEMPLATE);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm();

  const isEdit = !!store;

  useEffect(() => {
    if (isOpen) {
      if (store) {
        // 수정 모드: 기존 데이터 로드
        reset({
          name: store.name || "",
          category: store.category || "",
          description: store.description || "",
          phone: store.contact?.phone || "",
          website: store.contact?.website || "",
          instagram: store.contact?.instagram || "",
        });

        setAddressData({
          address: store.location?.address || "",
          coordinates: store.location?.coordinates
            ? {
                lat: store.location.coordinates.coordinates[1],
                lng: store.location.coordinates.coordinates[0],
              }
            : null,
        });

        setTags(store.tags || []);
        setBusinessHours(store.businessHours || BUSINESS_HOURS_TEMPLATE);
        setUploadedImages([]);
      } else {
        // 생성 모드: 초기화
        reset();
        setAddressData(null);
        setTags([]);
        setBusinessHours(BUSINESS_HOURS_TEMPLATE);
        setUploadedImages([]);
      }
    }
  }, [isOpen, store, reset]);

  // refreshTrigger가 변경될 때마다 부모 컴포넌트의 쿼리 무효화
  useEffect(() => {
    if (refreshTrigger > 0 && onRefreshStore) {
      onRefreshStore();
    }
  }, [refreshTrigger, onRefreshStore]);

  const handleAddressSelect = (data) => {
    setAddressData(data);

    // 지역 정보 자동 입력
    if (data.addressData) {
      const area = data.addressData.bname || data.addressData.sigungu;
      const district = data.addressData.sigungu;

      setValue("area", area);
      setValue("district", district);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleImagesChange = (images) => {
    setUploadedImages(images);
  };

  const handleImageDeleted = () => {
    setRefreshTrigger((prev) => prev + 1);
    // 부모 컴포넌트의 쿼리 무효화
    if (onRefreshStore) {
      onRefreshStore();
    }
  };

  const handleRefreshStore = async () => {
    // 매장 정보 새로고침 로직 (부모 컴포넌트에서 처리)
    setRefreshTrigger((prev) => prev + 1);
    if (onRefreshStore) {
      onRefreshStore();
    }
  };

  const handleBusinessHourChange = (day, field, value) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const onFormSubmit = (data) => {
    if (!addressData?.address) {
      alert("주소를 입력해주세요.");
      return;
    }

    const formData = {
      name: data.name,
      category: data.category,
      location: {
        address: addressData.address,
        coordinates: addressData.coordinates
          ? {
              type: "Point",
              coordinates: [addressData.coordinates.lng, addressData.coordinates.lat],
            }
          : null,
        area: data.area || addressData.addressData?.bname,
        district: data.district || addressData.addressData?.sigungu,
      },
      contact: {
        phone: data.phone,
        website: data.website,
        instagram: data.instagram,
      },
      businessHours,
      description: data.description,
      tags,
    };

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{isEdit ? "매장 수정" : "새 매장 등록"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">매장명 *</label>
              <input
                {...register("name", { required: "매장명을 입력하세요" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="매장명을 입력하세요"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 *</label>
              <select
                {...register("category", { required: "카테고리를 선택하세요" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">카테고리 선택</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>
          </div>

          {/* 주소 검색 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">주소 *</label>
            <AddressSearchWithMap onAddressSelect={handleAddressSelect} initialAddress={addressData?.address} initialCoordinates={addressData?.coordinates} />
          </div>

          {/* 연락처 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
              <input {...register("phone")} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="02-1234-5678" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">웹사이트</label>
              <input {...register("website")} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">인스타그램</label>
              <input {...register("instagram")} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="@username" />
            </div>
          </div>

          {/* 영업시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">영업시간</label>
            <div className="space-y-2">
              {DAYS.map((day) => (
                <div key={day.key} className="flex items-center space-x-4">
                  <div className="w-16 text-sm text-gray-600">{day.label}</div>
                  <input
                    type="time"
                    value={businessHours[day.key]?.open || ""}
                    onChange={(e) => handleBusinessHourChange(day.key, "open", e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-gray-500">~</span>
                  <input
                    type="time"
                    value={businessHours[day.key]?.close || ""}
                    onChange={(e) => handleBusinessHourChange(day.key, "close", e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
            <div className="flex space-x-2 mb-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="태그를 입력하세요"
              />
              <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-blue-600 hover:text-blue-800">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="매장에 대한 설명을 입력하세요"
            />
          </div>

          {/* 이미지 관리 */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">이미지 관리</h3>

              {/* 기존 이미지 관리 (수정 모드일 때만) */}
              {isEdit && store?._id && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">현재 업로드된 이미지</h4>
                  <ExistingImageManager storeId={store._id} mainBannerImages={store.mainBannerImages || []} onImageDeleted={handleImageDeleted} onRefreshStore={handleRefreshStore} />
                </div>
              )}

              {/* 새 이미지 업로드 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">{isEdit ? "새 이미지 추가" : "이미지 업로드"}</h4>
                <ImageUpload onImagesChange={handleImagesChange} maxImages={5} storeId={isEdit ? store?._id : null} initialImages={uploadedImages} onRefreshStore={handleRefreshStore} />
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? "저장 중..." : isEdit ? "수정" : "등록"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
