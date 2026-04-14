import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsAPI } from "../services/v2/analyticsAPI";
import DateRangePicker from "../components/analytics/DateRangePicker";
import PeriodComparison from "../components/analytics/PeriodComparison";
import ContentPerformanceTable, { getContentPerformanceData } from "../components/analytics/ContentPerformanceTable";
import CreatorProductivityTable, { getCreatorProductivityData } from "../components/analytics/CreatorProductivityTable";
import AreaPerformanceChart, { getAreaPerformanceData } from "../components/analytics/AreaPerformanceChart";
import CsvExportButton from "../components/analytics/CsvExportButton";

type TabKey = "content" | "creator" | "area";

const TABS: { key: TabKey; label: string }[] = [
  { key: "content", label: "콘텐츠 퍼포먼스" },
  { key: "creator", label: "크리에이터 생산성" },
  { key: "area", label: "지역별 성과" },
];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState<TabKey>("content");

  const from = dateRange.from;
  const to = dateRange.to;

  // Fetch data for CSV export
  const { data: contentData } = useQuery({
    queryKey: ["content-performance", toDateStr(from), toDateStr(to), "spot", "views"],
    queryFn: () => analyticsAPI.getContentPerformance(toDateStr(from), toDateStr(to), "spot", "views"),
    enabled: activeTab === "content",
  });

  const { data: creatorData } = useQuery({
    queryKey: ["creator-productivity", toDateStr(from), toDateStr(to)],
    queryFn: () => analyticsAPI.getCreatorProductivity(toDateStr(from), toDateStr(to)),
    enabled: activeTab === "creator",
  });

  const { data: areaData } = useQuery({
    queryKey: ["area-performance", toDateStr(from), toDateStr(to)],
    queryFn: () => analyticsAPI.getAreaPerformance(toDateStr(from), toDateStr(to)),
    enabled: activeTab === "area",
  });

  const csvData = useMemo(() => {
    if (activeTab === "content") return getContentPerformanceData(contentData) as unknown as Record<string, unknown>[];
    if (activeTab === "creator") return getCreatorProductivityData(creatorData) as unknown as Record<string, unknown>[];
    if (activeTab === "area") return getAreaPerformanceData(areaData) as unknown as Record<string, unknown>[];
    return [];
  }, [activeTab, contentData, creatorData, areaData]);

  const csvColumns = useMemo(() => {
    if (activeTab === "content") {
      return [
        { key: "title", header: "제목" },
        { key: "area", header: "지역" },
        { key: "creatorName", header: "크리에이터" },
        { key: "viewsCount", header: "조회수" },
        { key: "likesCount", header: "좋아요" },
        { key: "savesCount", header: "저장" },
        { key: "commentsCount", header: "댓글" },
      ];
    }
    if (activeTab === "creator") {
      return [
        { key: "creatorName", header: "크리에이터" },
        { key: "creatorType", header: "타입" },
        { key: "spotCount", header: "Spot" },
        { key: "spotLineCount", header: "SpotLine" },
        { key: "totalViews", header: "총 조회수" },
        { key: "totalLikes", header: "총 좋아요" },
        { key: "avgViewsPerContent", header: "평균 조회수" },
      ];
    }
    if (activeTab === "area") {
      return [
        { key: "area", header: "지역" },
        { key: "spotCount", header: "Spot" },
        { key: "spotLineCount", header: "SpotLine" },
        { key: "totalViews", header: "총 조회수" },
        { key: "totalLikes", header: "총 좋아요" },
      ];
    }
    return [];
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">분석</h1>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <CsvExportButton
            data={csvData}
            filename={`analytics-${activeTab}`}
            columns={csvColumns}
          />
        </div>
      </div>

      {/* Period Comparison Cards */}
      <PeriodComparison from={from} to={to} />

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.key
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "content" && <ContentPerformanceTable from={from} to={to} />}
          {activeTab === "creator" && <CreatorProductivityTable from={from} to={to} />}
          {activeTab === "area" && <AreaPerformanceChart from={from} to={to} />}
        </div>
      </div>
    </div>
  );
}
