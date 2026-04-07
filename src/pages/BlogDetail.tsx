import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blogAPI } from "../services/v2/blogAPI";
import { ArrowLeft, EyeOff, Trash2, ExternalLink } from "lucide-react";

const SITE_URL = "https://spotline.kr";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["blog", slug],
    queryFn: () => blogAPI.getBySlug(slug!),
    enabled: !!slug,
  });

  const blog = data?.data;

  const unpublishMutation = useMutation({
    mutationFn: () => blogAPI.unpublish(slug!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", slug] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => blogAPI.delete(slug!),
    onSuccess: () => navigate("/blogs"),
  });

  const handleUnpublish = () => {
    if (window.confirm(`"${blog?.title}" 블로그를 비공개 처리하시겠습니까?`)) {
      unpublishMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (window.confirm(`"${blog?.title}" 블로그를 삭제하시겠습니까?`)) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-12 text-gray-500">블로그를 찾을 수 없습니다</div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/blogs")}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{blog.title}</h1>
            <p className="text-sm text-gray-500">{blog.userName} · {blog.spotLineArea}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {blog.status === "PUBLISHED" && (
            <button
              onClick={handleUnpublish}
              disabled={unpublishMutation.isPending}
              className="inline-flex items-center px-3 py-1.5 border border-orange-300 text-orange-600 rounded-md text-sm hover:bg-orange-50"
            >
              <EyeOff className="h-4 w-4 mr-1" /> 비공개
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-600 rounded-md text-sm hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" /> 삭제
          </button>
          <a
            href={`${SITE_URL}/blog/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4 mr-1" /> 프론트에서 보기
          </a>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="상태" value={blog.status === "PUBLISHED" ? "발행됨" : "초안"} />
        <StatCard label="조회수" value={blog.viewsCount.toLocaleString()} />
        <StatCard label="좋아요" value={blog.likesCount.toLocaleString()} />
        <StatCard label="댓글" value={blog.commentsCount.toLocaleString()} />
      </div>

      {/* Cover Image */}
      {blog.coverImageUrl && (
        <img
          src={blog.coverImageUrl}
          alt=""
          className="w-full max-h-64 object-cover rounded-lg mb-6"
        />
      )}

      {/* Summary */}
      {blog.summary && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">요약</h3>
          <p className="text-gray-700">{blog.summary}</p>
        </div>
      )}

      {/* SpotLine Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">연결된 SpotLine</h3>
        <p className="text-gray-700">
          {blog.spotLineTitle} · {blog.spotLineArea} · {blog.spotCount}곳
        </p>
      </div>
    </div>
  );
}
