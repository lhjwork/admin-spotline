import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { partnerAPI } from "../services/v2/partnerAPI";
import { toDataTablePagination } from "../types/v2";
import type { PartnerStatus } from "../types/v2";
import PartnerCard from "../components/PartnerCard";

const statusOptions: { value: PartnerStatus | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "활성" },
  { value: "PAUSED", label: "일시정지" },
  { value: "TERMINATED", label: "해지" },
];

export default function PartnerManagement() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PartnerStatus | "">("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["partners", page, status, search],
    queryFn: () =>
      partnerAPI.getList({
        page,
        status: status || undefined,
        search: search || undefined,
      }),
    select: (res) => res.data,
  });

  const pagination = data ? toDataTablePagination(data) : null;

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">파트너 관리</h1>
        <button
          onClick={() => navigate("/partners/new")}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          파트너 등록
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PartnerStatus | "");
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="매장명 검색..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            검색
          </button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : data && data.content.length > 0 ? (
        <div className="space-y-3">
          {data.content.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              onClick={() => navigate(`/partners/${partner.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-500">등록된 파트너가 없습니다</p>
          <button
            onClick={() => navigate("/partners/new")}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700"
          >
            첫 파트너를 등록해보세요
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {pagination.current} / {pagination.total}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.total, p + 1))}
            disabled={page === pagination.total}
            className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
