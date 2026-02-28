import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, RegisterRequest, AuthResponse } from '../models/auth.model';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_EMAIL_KEY = 'auth_user_email';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _isAuthenticated = signal(this.hasStoredToken());
  private _userEmail = signal<string | null>(this.getStoredEmail());

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly userEmail = this._userEmail.asReadonly();

  private hasStoredToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  private getStoredEmail(): string | null {
    return localStorage.getItem(USER_EMAIL_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/login`, request).pipe(
      tap(response => {
        localStorage.setItem(TOKEN_KEY, response.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        localStorage.setItem(USER_EMAIL_KEY, request.email);
        this._isAuthenticated.set(true);
        this._userEmail.set(request.email);
      })
    );
  }

  register(request: RegisterRequest) {
    return this.http.post(`${environment.apiUrl}/register`, request);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    this._isAuthenticated.set(false);
    this._userEmail.set(null);
    this.router.navigate(['/']);
  }
}
