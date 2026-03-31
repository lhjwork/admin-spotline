import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { recommendationAPI, storeAPI } from "../services/api";
import { ArrowLeft, MapPin, Clock, Check, X, Settings, Eye, Save, Trash2, Edit } from "lucide-react";
import type { NearbyStore, SelectedRecommendation, RecommendationCategory } from "../types";

export default function RecommendationSettings() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"nearby" | "area">("nearby");
  const [selectedStores, setSelectedStores] = useState<Map<string, SelectedRecommendation>>(new Map());
  const [showPreview, setShowPreview] = useState(false);
  const [editingRecommendation, setEditingRecommendation] = useState<string | null>(null);

  // 근처 매장 및 현재 매장 정보 조회
  const { data: nearbyData, isLoading: nearbyLoading } = useQuery(["nearbyStores", storeId], () => recommendationAPI.getNearbyStores(storeId!), {
    enabled: !!storeId,
    select: (response) => response.data,
  });

  // 추천 카테고리 목록 조회
  const { data: categories } = useQuery("recommendationCategories", () => recommendationAPI.getCategories(), {
    select: (response) => response.data,
  });

  // 추천 생성 뮤테이션
  const createRecommendationsMutation = useMutation((selectedStores: SelectedRecommendation[]) => recommendationAPI.createSelectedRecommendations(storeId!, selectedStores), {
    onSuccess: () => {
      queryClient.invalidateQueries(["nearbyStores", storeId]);
      setSelectedStores(new Map());
      setShowPreview(false);
    },
  });

  // 추천 삭제 뮤테이션
  const deleteRecommendationMutation = useMutation((recommendationId: string) => recommendationAPI.deleteRecommendation(recommendationId), {
    onSuccess: () => {
      queryClient.invalidateQueries(["nearbyStores", storeId]);
    },
  });

  const handleStoreSelect = (store: NearbyStore, selected: boolean) => {
    const newSelectedStores = new Map(selectedStores);

    if (selected) {
      const suggestedCategory = store.suggestedCategories[0] || "next_meal";
      newSelectedStores.set(store.id, {
        toStoreId: store.id,
        category: suggestedCategory,
        priority: 5,
        description: `${store.name}에서의 추천`,
      });
    } else {
      newSelectedStores.delete(store.id);
    }

    setSelectedStores(newSelectedStores);
  };

  const handleCategoryChange = (storeId: string, category: string) => {
    const newSelectedStores = new Map(selectedStores);
    const existing = newSelectedStores.get(storeId);
    if (existing) {
      newSelectedStores.set(storeId, { ...existing, category });
      setSelectedStores(newSelectedStores);
    }
  };

  const handlePriorityChange = (storeId: string, priority: number) => {
    const newSelectedStores = new Map(selectedStores);
    const existing = newSelectedStores.get(storeId);
    if (existing) {
      newSelectedStores.set(storeId, { ...existing, priority });
      setSelectedStores(newSelectedStores);
    }
  };

  const handleDescriptionChange = (storeId: string, description: string) => {
    const newSelectedStores = new Map(selectedStores);
    const existing = newSelectedStores.get(storeId);
    if (existing) {
      newSelectedStores.set(storeId, { ...existing, description });
      setSelectedStores(newSelectedStores);
    }
  };

  const handleSaveRecommendations = () => {
    const recommendationsToSave = Array.from(selectedStores.values());
    createRecommendationsMutation.mutate(recommendationsToSave);
  };

  const handleDeleteRecommendation = (recommendationId: string) => {
    if (confirm("이 추천을 삭제하시겠습니까?")) {
      deleteRecommendationMutation.mutate(recommendationId);
    }
  };

  const getCategoryLabel = (value: string) => {
    return categories?.find((cat) => cat.value === value)?.label || value;
  };

  if (nearbyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!nearbyData) {
    return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">매장 정보를 불러오는데 실패했습니다.</div>;
  }

  const { currentStore, nearbyStores, sameAreaStores, existingRecommendations } = nearbyData;
  const activeStores = activeTab === "nearby" ? nearbyStores : sameAreaStores;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate("/stores")} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5 mr-2" />
          매장 목록으로
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">추천 설정: {currentStore.name}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {currentStore.category} • {currentStore.area}
          </p>
        </div>
      </div>

      {/* 현재 매장 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">{currentStore.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{currentStore.shortDescription}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {currentStore.address}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 기존 추천 관계 */}
      {existingRecommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">현재 설정된 추천 ({existingRecommendations.length}개)</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {existingRecommendations.map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{rec.toStore.name}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{getCategoryLabel(rec.category)}</span>
                        <span className="text-sm text-gray-500">우선순위: {rec.priority}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{rec.toStore.location.address}</span>
                        {rec.distance && (
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {rec.walkingTime}분 ({rec.distance}m)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setEditingRecommendation(rec.id)} className="text-blue-600 hover:text-blue-900" title="수정">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteRecommendation(rec.id)} className="text-red-600 hover:text-red-900" title="삭제">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab("nearby")}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === "nearby" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              근처 매장 (10km) ({nearbyStores.length}개)
            </button>
            <button
              onClick={() => setActiveTab("area")}
              className={`py-4 px-6 text-sm font-medium border-b-2 ${
                activeTab === "area" ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              같은 지역 ({currentStore.area}) ({sameAreaStores.length}개)
            </button>
          </nav>
        </div>

        {/* 매장 목록 */}
        <div className="p-6">
          <div className="space-y-4">
            {activeStores.map((store) => {
              const isSelected = selectedStores.has(store.id);
              const selectedData = selectedStores.get(store.id);

              return (
                <div key={store.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleStoreSelect(store, e.target.checked)}
                      disabled={store.isAlreadyConnected}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{store.name}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{store.category}</span>
                        {store.isAlreadyConnected && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            연결됨
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mt-1">{store.shortDescription}</p>

                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {store.address}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {store.walkingTime}분 ({store.distance}m)
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {store.suggestedCategories.map((category) => (
                          <span key={category} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            {getCategoryLabel(category)}
                          </span>
                        ))}
                      </div>

                      {/* 선택된 매장의 설정 */}
                      {isSelected && selectedData && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">추천 카테고리</label>
                              <select
                                value={selectedData.category}
                                onChange={(e) => handleCategoryChange(store.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              >
                                {categories?.map((cat) => (
                                  <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">우선순위 (1-10)</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={selectedData.priority}
                                onChange={(e) => handlePriorityChange(store.id, parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택사항)</label>
                              <input
                                type="text"
                                value={selectedData.description || ""}
                                onChange={(e) => handleDescriptionChange(store.id, e.target.value)}
                                placeholder="추천 이유를 입력하세요"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 선택된 매장 요약 및 저장 버튼 */}
      {selectedStores.size > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">선택된 매장 ({selectedStores.size}개)</h3>
              <div className="mt-2 space-y-1">
                {Array.from(selectedStores.entries()).map(([storeId, data]) => {
                  const store = [...nearbyStores, ...sameAreaStores].find((s) => s.id === storeId);
                  return (
                    <div key={storeId} className="text-sm text-gray-600">
                      • {store?.name} - {getCategoryLabel(data.category)} (우선순위: {data.priority})
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button onClick={() => setShowPreview(true)} className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                <Eye className="h-4 w-4" />
                <span>미리보기</span>
              </button>

              <button
                onClick={handleSaveRecommendations}
                disabled={createRecommendationsMutation.isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{createRecommendationsMutation.isLoading ? "저장 중..." : "저장"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 미리보기 모달 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">추천 미리보기</h3>
                <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {Array.from(selectedStores.entries()).map(([storeId, data]) => {
                  const store = [...nearbyStores, ...sameAreaStores].find((s) => s.id === storeId);
                  return (
                    <div key={storeId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{store?.name}</h4>
                          <p className="text-sm text-gray-600">{data.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{getCategoryLabel(data.category)}</span>
                          <p className="text-sm text-gray-500 mt-1">우선순위: {data.priority}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowPreview(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  취소
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    handleSaveRecommendations();
                  }}
                  disabled={createRecommendationsMutation.isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  확인 및 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
