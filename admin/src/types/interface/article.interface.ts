import type { PaginationMeta, PaginationPayload, SortOrder } from "./api.interface";
import type { Tag } from "./tag.interface";
import type { Topic } from "./topic.interface";

export interface ArticleAuthor {
  id?: number;
  fullname?: string;
  picture?: string | null;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  summary: string;
  slug?: string;
  status?: string;
  is_approved?: boolean;
  is_approve?: boolean;
  view_count?: number;
  topic?: Topic | null;
  tags?: Tag[];
  author?: ArticleAuthor | null;
  files?: Array<{ id: number; url: string; type?: string }>;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ArticleListPayload extends PaginationPayload {
  search?: string;
  topic_slug?: string;
  arrange?: SortOrder;
  is_approve?: "true" | "false" | "all";
}

export interface ArticleListResponse extends PaginationMeta {
  articles: Article[];
}

export interface UpdateArticlePayload {
  title?: string;
  content?: string;
  summary?: string;
  topic_id?: number;
  tag_ids?: number[];
}
