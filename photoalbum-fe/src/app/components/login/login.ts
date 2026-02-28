import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/auth.model';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected email = signal('');
  protected password = signal('');
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  submit(): void {
    const request: LoginRequest = {
      email: this.email(),
      password: this.password()
    };

    this.loading.set(true);
    this.error.set(null);

    this.authService.login(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/my-photos']);
      },
      error: () => {
        this.error.set('Hibás e-mail cím vagy jelszó.');
        this.loading.set(false);
      }
    });
  }
}
