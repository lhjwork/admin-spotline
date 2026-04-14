import Papa from "papaparse";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";

interface Column {
  key: string;
  header: string;
}

interface CsvExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  columns?: Column[];
}

export default function CsvExportButton({ data, filename, columns }: CsvExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    let csvData: Record<string, unknown>[];
    if (columns) {
      csvData = data.map((row) => {
        const mapped: Record<string, unknown> = {};
        columns.forEach((col) => {
          mapped[col.header] = row[col.key];
        });
        return mapped;
      });
    } else {
      csvData = data;
    }

    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="h-4 w-4" />
      CSV 내보내기
    </button>
  );
}
