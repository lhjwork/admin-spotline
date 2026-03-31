import { useState } from "react";
import { useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import { routeAPI } from "../services/v2/routeAPI";
import { toDataTablePagination } from "../types/v2";
import type { RouteTheme } from "../types/v2";
import { AREAS, ROUTE_THEMES } from "../constants";
import { Plus, Eye } from "lucide-react";

export default function RouteManagement() {
  const [page, setPage] = useState(1);
  const [areaFilter, setAreaFilter] = useState("");
  const [themeFilter, setThemeFilter] = useState("");
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(
    ["routes", page, areaFilter, themeFilter],
    () => routeAPI.getPopular({
      page,
      size: 20,
      area: areaFilter || undefined,
      theme: (themeFilter as RouteTheme) || undefined,
    }),
    { keepPreviousData: true }
  );

  const springPage = data?.data;
  const routes = springPage?.content ?? [];
  const pagination = springPage ? toDataTablePagination(springPage) : null;

  const columns = [
    { key: "title", label: "제목" },
    {
      key: "theme",
      label: "테마",
      render: (val: RouteTheme) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          {ROUTE_THEMES[val] ?? val}
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
          <h1 className="text-2xl font-bold text-gray-900">Route 관리</h1>
          <p className="text-sm text-gray-500 mt-1">생성된 Route 목록을 관리합니다</p>
        </div>
        <button
          onClick={() => navigate("/routes/new")}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-1" /> 새 Route
        </button>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 mb-4">
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
          {Object.entries(ROUTE_THEMES).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {pagination && (
          <span className="text-sm text-gray-500 self-center">총 {pagination.count}개</span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={routes}
        loading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        actions={(row) => (
          <div className="py-1">
            <button
              onClick={() => {/* Route 상세 보기 - 향후 구현 */}}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye className="h-4 w-4 mr-2" /> 상세 보기
            </button>
          </div>
        )}
      />
    </div>
  );
}
