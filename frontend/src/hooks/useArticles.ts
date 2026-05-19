import { fetchArticleDetail, fetchArticles } from "@/api/articleApi";
import { fetchTopics } from "@/api/topicApi";
import type {
  ArticleListPayload,
  TopicListPayload,
} from "@/types/interface/article.interface";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export const articleQueryKeys = {
  list: (filters: ArticleListPayload) => ["articles", filters] as const,
  infinite: (filters: Omit<ArticleListPayload, "page">) =>
    ["articles-infinite", filters] as const,
  detail: (articleId: number) => ["article-detail", articleId] as const,
  topics: (filters: TopicListPayload) => ["topics", filters] as const,
};

export function useArticles(filters: ArticleListPayload) {
  return useQuery({
    queryKey: articleQueryKeys.list(filters),
    queryFn: () => fetchArticles(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useArticlesInfinite(
  filters: Omit<ArticleListPayload, "page"> = { limit: 6 },
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

export function useTopics(filters: TopicListPayload) {
  return useQuery({
    queryKey: articleQueryKeys.topics(filters),
    queryFn: () => fetchTopics(filters),
    staleTime: 1000 * 60 * 30,
  });
}

export function useArticleDetail(articleId: number) {
  return useQuery({
    queryKey: articleQueryKeys.detail(articleId),
    queryFn: () => fetchArticleDetail(articleId),
    enabled: articleId > 0,
    staleTime: 1000 * 60 * 5,
  });
}
