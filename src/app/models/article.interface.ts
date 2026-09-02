export interface ArticleData {
  id?: number;
  slug: string;
  title: string;
  type: string;
  cover_image?: string | null;
  excerpt?: string;
  content?: string;
  tags?: string[];
  github_url?: string;
  demo_url?: string;
  is_published?: boolean;
  published_at?: string;
  view_count?: number;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  page: number;
  totalPages: number;
}

export interface ArticlesListResponse {
  data: ArticleData[];
  pagination: PaginationInfo;
}