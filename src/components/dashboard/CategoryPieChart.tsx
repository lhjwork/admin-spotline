import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CategoryPieChartProps {
  categoryCounts: { category: string; label: string; count: number }[];
}

const COLORS = [
  "#8B5CF6", // CAFE - violet
  "#F59E0B", // RESTAURANT - amber
  "#6366F1", // BAR - indigo
  "#10B981", // NATURE - emerald
  "#EC4899", // CULTURE - pink
  "#F97316", // EXHIBITION - orange
  "#14B8A6", // WALK - teal
  "#EF4444", // ACTIVITY - red
  "#3B82F6", // SHOPPING - blue
  "#6B7280", // OTHER - gray
];

export default function CategoryPieChart({ categoryCounts }: CategoryPieChartProps) {
  const data = categoryCounts.filter((c) => c.count > 0);

  if (data.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">카테고리별 분포</h3>
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">
          데이터가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">카테고리별 분포</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ label, count }) => `${label} ${count}`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value}개`, "Spot 수"]} />
          <Legend
            formatter={(value: string) => <span className="text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
