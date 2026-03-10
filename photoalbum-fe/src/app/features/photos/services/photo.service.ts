import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Photo } from '../../../core/models/photo.model';

const apiUrl = () => (window as any).__env?.apiUrl ?? '';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private http = inject(HttpClient);
  private get base() { return `${apiUrl()}/api/photos`; }

  getAllPhotos(sortBy = 'date', sortDirection = 'desc'): Observable<Photo[]> {
    const params = new HttpParams()
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    return this.http.get<Photo[]>(this.base, { params });
  }

  getMyPhotos(sortBy = 'date', sortDirection = 'desc'): Observable<Photo[]> {
    const params = new HttpParams()
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    return this.http.get<Photo[]>(`${this.base}/my`, { params });
  }

  getPhotoById(id: number): Observable<Photo> {
    return this.http.get<Photo>(`${this.base}/${id}`);
  }

  upload(name: string, file: File): Observable<Photo> {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('image', file);
    return this.http.post<Photo>(this.base, fd);
  }

  update(id: number, name: string): Observable<Photo> {
    return this.http.put<Photo>(`${this.base}/${id}`, { name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
