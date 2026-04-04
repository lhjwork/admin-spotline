import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import { spotLineAPI } from "../services/v2/spotLineAPI";
import { toDataTablePagination } from "../types/v2";
import type { SpotLineTheme } from "../types/v2";
import { AREAS, SPOTLINE_THEMES } from "../constants";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import SpotLineDetailModal from "../components/curation/SpotLineDetailModal";

export default function SpotLineManagement() {
  const [page, setPage] = useState(1);
  const [areaFilter, setAreaFilter] = useState("");
  const [themeFilter, setThemeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
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
    queryKey: ["spotLines", page, areaFilter, themeFilter, keyword],
    queryFn: () => spotLineAPI.getPopular({
      page,
      size: 20,
      area: areaFilter || undefined,
      theme: (themeFilter as SpotLineTheme) || undefined,
      keyword: keyword || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const springPage = data?.data;
  const spotLines = springPage?.content ?? [];
  const pagination = springPage ? toDataTablePagination(springPage) : null;

  const handleDelete = async (slug: string) => {
    if (!window.confirm("이 SpotLine을 삭제하시겠습니까?")) return;
    await spotLineAPI.delete(slug);
    queryClient.invalidateQueries({ queryKey: ["spotLines"] });
    setDetailSlug(null);
  };

  const columns = [
    { key: "title", label: "제목" },
    {
      key: "theme",
      label: "테마",
      render: (val: SpotLineTheme) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          {SPOTLINE_THEMES[val] ?? val}
        </span>
      ),
    },
    { key: "area", label: "지역" },
    { key: "spotCount", label: "Spot 수" },
    {
      key: "totalDuration",
      label: "소요시간",
      render: (val: number | null) => val ? `${val}분` : "-",
    },
    { key: "likesCount", label: "좋아요" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SpotLine 관리</h1>
          <p className="text-sm text-gray-500 mt-1">생성된 SpotLine 목록을 관리합니다</p>
        </div>
        <button
          onClick={() => navigate("/spotlines/new")}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-1" /> 새 SpotLine
        </button>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목 또는 설명 검색..."
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
        <select
          value={themeFilter}
          onChange={(e) => { setThemeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">전체 테마</option>
          {Object.entries(SPOTLINE_THEMES).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {pagination && (
          <span className="text-sm text-gray-500 self-center">총 {pagination.count}개</span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={spotLines}
        loading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        actions={(row) => (
          <div className="py-1">
            <button
              onClick={() => setDetailSlug(row.slug)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye className="h-4 w-4 mr-2" /> 상세 보기
            </button>
            <button
              onClick={() => navigate(`/spotlines/${row.slug}/edit`)}
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

      {/* SpotLine 상세 모달 */}
      {detailSlug && (
        <SpotLineDetailModal
          slug={detailSlug}
          onClose={() => setDetailSlug(null)}
          onEdit={(s) => { setDetailSlug(null); navigate(`/spotlines/${s}/edit`); }}
          onDelete={(s) => handleDelete(s)}
        />
      )}
    </div>
  );
}
