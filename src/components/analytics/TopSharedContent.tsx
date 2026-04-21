import type { TopSharedItem } from "../../services/v2/shareAPI";

interface TopSharedContentProps {
  data: TopSharedItem[];
}

export function TopSharedContent({ data }: TopSharedContentProps) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500">공유 데이터가 없습니다</p>;
  }

  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="font-semibold">탑 공유 콘텐츠</h3>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">#</th>
            <th className="px-4 py-2 text-left">콘텐츠</th>
            <th className="px-4 py-2 text-left">타입</th>
            <th className="px-4 py-2 text-right">공유 수</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={item.targetId} className="border-b last:border-0">
              <td className="px-4 py-2 text-gray-500">{i + 1}</td>
              <td className="px-4 py-2 font-medium">{item.title || "(제목 없음)"}</td>
              <td className="px-4 py-2">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  {item.targetType}
                </span>
              </td>
              <td className="px-4 py-2 text-right tabular-nums font-medium">
                {item.shareCount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
