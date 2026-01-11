import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { recommendationAPI, storeAPI } from "../services/api";
import { Plus, ArrowRight, Trash2 } from "lucide-react";
import { formatDateKST } from "../utils/dateUtils";
import { useForm } from "react-hook-form";

interface CreateRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateRecommendationModal({ isOpen, onClose, onSuccess }: CreateRecommendationModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<any>();
  const queryClient = useQueryClient();

  // 매장 목록 조회
  const { data: storesData } = useQuery("stores-for-recommendation", () => storeAPI.getStores({ limit: 1000 }), {
    select: (response) => response.data.data?.stores || [],
  });

  const createMutation = useMutation((data: any) => recommendationAPI.createRecommendation(data), {
    onSuccess: () => {
      onSuccess();
      onClose();
      reset();
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const fromStoreId = watch("fromStore");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">새 추천 관계 생성</h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">출발 매장</label>
              <select
                {...register("fromStore", { required: "출발 매장을 선택하세요" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">매장 선택</option>
                {storesData?.map((store: any) => (
                  <option key={store._id} value={store._id}>
                    {store.name} ({store.category})
                  </option>
                ))}
              </select>
              {errors['fromStore'] && <p className="mt-1 text-sm text-red-600">{String(errors['fromStore']?.message)}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">추천 매장</label>
              <select
                {...register("toStore", { required: "추천 매장을 선택하세요" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">매장 선택</option>
                {storesData
                  ?.filter((store: any) => store._id !== fromStoreId)
                  .map((store: any) => (
                    <option key={store._id} value={store._id}>
                      {store.name} ({store.category})
                    </option>
                  ))}
              </select>
              {errors['toStore'] && <p className="mt-1 text-sm text-red-600">{String(errors['toStore']?.message)}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">추천 이유</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="추천하는 이유를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                {...register("category", { required: "카테고리를 선택하세요" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">카테고리 선택</option>
                <option value="next_meal">다음 식사</option>
                <option value="dessert">디저트</option>
                <option value="activity">액티비티</option>
                <option value="shopping">쇼핑</option>
                <option value="culture">문화</option>
                <option value="rest">휴식</option>
              </select>
              {errors['category'] && <p className="mt-1 text-sm text-red-600">{String(errors['category']?.message)}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
              <input
                {...register("priority", { min: 1, max: 10 })}
                type="number"
                min="1"
                max="10"
                defaultValue="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">1(낮음) ~ 10(높음)</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                취소
              </button>
              <button type="submit" disabled={createMutation.isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                {createMutation.isLoading ? "생성 중..." : "생성"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Recommendations() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    fromStore: "",
    toStore: "",
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(["recommendations", filters], () => recommendationAPI.getRecommendations(filters), {
    select: (response) => response.data.data,
    keepPreviousData: true,
  });

  const deleteMutation = useMutation((id: string) => recommendationAPI.deleteRecommendation(id), {
    onSuccess: () => {
      queryClient.invalidateQueries(["recommendations"]);
    },
  });

  const handleDelete = (recommendation: any) => {
    if (confirm(`${recommendation.fromStore.name} → ${recommendation.toStore.name} 추천 관계를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(recommendation._id);
    }
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries(["recommendations"]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">데이터를 불러오는데 실패했습니다: {(error as any)?.message || '알 수 없는 오류'}</div>;
  }

  const recommendations = data?.recommendations || [];
  const pagination = {
    count: data?.totalCount || 0,
    total: data?.totalPages || 1,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">추천 관계 관리</h1>
          <p className="text-gray-600">매장 간 추천 관계를 설정하고 관리하세요</p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          <span>새 추천 관계</span>
        </button>
      </div>

      {/* 추천 관계 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {recommendations.length === 0 ? (
          <div className="p-8 text-center">
            <ArrowRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 추천 관계가 없습니다</h3>
            <p className="text-gray-600 mb-6">매장 간 추천 관계를 설정해보세요.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              첫 추천 관계 추가
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">출발 매장</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추천 매장</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">우선순위</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추천 이유</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recommendations.map((rec: any) => (
                  <tr key={rec._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rec.fromStore.name}</div>
                        <div className="text-sm text-gray-500">{rec.fromStore.category || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <ArrowRight className="h-5 w-5 text-gray-400 mx-auto" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rec.toStore.name}</div>
                        <div className="text-sm text-gray-500">{rec.toStore.category || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{rec.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{rec.priority || 5}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{rec.description || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateKST(rec.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleDelete(rec)} className="text-red-600 hover:text-red-900" title="삭제">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination && recommendations.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  총 <span className="font-medium">{pagination.count}</span>개 중 <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span>-
                  <span className="font-medium">{Math.min(filters.page * filters.limit, pagination.count)}</span>개 표시
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={filters.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    이전
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {filters.page} / {pagination.total}
                  </span>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(pagination.total, prev.page + 1) }))}
                    disabled={filters.page === pagination.total}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    다음
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateRecommendationModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
    </div>
  );
}
