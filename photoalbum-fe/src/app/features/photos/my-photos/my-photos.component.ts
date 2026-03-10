import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PhotoService } from '../services/photo.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Photo } from '../../../core/models/photo.model';

@Component({
  selector: 'app-my-photos',
  standalone: true,
  imports: [DatePipe, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './my-photos.component.html',
  styleUrl: './my-photos.component.scss'
})
export class MyPhotosComponent implements OnInit {
  private photoService = inject(PhotoService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  protected photos = signal<Photo[]>([]);
  protected loading = signal(true);

  // sort
  protected sortBy = signal<'name' | 'date'>('date');
  protected sortDirection = signal<'asc' | 'desc'>('desc');

  // upload form
  protected uploadForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(40)]]
  });
  protected selectedFile = signal<File | null>(null);
  protected uploading = signal(false);

  // edit
  protected editingPhoto = signal<Photo | null>(null);
  protected editForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(40)]]
  });

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
    const name = this.uploadForm.value.name?.trim() ?? '';
    if (!file || this.uploadForm.invalid) return;

    this.uploading.set(true);
    this.photoService.upload(name, file).subscribe({
      next: () => {
        this.uploadForm.reset();
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
    this.editForm.setValue({ name: photo.name });
  }

  cancelEdit(): void {
    this.editingPhoto.set(null);
    this.editForm.reset();
  }

  saveEdit(): void {
    const photo = this.editingPhoto();
    const name = this.editForm.value.name?.trim() ?? '';
    if (!photo || this.editForm.invalid) return;

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
