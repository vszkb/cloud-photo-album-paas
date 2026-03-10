import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PhotoService } from '../services/photo.service';
import { Photo } from '../../../core/models/photo.model';
import { PhotoGridComponent } from '../../../shared/ui/photo-grid/photo-grid.component';

@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [FormsModule, PhotoGridComponent],
  templateUrl: './photo-gallery.component.html',
  styleUrl: './photo-gallery.component.scss'
})
export class PhotoGalleryComponent implements OnInit {
  private photoService = inject(PhotoService);

  protected photos = signal<Photo[]>([]);
  protected loading = signal(true);
  protected sortBy = signal<'name' | 'date'>('date');
  protected sortDirection = signal<'asc' | 'desc'>('desc');

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
}
