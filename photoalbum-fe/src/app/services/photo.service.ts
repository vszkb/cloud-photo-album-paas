import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Photo } from '../models/photo.model';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/photos`;

  getAllPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>(this.baseUrl);
  }

  getMyPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>(`${this.baseUrl}/my`);
  }

  getPhotoById(id: number): Observable<Photo> {
    return this.http.get<Photo>(`${this.baseUrl}/${id}`);
  }

  uploadPhoto(name: string, file: File): Observable<Photo> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);
    return this.http.post<Photo>(this.baseUrl, formData);
  }

  updatePhoto(id: number, name: string): Observable<Photo> {
    return this.http.put<Photo>(`${this.baseUrl}/${id}`, { name });
  }

  deletePhoto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
