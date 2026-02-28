import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PhotoService } from '../../services/photo.service';
import { Photo } from '../../models/photo.model';
import { environment } from '../../../environments/environment';

type SortMode = 'name-asc' | 'date-desc' | 'date-asc';

@Component({
  selector: 'app-gallery',
  imports: [DatePipe, RouterLink, FormsModule],
  templateUrl: './gallery.html'
})
export class Gallery implements OnInit {
  private photoService = inject(PhotoService);

  protected photos = signal<Photo[]>([]);
  protected loading = signal(true);
  protected sortMode = signal<SortMode>('date-desc');
  protected selectedPhoto = signal<Photo | null>(null);
  protected apiUrl = environment.apiUrl;

  protected sortedPhotos = computed(() => {
    const list = [...this.photos()];
    const mode = this.sortMode();
    switch (mode) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'hu'));
      case 'date-desc':
        return list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      case 'date-asc':
        return list.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
      default:
        return list;
    }
  });

  ngOnInit(): void {
    this.loadPhotos();
  }

  private loadPhotos(): void {
    this.photoService.getAllPhotos().subscribe({
      next: photos => {
        this.photos.set(photos);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSortChange(mode: SortMode): void {
    this.sortMode.set(mode);
  }

  openModal(photo: Photo): void {
    this.selectedPhoto.set(photo);
  }

  closeModal(): void {
    this.selectedPhoto.set(null);
  }
}
