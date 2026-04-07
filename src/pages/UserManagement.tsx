import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import DataTable from "../components/DataTable";
import { userAPI } from "../services/v2/userAPI";
import type { UserAdminItem } from "../types/v2";
import { toDataTablePagination } from "../types/v2";
import { Eye, Ban, CheckCircle, X } from "lucide-react";

export default function UserManagement() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserAdminItem | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const queryClient = useQueryClient();

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setKeyword(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, statusFilter, keyword],
    queryFn: () => userAPI.getList({
      page,
      size: 20,
      status: statusFilter || undefined,
      keyword: keyword || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const springPage = data?.data;
  const users = springPage?.content ?? [];
  const pagination = springPage ? toDataTablePagination(springPage) : null;

  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      userAPI.suspend(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelectedUser(null);
      setSuspendReason("");
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (userId: string) => userAPI.unsuspend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelectedUser(null);
    },
  });

  const columns = [
    {
      key: "nickname",
      label: "닉네임",
      render: (_val: string, row: UserAdminItem) => (
        <div className="flex items-center gap-2">
          {row.avatar ? (
            <img src={row.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="h-7 w-7 rounded-full bg-gray-200" />
          )}
          <span className="font-medium">{row.nickname}</span>
        </div>
      ),
    },
    { key: "email", label: "이메일" },
    { key: "role", label: "역할" },
    {
      key: "suspended",
      label: "상태",
      render: (val: boolean) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          val ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}>
          {val ? "정지" : "활성"}
        </span>
      ),
    },
    {
      key: "followersCount",
      label: "팔로워",
      render: (val: number) => val.toLocaleString(),
    },
    {
      key: "createdAt",
      label: "가입일",
      render: (val: string) => new Date(val).toLocaleDateString("ko-KR"),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">유저 관리</h1>
        <p className="text-sm text-gray-500 mt-1">플랫폼 유저를 관리합니다</p>
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "", label: "전체" },
          { key: "ACTIVE", label: "활성" },
          { key: "SUSPENDED", label: "정지" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setPage(1); }}
            className={`px-3 py-1.5 text-sm rounded-md ${
              statusFilter === tab.key
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="닉네임 또는 이메일 검색..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
        {pagination && (
          <span className="text-sm text-gray-500 self-center">총 {pagination.count}명</span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        actions={(row: UserAdminItem) => (
          <div className="py-1">
            <button
              onClick={() => setSelectedUser(row)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye className="h-4 w-4 mr-2" /> 상세보기
            </button>
            {row.suspended ? (
              <button
                onClick={() => {
                  if (window.confirm(`"${row.nickname}" 유저의 정지를 해제하시겠습니까?`)) {
                    unsuspendMutation.mutate(row.id);
                  }
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" /> 정지 해제
              </button>
            ) : (
              <button
                onClick={() => { setSelectedUser(row); setSuspendReason(""); }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Ban className="h-4 w-4 mr-2" /> 정지
              </button>
            )}
          </div>
        )}
      />

      {/* 유저 상세 모달 */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">유저 상세</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 프로필 */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gray-200" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{selectedUser.nickname}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedUser.suspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}>
                      {selectedUser.suspended ? "정지" : "활성"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  {selectedUser.bio && <p className="text-sm text-gray-600 mt-1">{selectedUser.bio}</p>}
                </div>
              </div>

              {/* 활동 통계 */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Spot", value: selectedUser.spotsCount },
                  { label: "SpotLine", value: selectedUser.spotLinesCount },
                  { label: "Blog", value: selectedUser.blogsCount },
                  { label: "팔로워", value: selectedUser.followersCount },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* 메타 정보 */}
              <div className="text-sm text-gray-500 space-y-1 mb-4">
                <p>가입일: {new Date(selectedUser.createdAt).toLocaleDateString("ko-KR")}</p>
                <p>역할: {selectedUser.role}</p>
                {selectedUser.suspendedAt && (
                  <p className="text-red-500">정지일: {new Date(selectedUser.suspendedAt).toLocaleDateString("ko-KR")}</p>
                )}
              </div>

              {/* 정지/해제 액션 */}
              {selectedUser.suspended ? (
                <button
                  onClick={() => {
                    if (window.confirm(`"${selectedUser.nickname}" 유저의 정지를 해제하시겠습니까?`)) {
                      unsuspendMutation.mutate(selectedUser.id);
                    }
                  }}
                  disabled={unsuspendMutation.isPending}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {unsuspendMutation.isPending ? "처리 중..." : "정지 해제"}
                </button>
              ) : (
                <div>
                  <textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="정지 사유를 입력하세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={() => suspendMutation.mutate({ userId: selectedUser.id, reason: suspendReason })}
                    disabled={suspendMutation.isPending}
                    className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {suspendMutation.isPending ? "처리 중..." : "유저 정지"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
