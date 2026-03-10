import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PhotoService } from '../services/photo.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Photo } from '../../../core/models/photo.model';
import { PhotoGridComponent } from '../../../shared/ui/photo-grid/photo-grid.component';

@Component({
  selector: 'app-my-photos',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, PhotoGridComponent],
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
  protected previewUrl = signal<string | null>(null);
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
    if (input.files?.length) {
      const file = input.files[0];
      this.selectedFile.set(file);
      const prev = this.previewUrl();
      if (prev) URL.revokeObjectURL(prev);
      this.previewUrl.set(URL.createObjectURL(file));
    }
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
        const prev = this.previewUrl();
        if (prev) URL.revokeObjectURL(prev);
        this.previewUrl.set(null);
        this.uploading.set(false);
        this.toast.show('Sikeres feltöltés!', 'success');
        this.load();
      },
      error: (err) => {
        this.uploading.set(false);
        this.toast.show(this.parseError(err, 'Hiba a feltöltés során.'), 'danger');
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
      error: (err) => this.toast.show(this.parseError(err, 'Hiba a módosítás során.'), 'danger')
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
      error: (err) => this.toast.show(this.parseError(err, 'Hiba a törlés során.'), 'danger')
    });
  }

  private parseError(err: any, fallback: string): string {
    const body = err?.error;
    if (!body) return fallback;
    if (body.errors && typeof body.errors === 'object') {
      const msgs: string[] = [];
      for (const key of Object.keys(body.errors)) {
        const vals = body.errors[key];
        if (Array.isArray(vals)) msgs.push(...vals);
      }
      if (msgs.length) return msgs.join(' ');
    }
    if (body.message) return body.message;
    if (body.title) return body.title;
    if (typeof body === 'string') return body;
    return fallback;
  }
}
