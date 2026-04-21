import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, CheckCircle, XCircle, MapPin, ExternalLink } from "lucide-react";
import { spotAPI } from "../services/v2/spotAPI";
import type { SpotDetailResponse } from "../types/v2";
import { toDataTablePagination } from "../types/v2";

const categoryLabels: Record<string, string> = {
  CAFE: "카페",
  RESTAURANT: "맛집",
  BAR: "바",
  NATURE: "자연",
  CULTURE: "문화",
  EXHIBITION: "전시",
  WALK: "산책",
  ACTIVITY: "액티비티",
  SHOPPING: "쇼핑",
  OTHER: "기타",
};

export default function UserContentReview() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [rejectTarget, setRejectTarget] = useState<SpotDetailResponse | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pending-spots", page],
    queryFn: () => spotAPI.getPendingSpots({ page }),
    select: (res) => res.data,
  });

  const approveMutation = useMutation({
    mutationFn: (slug: string) => spotAPI.approveSpot(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-spots"] });
      queryClient.invalidateQueries({ queryKey: ["pending-spots-count"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ slug, reason }: { slug: string; reason: string }) =>
      spotAPI.rejectSpot(slug, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-spots"] });
      queryClient.invalidateQueries({ queryKey: ["pending-spots-count"] });
      setRejectTarget(null);
      setRejectReason("");
    },
  });

  const handleApprove = (slug: string) => {
    if (!confirm("이 Spot을 승인하시겠습니까?")) return;
    approveMutation.mutate(slug);
  };

  const handleReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    rejectMutation.mutate({ slug: rejectTarget.slug, reason: rejectReason.trim() });
  };

  const pagination = data ? toDataTablePagination(data) : null;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <UserCheck className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">유저 콘텐츠 검토</h1>
        {pagination && (
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-sm font-medium text-amber-800">
            {pagination.count}건 대기
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">로딩 중...</div>
      ) : !data || data.content.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-500">
          검토 대기 중인 Spot이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {data.content.map((spot) => (
            <div
              key={spot.id}
              className="rounded-lg border border-gray-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{spot.title}</h3>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {categoryLabels[spot.category] || spot.category}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {spot.address}
                  </div>

                  {spot.description && (
                    <p className="mt-2 text-sm text-gray-600">{spot.description}</p>
                  )}

                  {spot.tags && spot.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {spot.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                    <span>작성자: {spot.creatorName || "익명"}</span>
                    <span>{new Date(spot.createdAt).toLocaleDateString("ko-KR")}</span>
                    {spot.blogUrl && (
                      <a href={spot.blogUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                        <ExternalLink className="h-3 w-3" />
                        블로그
                      </a>
                    )}
                  </div>
                </div>

                {/* 미디어 미리보기 */}
                {spot.media && spot.media.length > 0 && (
                  <div className="flex gap-2">
                    {spot.media.slice(0, 2).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    ))}
                    {spot.media.length > 2 && (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
                        +{spot.media.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => handleApprove(spot.slug)}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  승인
                </button>
                <button
                  onClick={() => setRejectTarget(spot)}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  반려
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination && pagination.total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="rounded px-3 py-1 text-sm disabled:opacity-50"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {pagination.current} / {pagination.total}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.total}
            className="rounded px-3 py-1 text-sm disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}

      {/* 반려 모달 */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Spot 반려
            </h3>

            <div className="mb-4 rounded bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-700">{rejectTarget.title}</p>
              <p className="mt-1 text-gray-500">{rejectTarget.address}</p>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                반려 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                placeholder="반려 사유를 입력해주세요..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                className="flex-1 rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                반려 확인
              </button>
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
