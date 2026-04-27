import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import { collectionAPI } from "../services/v2/collectionAPI";
import { toDataTablePagination } from "../types/v2";
import type { SpotLineTheme } from "../types/v2";
import { SPOTLINE_THEMES } from "../constants";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function CollectionManagement() {
  const [page, setPage] = useState(1);
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
    queryKey: ["collections", page, keyword],
    queryFn: () => collectionAPI.list({ page, size: 20, keyword: keyword || undefined }),
    placeholderData: keepPreviousData,
  });

  const springPage = data?.data;
  const collections = springPage?.content ?? [];
  const pagination = springPage ? toDataTablePagination(springPage) : null;

  const handleDelete = async (slug: string) => {
    if (!window.confirm("이 컬렉션을 삭제하시겠습니까?")) return;
    await collectionAPI.delete(slug);
    queryClient.invalidateQueries({ queryKey: ["collections"] });
  };

  const columns = [
    { key: "title", label: "제목" },
    {
      key: "theme",
      label: "테마",
      render: (val: SpotLineTheme | null) =>
        val ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
            {SPOTLINE_THEMES[val] ?? val}
          </span>
        ) : "-",
    },
    { key: "area", label: "지역" },
    { key: "itemCount", label: "아이템 수" },
    {
      key: "isFeatured",
      label: "Featured",
      render: (val: boolean) => (val ? "✅" : "-"),
    },
    {
      key: "isPublished",
      label: "공개",
      render: (val: boolean) => (val ? "✅" : "-"),
    },
    { key: "viewsCount", label: "조회수" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">컬렉션 관리</h1>
          <p className="text-sm text-gray-500 mt-1">큐레이션 컬렉션을 관리합니다</p>
        </div>
        <button
          onClick={() => navigate("/collections/new")}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-1" /> 새 컬렉션
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목 또는 설명 검색..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        />
        {pagination && (
          <span className="text-sm text-gray-500 self-center">총 {pagination.count}개</span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={collections}
        loading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        actions={(row) => (
          <div className="py-1">
            <button
              onClick={() => navigate(`/collections/${row.slug}/edit`)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Pencil className="h-4 w-4 mr-2" /> 수정
            </button>
            <button
              onClick={() => handleDelete(row.slug)}
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
