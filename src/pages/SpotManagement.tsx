import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import DataTable from "../components/DataTable";
import SpotEditModal from "../components/curation/SpotEditModal";
import { spotAPI } from "../services/v2/spotAPI";
import type { SpotDetailResponse, UpdateSpotRequest, SpotCategory } from "../types/v2";
import { toDataTablePagination } from "../types/v2";
import { AREAS, SPOT_CATEGORIES } from "../constants";
import { Pencil, Trash2, Loader2 } from "lucide-react";

export default function SpotManagement() {
  const [page, setPage] = useState(1);
  const [areaFilter, setAreaFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [editingSpot, setEditingSpot] = useState<SpotDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
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
    queryKey: ["spots", page, areaFilter, categoryFilter, keyword],
    queryFn: () => spotAPI.getList({
      page,
      size: 20,
      area: areaFilter || undefined,
      category: (categoryFilter as SpotCategory) || undefined,
      keyword: keyword || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const springPage = data?.data;
  const spots = springPage?.content ?? [];
  const pagination = springPage ? toDataTablePagination(springPage) : null;

  const updateMutation = useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateSpotRequest }) => spotAPI.update(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spots"] });
      setEditingSpot(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => spotAPI.delete(slug),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spots"] }),
  });

  const handleEdit = async (spot: SpotDetailResponse) => {
    setLoadingDetail(true);
    try {
      const res = await spotAPI.getBySlug(spot.slug);
      setEditingSpot(res.data);
    } catch {
      setEditingSpot(spot);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = (spot: SpotDetailResponse) => {
    if (window.confirm(`"${spot.title}" Spot을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(spot.slug);
    }
  };

  const columns = [
    { key: "title", label: "제목" },
    {
      key: "category",
      label: "카테고리",
      render: (val: SpotCategory) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
          {SPOT_CATEGORIES[val] ?? val}
        </span>
      ),
    },
    { key: "area", label: "지역" },
    {
      key: "crewNote",
      label: "크루 노트",
      render: (val: string | null) =>
        val ? <span className="text-gray-600 truncate max-w-[200px] block">{val}</span> : <span className="text-gray-300">-</span>,
    },
    {
      key: "tags",
      label: "태그",
      render: (val: string[]) =>
        val?.length ? (
          <div className="flex flex-wrap gap-1">
            {val.slice(0, 3).map((t) => (
              <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{t}</span>
            ))}
            {val.length > 3 && <span className="text-xs text-gray-400">+{val.length - 3}</span>}
          </div>
        ) : <span className="text-gray-300">-</span>,
    },
    {
      key: "createdAt",
      label: "생성일",
      render: (val: string) => new Date(val).toLocaleDateString("ko-KR"),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Spot 관리</h1>
        <p className="text-sm text-gray-500 mt-1">생성된 Spot 목록을 관리합니다</p>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목 또는 크루노트 검색..."
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
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">전체 카테고리</option>
          {Object.entries(SPOT_CATEGORIES).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {pagination && (
          <span className="text-sm text-gray-500 self-center">총 {pagination.count}개</span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={spots}
        loading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        actions={(row: SpotDetailResponse) => (
          <div className="py-1">
            <button
              onClick={() => handleEdit(row)}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {loadingDetail ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pencil className="h-4 w-4 mr-2" />} 편집
            </button>
            <button
              onClick={() => handleDelete(row)}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" /> 삭제
            </button>
          </div>
        )}
      />

      {editingSpot && (
        <SpotEditModal
          spot={editingSpot}
          onClose={() => setEditingSpot(null)}
          onSave={async (slug, data) => {
            await updateMutation.mutateAsync({ slug, data });
          }}
          saving={updateMutation.isPending}
        />
      )}
    </div>
  );
}
