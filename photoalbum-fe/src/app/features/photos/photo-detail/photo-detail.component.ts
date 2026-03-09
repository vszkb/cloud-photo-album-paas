import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PhotoService } from '../services/photo.service';
import { Photo } from '../../../core/models/photo.model';

@Component({
  selector: 'app-photo-detail',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './photo-detail.component.html'
})
export class PhotoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private photoService = inject(PhotoService);

  protected photo = signal<Photo | null>(null);
  protected loading = signal(true);
  protected error = signal(false);
  protected copied = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error.set(true); this.loading.set(false); return; }

    this.photoService.getPhotoById(id).subscribe({
      next: p => { this.photo.set(p); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); }
    });
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
