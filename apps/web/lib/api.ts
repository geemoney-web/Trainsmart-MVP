let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// --- TGA API helpers ---

export async function searchTgaQualifications(query: string) {
  return apiFetch(`/tga/qualifications/search?q=${encodeURIComponent(query)}`);
}

export async function importTgaQualification(
  rtoId: string,
  qualificationCode: string,
) {
  return apiFetch(`/tga/rtos/${rtoId}/qualifications/import`, {
    method: 'POST',
    body: JSON.stringify({ qualificationCode }),
  });
}

export async function getRtoQualifications(rtoId: string) {
  return apiFetch(`/tga/rtos/${rtoId}/qualifications`);
}

// --- Core fetch ---

export async function apiFetch(path: string, init: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    const refreshRes = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setAccessToken(data.accessToken);
      headers['Authorization'] = `Bearer ${data.accessToken}`;
      const retry = await fetch(`/api/v1${path}`, {
        ...init,
        credentials: 'include',
        headers,
      });
      if (!retry.ok) throw new Error(await retry.text());
      return retry.json();
    } else {
      setAccessToken(null);
      window.location.href = '/login';
      return;
    }
  }

  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}
