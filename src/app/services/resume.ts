import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private http = inject(HttpClient);
  
  private apiUrl = `${environment.apiUrl}/resume`;

  constructor() { }

  // 
  getResumeData() {
    return this.http.get(this.apiUrl);
  }
}