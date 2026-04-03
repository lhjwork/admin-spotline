import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Eye, XCircle, AlertTriangle } from "lucide-react";
import { reportAPI } from "../services/v2/reportAPI";
import type { ReportResponse } from "../services/v2/reportAPI";
import { toDataTablePagination } from "../types/v2";

const statusTabs = [
  { value: "PENDING", label: "미처리" },
  { value: "RESOLVED", label: "처리됨" },
  { value: "DISMISSED", label: "기각" },
] as const;

const reasonLabels: Record<string, string> = {
  SPAM: "스팸",
  INAPPROPRIATE: "부적절",
  HARASSMENT: "괴롭힘",
  OTHER: "기타",
};

export default function ModerationQueue() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [page, setPage] = useState(1);
  const [resolveTarget, setResolveTarget] = useState<ReportResponse | null>(null);
  const [moderatorNote, setModeratorNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", statusFilter, page],
    queryFn: () => reportAPI.getList({ status: statusFilter, page }),
    select: (res) => res.data,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { action: "HIDE_CONTENT" | "DISMISS"; moderatorNote?: string } }) =>
      reportAPI.resolve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["reports-pending-count"] });
      setResolveTarget(null);
      setModeratorNote("");
    },
  });

  const pagination = data ? toDataTablePagination(data) : null;

  const handleResolve = (action: "HIDE_CONTENT" | "DISMISS") => {
    if (!resolveTarget) return;
    resolveMutation.mutate({
      id: resolveTarget.id,
      data: { action, moderatorNote: moderatorNote || undefined },
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Shield className="h-6 w-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">모더레이션</h1>
      </div>

      {/* 상태 필터 탭 */}
      <div className="mb-4 flex gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              statusFilter === tab.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-500">로딩 중...</div>
      ) : !data || data.content.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-gray-500">
          신고 내역이 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">날짜</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">대상 댓글</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">작성자</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">사유</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.content.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-900">
                    {report.targetContent || "(삭제됨)"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {report.targetUserName || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      {reasonLabels[report.reason] || report.reason}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {report.status === "PENDING" && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">미처리</span>
                    )}
                    {report.status === "RESOLVED" && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">처리됨</span>
                    )}
                    {report.status === "DISMISSED" && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">기각</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {report.status === "PENDING" ? (
                      <button
                        onClick={() => setResolveTarget(report)}
                        className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
                      >
                        처리
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {report.action === "HIDE_CONTENT" ? "숨김" : "기각"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* 처리 모달 */}
      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              신고 처리
            </h3>

            <div className="mb-4 rounded bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-700">대상 댓글:</p>
              <p className="mt-1 text-gray-600">{resolveTarget.targetContent || "(삭제됨)"}</p>
              <p className="mt-2 text-xs text-gray-500">
                작성자: {resolveTarget.targetUserName || "-"} · 사유: {reasonLabels[resolveTarget.reason]}
              </p>
              {resolveTarget.description && (
                <p className="mt-1 text-xs text-gray-500">상세: {resolveTarget.description}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">관리자 메모 (선택)</label>
              <textarea
                value={moderatorNote}
                onChange={(e) => setModeratorNote(e.target.value)}
                rows={2}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="처리 사유를 메모하세요..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleResolve("HIDE_CONTENT")}
                disabled={resolveMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1 rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                숨김 처리
              </button>
              <button
                onClick={() => handleResolve("DISMISS")}
                disabled={resolveMutation.isPending}
                className="flex flex-1 items-center justify-center gap-1 rounded bg-gray-500 px-4 py-2 text-sm text-white hover:bg-gray-600 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                기각
              </button>
              <button
                onClick={() => { setResolveTarget(null); setModeratorNote(""); }}
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
