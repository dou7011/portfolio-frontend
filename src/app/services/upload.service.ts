import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiSuccess } from '../models/api.interface';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/upload`;

  uploadImage(file: File): Observable<ApiSuccess<{ url: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<ApiSuccess<{ url: string }>>(this.apiUrl, formData);
  }
}