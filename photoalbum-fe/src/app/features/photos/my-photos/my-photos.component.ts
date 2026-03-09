import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PhotoService } from '../services/photo.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Photo } from '../../../core/models/photo.model';

@Component({
  selector: 'app-my-photos',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './my-photos.component.html',
  styleUrl: './my-photos.component.scss'
})
export class MyPhotosComponent implements OnInit {
  private photoService = inject(PhotoService);
  private toast = inject(ToastService);

  protected photos = signal<Photo[]>([]);
  protected loading = signal(true);

  // sort
  protected sortBy = signal<'name' | 'date'>('date');
  protected sortDirection = signal<'asc' | 'desc'>('desc');

  // upload form
  protected photoName = signal('');
  protected selectedFile = signal<File | null>(null);
  protected uploading = signal(false);

  // edit
  protected editingPhoto = signal<Photo | null>(null);
  protected editName = signal('');

  // delete confirm
  protected deletingPhoto = signal<Photo | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.photoService.getMyPhotos(this.sortBy(), this.sortDirection()).subscribe({
      next: photos => { this.photos.set(photos); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSortChange(): void {
    this.load();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.selectedFile.set(input.files[0]);
  }

  upload(): void {
    const file = this.selectedFile();
    const name = this.photoName().trim();
    if (!file || !name || name.length > 40) return;

    this.uploading.set(true);
    this.photoService.upload(name, file).subscribe({
      next: () => {
        this.photoName.set('');
        this.selectedFile.set(null);
        this.uploading.set(false);
        this.toast.show('Sikeres feltöltés!', 'success');
        this.load();
      },
      error: () => {
        this.uploading.set(false);
        this.toast.show('Hiba a feltöltés során.', 'danger');
      }
    });
  }

  // ── Edit ──
  startEdit(photo: Photo): void {
    this.editingPhoto.set(photo);
    this.editName.set(photo.name);
  }

  cancelEdit(): void {
    this.editingPhoto.set(null);
  }

  saveEdit(): void {
    const photo = this.editingPhoto();
    const name = this.editName().trim();
    if (!photo || !name || name.length > 40) return;

    this.photoService.update(photo.id, name).subscribe({
      next: () => {
        this.cancelEdit();
        this.toast.show('Név sikeresen módosítva!', 'success');
        this.load();
      },
      error: () => this.toast.show('Hiba a módosítás során.', 'danger')
    });
  }

  // ── Delete ──
  confirmDelete(photo: Photo): void {
    this.deletingPhoto.set(photo);
  }

  cancelDelete(): void {
    this.deletingPhoto.set(null);
  }

  executeDelete(): void {
    const photo = this.deletingPhoto();
    if (!photo) return;

    this.photoService.delete(photo.id).subscribe({
      next: () => {
        this.deletingPhoto.set(null);
        this.toast.show('Kép sikeresen törölve!', 'success');
        this.load();
      },
      error: () => this.toast.show('Hiba a törlés során.', 'danger')
    });
  }
}
