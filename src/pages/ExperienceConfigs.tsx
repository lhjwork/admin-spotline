import { useState, useEffect } from "react";
import { experienceConfigAPI } from "../services/api";
import { ExperienceConfig, ExperienceResult } from "../types";
import { formatDateKST } from "../utils/dateUtils";

export default function ExperienceConfigs() {
  const [configs, setConfigs] = useState<ExperienceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewResults, setPreviewResults] = useState<{ [key: string]: ExperienceResult[] }>({});
  const [previewLoading, setPreviewLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await experienceConfigAPI.getConfigs();
      if (response.data.success) {
        setConfigs(response.data.data);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "체험 설정을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSetAsDefault = async (id: string) => {
    try {
      const response = await experienceConfigAPI.setAsDefault(id);
      if (response.data.success) {
        await loadConfigs();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "기본 설정 변경에 실패했습니다");
    }
  };

  const handlePreview = async (id: string) => {
    try {
      setPreviewLoading({ ...previewLoading, [id]: true });
      const response = await experienceConfigAPI.previewConfig(id, 5);
      if (response.data.success) {
        setPreviewResults({ ...previewResults, [id]: response.data.data.results });
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "미리보기 실패");
    } finally {
      setPreviewLoading({ ...previewLoading, [id]: false });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await experienceConfigAPI.updateConfig(id, { isActive: !isActive });
      if (response.data.success) {
        await loadConfigs();
      }
    } catch (error: any) {
      setError(error.response?.data?.message || "상태 변경에 실패했습니다");
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "fixed":
        return "고정 매장";
      case "random":
        return "랜덤 선택";
      case "area_based":
        return "지역 기반";
      case "weighted":
        return "가중치 기반";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "fixed":
        return "bg-blue-100 text-blue-800";
      case "random":
        return "bg-green-100 text-green-800";
      case "area_based":
        return "bg-purple-100 text-purple-800";
      case "weighted":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">체험 설정을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SpotLine 체험 설정</h1>
          <p className="text-gray-600 mt-1">"SpotLine 체험하기" 버튼의 동작을 설정하고 관리합니다</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          새 체험 설정 추가
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">체험 설정 목록</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {configs.map((config) => (
            <div key={config._id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {config.name}
                      {config.isDefault && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">기본 설정</span>}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(config.type)}`}>{getTypeLabel(config.type)}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {config.isActive ? "활성" : "비활성"}
                    </span>
                  </div>

                  <p className="text-gray-600 mt-1">{config.description}</p>

                  <div className="mt-2 text-sm text-gray-500 space-y-1">
                    <div>
                      우선순위: {config.priority} | 사용 횟수: {config.usageCount}회
                    </div>
                    <div>생성일: {formatDateKST(config.createdAt)}</div>

                    {/* 설정 상세 정보 */}
                    {config.type === "fixed" && config.settings.qrId && (
                      <div>
                        고정 매장: <code className="bg-gray-100 px-1 rounded">{config.settings.qrId}</code>
                      </div>
                    )}
                    {config.type === "area_based" && config.settings.areas && <div>대상 지역: {config.settings.areas.join(", ")}</div>}
                    {config.type === "weighted" && config.settings.weights && <div>가중치 설정: {config.settings.weights.length}개 매장</div>}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button onClick={() => handlePreview(config._id)} disabled={previewLoading[config._id]} className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50">
                    {previewLoading[config._id] ? "미리보기 중..." : "미리보기"}
                  </button>

                  {!config.isDefault && (
                    <button onClick={() => handleSetAsDefault(config._id)} className="text-green-600 hover:text-green-800 text-sm font-medium">
                      기본으로 설정
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleActive(config._id, config.isActive)}
                    className={`text-sm font-medium ${config.isActive ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}
                  >
                    {config.isActive ? "비활성화" : "활성화"}
                  </button>
                </div>
              </div>

              {/* 미리보기 결과 */}
              {previewResults[config._id] && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">미리보기 결과 (5회 테스트)</h4>
                  <div className="space-y-2">
                    {previewResults[config._id].map((result, index) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                        <span className="w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                        <span>{result.storeName}</span>
                        <span className="text-gray-400">({result.area})</span>
                        <code className="bg-white px-1 rounded text-xs">{result.qrId}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {configs.length === 0 && <div className="p-6 text-center text-gray-500">등록된 체험 설정이 없습니다.</div>}
      </div>

      {/* 체험 설정 생성 모달은 별도 컴포넌트로 분리 예정 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">새 체험 설정 추가</h3>
            <p className="text-gray-600 mb-4">체험 설정 생성 기능은 곧 추가될 예정입니다.</p>
            <button onClick={() => setShowCreateModal(false)} className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700">
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
