import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
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

    this.loading.set(true);
    this.error.set(null);

    this.authService.register({ email: this.email(), password: this.password() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error.set(this.parseError(err));
        this.loading.set(false);
      }
    });
  }

  private parseError(err: any): string {
    const body = err?.error;
    if (!body) return 'Hiba történt a regisztráció során.';

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

    return 'Hiba történt a regisztráció során.';
  }
}
