'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { loginSchema, LoginFormValues } from '@/lib/schemas';

export default function LoginPage() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    setLoginError(null);
    const ok = await login(data.email, data.password);
    if (ok) {
      router.push('/');
    } else {
      setLoginError('Invalid email or password. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">TrainSmart</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compliance Operations Platform
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="you@example.com"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoComplete="email"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...form.register('password')}
              placeholder="••••••••"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoComplete="current-password"
            />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {loginError && (
            <p className="text-sm text-destructive" role="alert">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
