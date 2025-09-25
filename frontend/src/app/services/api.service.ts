import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
    console.log('API Headers:', headers.keys().map(key => `${key}: ${headers.get(key)}`));
    console.log('Token from localStorage:', token ? 'Present' : 'Missing');
    return headers;
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }

  get<T>(endpoint: string, params?: any): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<ApiResponse<T>>(
      `${this.apiUrl}/${endpoint}`,
      { headers: this.getHeaders(), params: httpParams }
    ).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    console.log(`POST ${endpoint}:`, data);
    console.log('POST data club field:', data?.club);
    console.log('POST data keys:', Object.keys(data || {}));
    
    return this.http.post<ApiResponse<T>>(
      `${this.apiUrl}/${endpoint}`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(
      `${this.apiUrl}/${endpoint}`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(
      `${this.apiUrl}/${endpoint}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }
}