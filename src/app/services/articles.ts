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
   */
  getArticles(): Observable<ApiSuccess<ArticleData>> {
    return this.http.get<ApiSuccess<ArticleData>>(`${this.apiUrl}`);
  }

  /**
   * 依 slug 取得已發布文章或作品詳細內容。
   */
  getArticleBySlug(slug: string): Observable<ApiSuccess<ArticleData>> {
    return this.http.get<ApiSuccess<ArticleData>>(`${this.apiUrl}/${slug}`);
  }
  
  
}
