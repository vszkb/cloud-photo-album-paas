import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PhotoService } from '../services/photo.service';
import { Photo } from '../../../core/models/photo.model';

@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [DatePipe, RouterLink, FormsModule],
  templateUrl: './photo-gallery.component.html',
  styleUrl: './photo-gallery.component.scss'
})
export class PhotoGalleryComponent implements OnInit {
  private photoService = inject(PhotoService);

  protected photos = signal<Photo[]>([]);
  protected loading = signal(true);
  protected sortBy = signal<'name' | 'date'>('date');
  protected sortDirection = signal<'asc' | 'desc'>('desc');
  protected selectedPhoto = signal<Photo | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.photoService.getAllPhotos(this.sortBy(), this.sortDirection()).subscribe({
      next: photos => { this.photos.set(photos); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSortChange(): void {
    this.load();
  }

  openModal(photo: Photo): void {
    this.selectedPhoto.set(photo);
  }

  closeModal(): void {
    this.selectedPhoto.set(null);
  }
}
