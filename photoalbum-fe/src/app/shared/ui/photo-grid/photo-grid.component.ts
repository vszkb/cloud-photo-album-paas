import { Component, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Photo } from '../../../core/models/photo.model';

@Component({
  selector: 'app-photo-grid',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './photo-grid.component.html',
  styleUrl: './photo-grid.component.scss'
})
export class PhotoGridComponent {
  photos = input<Photo[]>([]);
  editable = input(false);
  emptyText = input('Még nincs feltöltött kép.');

  edit = output<Photo>();
  delete = output<Photo>();

  protected selectedPhoto = signal<Photo | null>(null);
  protected copiedId = signal<number | null>(null);

  openModal(photo: Photo): void {
    this.selectedPhoto.set(photo);
  }

  closeModal(): void {
    this.selectedPhoto.set(null);
  }

  copyLink(photo: Photo, event: Event): void {
    event.stopPropagation();
    navigator.clipboard.writeText(photo.imageUrl).then(() => {
      this.copiedId.set(photo.id);
      setTimeout(() => this.copiedId.set(null), 2000);
    });
  }
}
