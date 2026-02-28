import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PhotoService } from '../../services/photo.service';
import { Photo } from '../../models/photo.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-photo-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './photo-detail.html'
})
export class PhotoDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private photoService = inject(PhotoService);

  protected photo = signal<Photo | null>(null);
  protected loading = signal(true);
  protected error = signal(false);
  protected apiUrl = environment.apiUrl;
  protected copied = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.photoService.getPhotoById(id).subscribe({
        next: photo => {
          this.photo.set(photo);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        }
      });
    }
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
