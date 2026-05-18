import { apiFetch, setAccessToken } from './api';

export async function login(email: string, password: string) {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) return false;

  const data = await res.json();
  setAccessToken(data.accessToken);
  return true;
}

export async function logout() {
  await apiFetch('/auth/logout', { method: 'POST' });
  setAccessToken(null);
}
