import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required]
  });

  protected loading = signal(false);
  protected error = signal<string | null>(null);
  protected success = signal(false);

  submit(): void {
    if (this.form.invalid) return;
    const { email, password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.error.set('A jelszavak nem egyeznek!');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.register({ email: email!, password: password! }).subscribe({
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
