import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/auth.model';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html'
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected email = signal('');
  protected password = signal('');
  protected confirmPassword = signal('');
  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected success = signal(false);

  submit(): void {
    if (this.password() !== this.confirmPassword()) {
      this.error.set('A jelszavak nem egyeznek!');
      return;
    }

    const request: RegisterRequest = {
      email: this.email(),
      password: this.password()
    };

    this.loading.set(true);
    this.error.set(null);

    this.authService.register(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Hiba történt a regisztráció során.');
        this.loading.set(false);
      }
    });
  }
}
