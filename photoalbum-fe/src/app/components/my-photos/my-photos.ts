import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PhotoService } from '../../services/photo.service';
import { Photo } from '../../models/photo.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-my-photos',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './my-photos.html'
})
export class MyPhotos implements OnInit {
  private photoService = inject(PhotoService);

  protected photos = signal<Photo[]>([]);
  protected loading = signal(true);
  protected apiUrl = environment.apiUrl;

  // Upload form
  protected photoName = signal('');
  protected selectedFile = signal<File | null>(null);
  protected uploading = signal(false);
  protected uploadError = signal<string | null>(null);

  // Edit
  protected editingPhoto = signal<Photo | null>(null);
  protected editName = signal('');

  // Delete confirmation
  protected deletingPhoto = signal<Photo | null>(null);

  ngOnInit(): void {
    this.loadPhotos();
  }

  private loadPhotos(): void {
    this.photoService.getMyPhotos().subscribe({
      next: photos => {
        this.photos.set(photos);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  upload(): void {
    const file = this.selectedFile();
    const name = this.photoName().trim();

    if (!file || !name) {
      this.uploadError.set('A név és a fájl megadása kötelező!');
      return;
    }
    if (name.length > 40) {
      this.uploadError.set('A név maximum 40 karakter lehet!');
      return;
    }

    this.uploading.set(true);
    this.uploadError.set(null);

    this.photoService.uploadPhoto(name, file).subscribe({
      next: () => {
        this.photoName.set('');
        this.selectedFile.set(null);
        this.uploading.set(false);
        this.loadPhotos();
      },
      error: () => {
        this.uploadError.set('Hiba történt a feltöltés során.');
        this.uploading.set(false);
      }
    });
  }

  // Edit
  startEdit(photo: Photo): void {
    this.editingPhoto.set(photo);
    this.editName.set(photo.name);
  }

  cancelEdit(): void {
    this.editingPhoto.set(null);
    this.editName.set('');
  }

  saveEdit(): void {
    const photo = this.editingPhoto();
    const name = this.editName().trim();
    if (!photo || !name) return;
    if (name.length > 40) return;

    this.photoService.updatePhoto(photo.id, name).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadPhotos();
      }
    });
  }

  // Delete
  confirmDelete(photo: Photo): void {
    this.deletingPhoto.set(photo);
  }

  cancelDelete(): void {
    this.deletingPhoto.set(null);
  }

  executeDelete(): void {
    const photo = this.deletingPhoto();
    if (!photo) return;

    this.photoService.deletePhoto(photo.id).subscribe({
      next: () => {
        this.deletingPhoto.set(null);
        this.loadPhotos();
      }
    });
  }
}
