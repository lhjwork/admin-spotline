import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import { blogAPI } from "../services/v2/blogAPI";
import type { BlogListItem } from "../types/v2";
import { toDataTablePagination } from "../types/v2";
import { AREAS } from "../constants";
import { Eye, EyeOff, Trash2 } from "lucide-react";

export default function BlogManagement() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
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
    queryKey: ["blogs", page, statusFilter, areaFilter, keyword],
    queryFn: () => blogAPI.getList({
      page,
      size: 20,
      status: statusFilter || undefined,
      area: areaFilter || undefined,
      keyword: keyword || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const springPage = data?.data;
  const blogs = springPage?.content ?? [];
  const pagination = springPage ? toDataTablePagination(springPage) : null;

  const unpublishMutation = useMutation({
    mutationFn: (slug: string) => blogAPI.unpublish(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blogs"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => blogAPI.delete(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blogs"] }),
  });

  const columns = [
    { key: "title", label: "제목" },
    { key: "userName", label: "작성자" },
    { key: "spotLineArea", label: "지역" },
    {
      key: "status",
      label: "상태",
      render: (val: string) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          val === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
        }`}>
          {val === "PUBLISHED" ? "발행됨" : "초안"}
        </span>
      ),
    },
    {
      key: "viewsCount",
      label: "조회",
      render: (val: number) => val.toLocaleString(),
    },
    {
      key: "likesCount",
      label: "좋아요",
      render: (val: number) => val.toLocaleString(),
    },
    {
      key: "publishedAt",
      label: "발행일",
      render: (val: string | null) => val ? new Date(val).toLocaleDateString("ko-KR") : "-",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">블로그 관리</h1>
        <p className="text-sm text-gray-500 mt-1">발행된 블로그를 관리합니다</p>
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "", label: "전체" },
          { key: "PUBLISHED", label: "발행됨" },
          { key: "DRAFT", label: "초안" },
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

      {/* 검색 + 지역 필터 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목 또는 작성자 검색..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
        <select
          value={areaFilter}
          onChange={(e) => { setAreaFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">전체 지역</option>
          {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {pagination && (
          <span className="text-sm text-gray-500 self-center">총 {pagination.count}개</span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={blogs}
        loading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        actions={(row: BlogListItem) => (
          <div className="py-1">
            <button
              onClick={() => navigate(`/blogs/${row.slug}`)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye className="h-4 w-4 mr-2" /> 상세보기
            </button>
            {row.status === "PUBLISHED" && (
              <button
                onClick={() => {
                  if (window.confirm(`"${row.title}" 블로그를 비공개 처리하시겠습니까?`)) {
                    unpublishMutation.mutate(row.slug);
                  }
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50"
              >
                <EyeOff className="h-4 w-4 mr-2" /> 비공개
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm(`"${row.title}" 블로그를 삭제하시겠습니까?`)) {
                  deleteMutation.mutate(row.slug);
                }
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" /> 삭제
            </button>
          </div>
        )}
      />
    </div>
  );
}
