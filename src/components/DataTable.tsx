import { useState, ReactNode } from "react";
import { ChevronUp, ChevronDown, MoreVertical } from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => ReactNode;
}

interface Pagination {
  current: number;
  total: number;
  limit: number;
  count: number;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  pagination?: Pagination | null;
  onPageChange?: ((page: number) => void) | null;
  sortable?: boolean;
  actions?: ((row: any) => ReactNode) | null;
}

export default function DataTable({ columns, data, loading = false, pagination = null, onPageChange = null, sortable = true, actions = null }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const handleSort = (key: string) => {
    if (!sortable) return;

    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortable && column.sortable !== false ? "cursor-pointer hover:bg-gray-100" : ""}`}
                  onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {sortable && column.sortable !== false && (
                      <div className="flex flex-col">
                        <ChevronUp className={`h-3 w-3 ${sortConfig.key === column.key && sortConfig.direction === "asc" ? "text-primary-600" : "text-gray-400"}`} />
                        <ChevronDown className={`h-3 w-3 -mt-1 ${sortConfig.key === column.key && sortConfig.direction === "desc" ? "text-primary-600" : "text-gray-400"}`} />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button onClick={() => setActiveDropdown(activeDropdown === index ? null : index)} className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {activeDropdown === index && <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">{actions(row)}</div>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {pagination && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(1, pagination.current - 1))}
              disabled={pagination.current === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <button
              onClick={() => onPageChange && onPageChange(Math.min(pagination.total, pagination.current + 1))}
              disabled={pagination.current === pagination.total}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                총 <span className="font-medium">{pagination.count}</span>개 중 <span className="font-medium">{(pagination.current - 1) * pagination.limit + 1}</span>-{" "}
                <span className="font-medium">{Math.min(pagination.current * pagination.limit, pagination.count)}</span>개 표시
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange && onPageChange(Math.max(1, pagination.current - 1))}
                disabled={pagination.current === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="text-sm text-gray-700">
                {pagination.current} / {pagination.total}
              </span>
              <button
                onClick={() => onPageChange && onPageChange(Math.min(pagination.total, pagination.current + 1))}
                disabled={pagination.current === pagination.total}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
