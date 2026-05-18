export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<{ data: T; ok: boolean }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { data: data as T, ok: res.ok };
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getStoredUser() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}
