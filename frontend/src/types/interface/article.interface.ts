export interface ImageInfo {
  url: string;
  public_id: string;
}

export interface ArticleAuthor {
  id: number;
  fullname: string;
  email: string;
  picture: string | null;
}

export interface ArticleTopic {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface ArticleTag {
  name: string;
}

export interface Article {
  id: number;
  title: string;
  summary: string;
  content: string;
  slug: string;
  is_approve: boolean;
  img_urls: ImageInfo[] | null;
  author: ArticleAuthor;
  topic: ArticleTopic;
  tags: ArticleTag[];
  created_at: string;
  updated_at: string;
}

export interface ArticleListPayload {
  page: number;
  limit: number;
  search?: string;
  topic_slug?: string;
  arrange?: "asc" | "desc";
}

export interface ArticleListResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TopicListPayload {
  page: number;
  limit: number;
  search?: string;
  arrange?: "asc" | "desc";
}

export interface TopicListResponse {
  topics: ArticleTopic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
