import { useState, useEffect } from "react";
import { Trash2, Eye, AlertTriangle, Check, X } from "lucide-react";
import { s3UploadAPI } from "../services/upload/s3UploadAPI";

interface ExistingImageManagerProps {
  storeId: string;
  mainBannerImages?: string[]; // 메인 배너 이미지 배열
  onImageDeleted: () => void;
  onRefreshStore?: () => void; // 매장 정보 새로고침 콜백 추가
}

const S3_BASE_URL = "https://lhj-spotline-assets-2026.s3.ap-northeast-2.amazonaws.com";

export default function ExistingImageManager({ storeId, mainBannerImages = [], onImageDeleted, onRefreshStore }: ExistingImageManagerProps) {
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // 낙관적 업데이트를 위한 로컬 이미지 상태
  const [localImages, setLocalImages] = useState<string[]>(mainBannerImages);

  // props가 변경될 때 로컬 상태 동기화
  useEffect(() => {
    setLocalImages(mainBannerImages);
  }, [mainBannerImages]);

  // 이미지 URL 생성
  const getImageUrl = (imageKey: string) => {
    if (imageKey.startsWith("http")) {
      return imageKey; // 이미 전체 URL인 경우
    }
    return `${S3_BASE_URL}/${imageKey}`;
  };

  // 메인 배너 이미지 삭제
  // 메인 배너 이미지 삭제 (낙관적 업데이트)
  const handleDeleteMainBannerImage = async (imageKey: string) => {
    setDeletingImage(imageKey);

    // 낙관적 업데이트: 즉시 UI에서 이미지 제거
    const originalImages = [...localImages];
    setLocalImages((prev) => prev.filter((img) => img !== imageKey));
    setShowDeleteModal(null);

    try {
      await s3UploadAPI.deleteMainBannerImage(storeId, imageKey);

      // 성공 시 부모 컴포넌트에 알림
      onImageDeleted();
      if (onRefreshStore) {
        onRefreshStore();
      }

      alert("메인 배너 이미지가 삭제되었습니다.");
    } catch (error) {
      console.error("Main banner image delete error:", error);
      // 실패 시 원래 상태로 롤백
      setLocalImages(originalImages);
      alert("메인 배너 이미지 삭제에 실패했습니다.");
    } finally {
      setDeletingImage(null);
    }
  };

  // 삭제 확인 모달
  const DeleteConfirmModal = ({ imageKey }: { imageKey: string }) => (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setShowDeleteModal(null)} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">이미지 삭제 확인</h3>
            <button onClick={() => setShowDeleteModal(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">메인 배너 이미지를 삭제하시겠습니까?</p>
                <p className="text-xs text-gray-500 mt-1">이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </div>

            {/* 이미지 미리보기 */}
            <div className="mb-4">
              <img src={getImageUrl(imageKey)} alt="삭제할 이미지" className="w-full h-32 object-cover rounded border" />
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
            <button onClick={() => setShowDeleteModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              취소
            </button>
            <button
              onClick={() => handleDeleteMainBannerImage(imageKey)}
              disabled={deletingImage === imageKey}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {deletingImage === imageKey ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 이미지 미리보기 모달
  const ImagePreviewModal = ({ imageUrl }: { imageUrl: string }) => (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-75" onClick={() => setPreviewImage(null)} />

        <div className="relative max-w-4xl max-h-screen">
          <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75">
            <X className="h-6 w-6" />
          </button>
          <img src={imageUrl} alt="이미지 미리보기" className="max-w-full max-h-screen object-contain" />
        </div>
      </div>
    </div>
  );

  if (localImages.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
        <div className="text-gray-500">
          <p className="text-sm">업로드된 메인 배너 이미지가 없습니다.</p>
          <p className="text-xs mt-1">위의 이미지 업로드 섹션을 사용해서 이미지를 추가해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 메인 배너 이미지들 */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Check className="h-4 w-4 text-blue-600 mr-2" />
          메인 배너 이미지 ({localImages.length}개)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {localImages.map((imageKey, index) => (
            <div key={imageKey} className="relative">
              <img src={getImageUrl(imageKey)} alt={`메인 배너 이미지 ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm" />
              <div className="absolute top-1 right-1 flex space-x-1">
                <button
                  onClick={() => setPreviewImage(getImageUrl(imageKey))}
                  className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all"
                  title="이미지 크게 보기"
                >
                  <Eye className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(imageKey)}
                  disabled={deletingImage === imageKey}
                  className="p-1 bg-red-500 bg-opacity-80 text-white rounded-full hover:bg-opacity-100 transition-all disabled:opacity-50"
                  title="메인 배너 이미지 삭제"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
              <div className="absolute bottom-1 left-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">#{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">💡 메인 배너 이미지 관리 가이드</p>
          <ul className="text-xs space-y-1 ml-4 list-disc">
            <li>👁️ 눈 아이콘을 클릭하면 이미지를 크게 볼 수 있습니다</li>
            <li>🗑️ 휴지통 아이콘을 클릭하면 이미지를 삭제할 수 있습니다</li>
            <li>삭제된 이미지는 복구할 수 없으니 신중하게 선택해주세요</li>
            <li>새로운 이미지는 위의 업로드 섹션에서 추가할 수 있습니다</li>
            <li>최대 5개의 메인 배너 이미지를 업로드할 수 있습니다</li>
          </ul>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && <DeleteConfirmModal imageKey={showDeleteModal} />}

      {/* 이미지 미리보기 모달 */}
      {previewImage && <ImagePreviewModal imageUrl={previewImage} />}
    </div>
  );
}
