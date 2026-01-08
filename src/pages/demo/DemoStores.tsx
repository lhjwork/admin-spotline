import { useState, useEffect } from "react";
import { demoStoreAPI } from "../services/api";
import { DemoStore } from "../types";
import { formatDateKST } from "../utils/dateUtils";
import { ExternalLink, Edit, Power, Plus, AlertTriangle } from "lucide-react";

export default function DemoStores() {
  const [demoStores, setDemoStores] = useState<DemoStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadDemoStores();
  }, []);

  const loadDemoStores = async () => {
    try {
      setLoading(true);
      const response = await demoStoreAPI.getDemoStores();
      if (response.data.success) {
        setDemoStores(response.data.data);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "데모 매장을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStore = async (id: string, currentStatus: boolean) => {
    try {
      const response = await demoStoreAPI.toggleDemoStore(id, !currentStatus);
      if (response.data.success) {
        await loadDemoStores();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "매장 상태 변경에 실패했습니다");
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      cafe: "카페",
      restaurant: "음식점",
      dessert: "디저트",
      culture: "문화공간",
      gallery: "갤러리",
      brunch: "브런치",
      food: "푸드",
      record: "레코드샵",
    };
    return categories[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      cafe: "bg-amber-100 text-amber-800",
      restaurant: "bg-red-100 text-red-800",
      dessert: "bg-pink-100 text-pink-800",
      culture: "bg-purple-100 text-purple-800",
      gallery: "bg-indigo-100 text-indigo-800",
      brunch: "bg-orange-100 text-orange-800",
      food: "bg-green-100 text-green-800",
      record: "bg-blue-100 text-blue-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">데모 매장을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">데모 매장 관리</h1>
          <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">데모 매장 안내</p>
                <p className="text-sm text-yellow-700 mt-1">데모 매장은 업주 소개용으로만 사용되며, 사용자 분석 데이터를 수집하지 않습니다. 실제 서비스와는 별도로 관리됩니다.</p>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          <span>새 데모 매장 추가</span>
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">데모 매장 목록</h2>
            <div className="text-sm text-gray-500">
              총 {demoStores.length}개 매장 (활성: {demoStores.filter((s) => s.isActive).length}개)
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {demoStores.map((store) => (
            <div key={store._id} className={`p-6 ${!store.isActive ? "bg-gray-50" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{store.name}</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">데모 전용</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(store.category)}`}>{getCategoryLabel(store.category)}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${store.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {store.isActive ? "활성" : "비활성"}
                    </span>
                  </div>

                  <p className="text-gray-600 mt-2">{store.shortDescription}</p>

                  <div className="mt-3 text-sm text-gray-500 space-y-1">
                    <div className="flex items-center space-x-4">
                      <span>
                        QR 코드: <code className="bg-gray-100 px-1 rounded">{store.qrCode.id}</code>
                      </span>
                      <span>지역: {store.location.area}</span>
                    </div>
                    <div>주소: {store.location.address}</div>
                    <div>생성일: {formatDateKST(store.createdAt)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <a
                    href={`http://localhost:4000/api/demo/stores/${store.qrCode.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>미리보기</span>
                  </a>

                  <button
                    onClick={() => {
                      /* TODO: 편집 모달 */
                    }}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    <Edit className="h-4 w-4" />
                    <span>편집</span>
                  </button>

                  <button
                    onClick={() => handleToggleStore(store._id, store.isActive)}
                    className={`flex items-center space-x-1 text-sm font-medium ${store.isActive ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}
                  >
                    <Power className="h-4 w-4" />
                    <span>{store.isActive ? "비활성화" : "활성화"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {demoStores.length === 0 && <div className="p-6 text-center text-gray-500">등록된 데모 매장이 없습니다.</div>}
      </div>

      {/* 데모 매장 생성 모달 (임시) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">새 데모 매장 추가</h3>
            <p className="text-gray-600 mb-4">데모 매장 생성 기능은 곧 추가될 예정입니다.</p>
            <button onClick={() => setShowCreateModal(false)} className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700">
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
