import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/gallery/gallery').then(m => m.Gallery)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(m => m.Register)
  },
  {
    path: 'my-photos',
    loadComponent: () => import('./components/my-photos/my-photos').then(m => m.MyPhotos),
    canActivate: [authGuard]
  },
  {
    path: 'photo/:id',
    loadComponent: () => import('./components/photo-detail/photo-detail').then(m => m.PhotoDetail)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
