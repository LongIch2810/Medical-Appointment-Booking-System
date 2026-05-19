import axiosInstance from "@/configs/axios";
import type {
  Article,
  ArticleListPayload,
  ArticleListResponse,
} from "@/types/interface/article.interface";
import type { ApiResponse } from "@/types/interface/patient.interface";

export const fetchArticles = async (data: ArticleListPayload) => {
  const res = await axiosInstance.post<ApiResponse<ArticleListResponse>>(
    "/articles",
    data,
  );
  return res.data;
};

export const fetchArticleDetail = async (articleId: number) => {
  const res = await axiosInstance.get<ApiResponse<Article>>(
    `/articles/${articleId}`,
  );
  return res.data;
};
