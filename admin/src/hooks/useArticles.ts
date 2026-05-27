import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  approveArticle,
  createArticle,
  deleteArticle,
  fetchArticleDetail,
  fetchArticles,
  updateArticle,
} from "@/api/articleApi";
import type {
  ArticleListPayload,
  UpdateArticlePayload,
} from "@/types/interface/article.interface";

export const articleQueryKeys = {
  list: (filters: ArticleListPayload) => ["articles", filters] as const,
  infinite: (filters: Omit<ArticleListPayload, "page">) =>
    ["articles-infinite", filters] as const,
  detail: (articleId: number) => ["article-detail", articleId] as const,
};

export function useArticles(filters: ArticleListPayload) {
  return useQuery({
    queryKey: articleQueryKeys.list(filters),
    queryFn: () => fetchArticles(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useArticlesInfinite(
  filters: Omit<ArticleListPayload, "page"> = { limit: 10 },
) {
  return useInfiniteQuery({
    queryKey: articleQueryKeys.infinite(filters),
    queryFn: ({ pageParam }) =>
      fetchArticles({ page: pageParam as number, ...filters }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.data;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useArticleDetail(articleId: number) {
  return useQuery({
    queryKey: articleQueryKeys.detail(articleId),
    queryFn: () => fetchArticleDetail(articleId),
    enabled: articleId > 0,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      toast.success("Tạo bài viết thành công");
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: () => {
      toast.error("Tạo bài viết thất bại");
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      articleId,
      payload,
    }: {
      articleId: number;
      payload: UpdateArticlePayload;
    }) => updateArticle(articleId, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật bài viết thành công");
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({
        queryKey: articleQueryKeys.detail(variables.articleId),
      });
    },
    onError: () => {
      toast.error("Cập nhật bài viết thất bại");
    },
  });
}

export function useApproveArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveArticle,
    onSuccess: (_, articleId) => {
      toast.success("Duyệt bài viết thành công");
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({
        queryKey: articleQueryKeys.detail(articleId),
      });
    },
    onError: () => {
      toast.error("Duyệt bài viết thất bại");
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      toast.success("Xóa bài viết thành công");
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: () => {
      toast.error("Xóa bài viết thất bại");
    },
  });
}
