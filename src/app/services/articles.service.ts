import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiSuccess } from '../models/api.interface';
import { ArticleData } from '../models/article.interface';

@Injectable({
  providedIn: 'root',
})
export class Articles {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/articles`;

  /**
   * 取得已發布文章或作品列表。
   * 可用 `type` 篩選 blog / portfolio，並透過 `limit` 限制筆數（需大於 0）。
   */
  getArticles(params?: { type?: string; limit?: number }): Observable<ApiSuccess<ArticleData[]>> {
    const query = new URLSearchParams();

    if (params?.type) {
      query.set('type', params.type);
    }

    if (params?.limit && params.limit > 0) {
      query.set('limit', String(params.limit));
    }

    const queryString = query.toString();
    return this.http.get<ApiSuccess<ArticleData[]>>(
      queryString ? `${this.apiUrl}?${queryString}` : this.apiUrl
    );
  }

  /**
   * 依 slug 取得已發布文章或作品詳細內容。
   */
  getArticleBySlug(slug: string): Observable<ApiSuccess<ArticleData>> {
    return this.http.get<ApiSuccess<ArticleData>>(`${this.apiUrl}/${slug}`);
  }
}
