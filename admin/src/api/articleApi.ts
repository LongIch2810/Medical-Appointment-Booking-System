import axiosInstance from "@/configs/axios";
import type { ApiResponse } from "@/types/interface/api.interface";
import type {
  Article,
  ArticleListPayload,
  ArticleListResponse,
  UpdateArticlePayload,
} from "@/types/interface/article.interface";

function normalizeArticle(article: Article): Article {
  return {
    ...article,
    is_approved: article.is_approved ?? article.is_approve ?? false,
  };
}

function normalizeArticleListResponse(
  data: ArticleListResponse,
): ArticleListResponse {
  return {
    ...data,
    articles: data.articles.map(normalizeArticle),
  };
}

export const fetchArticles = async (data: ArticleListPayload) => {
  const res = await axiosInstance.post<ApiResponse<ArticleListResponse>>(
    "/articles",
    data,
  );
  return {
    ...res.data,
    data: normalizeArticleListResponse(res.data.data),
  };
};

export const fetchArticleDetail = async (articleId: number) => {
  const res = await axiosInstance.get<ApiResponse<Article>>(
    `/articles/${articleId}`,
  );
  return {
    ...res.data,
    data: normalizeArticle(res.data.data),
  };
};

export const createArticle = async (data: {
  title: string;
  content: string;
  summary: string;
  topic_id: number;
  tag_ids: number[];
  files: File[];
}) => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("content", data.content);
  formData.append("summary", data.summary);
  formData.append("topic_id", String(data.topic_id));
  formData.append("tag_ids", JSON.stringify(data.tag_ids));
  data.files.forEach((file) => {
    formData.append("files", file);
  });
  const res = await axiosInstance.post<ApiResponse<{ message: string }>>(
    "/articles/create-article",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
};

export const updateArticle = async (
  articleId: number,
  data: UpdateArticlePayload,
) => {
  const res = await axiosInstance.patch<ApiResponse<{ message: string }>>(
    `/articles/${articleId}`,
    data,
  );
  return res.data;
};

export const approveArticle = async (articleId: number) => {
  const res = await axiosInstance.put<ApiResponse<{ message: string }>>(
    `/articles/${articleId}`,
  );
  return res.data;
};

export const deleteArticle = async (articleId: number) => {
  const res = await axiosInstance.delete<ApiResponse<{ message: string }>>(
    `/articles/${articleId}`,
  );
  return res.data;
};
