import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiSuccess } from '../models/api.interface';
import { ArticleData, ArticlesListResponse } from '../models/article.interface';

@Injectable({
  providedIn: 'root',
})
export class Articles {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/articles`;

  getArticles(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    tag?: string;
    is_published?: number;
    startTime?: string;
    endTime?: string;
  }): Observable<ApiSuccess<ArticlesListResponse>> {
    const query = new URLSearchParams();

    if (params?.page) {
      query.set('page', String(Math.max(params.page, 1)));
    }

    if (params?.pageSize) {
      const size = Math.min(Math.max(params.pageSize, 1), 100);
      query.set('pageSize', String(size));
    }

    if (params?.type) {
      query.set('type', params.type);
    }
    
    if (params?.tag) {
      query.set('tag', params.tag);
    }

    if (params?.is_published !== undefined) {
      query.set('is_published', String(params.is_published));
    }

    if (params?.startTime) {
      query.set('startTime', params.startTime);
    }

    if (params?.endTime) {
      query.set('endTime', params.endTime);
    }

    const queryString = query.toString();
    return this.http.get<ApiSuccess<ArticlesListResponse>>(
      queryString ? `${this.apiUrl}?${queryString}` : this.apiUrl
    );
  }

  getArticleBySlug(slug: string): Observable<ApiSuccess<ArticleData>> {
    return this.http.get<ApiSuccess<ArticleData>>(`${this.apiUrl}/${slug}`);
  }
}
