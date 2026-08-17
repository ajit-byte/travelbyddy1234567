
const BASE = import.meta.env.VITE_API_URL;

function getToken() {
  try {
    return JSON.parse(localStorage.getItem('authTokens'))?.token || '';
  } catch {
    return '';
  }
}

export async function apiFetch(path, options = {}) {
  const headers = {
    'x-auth-token': getToken(),
    ...options.headers,
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  return res;
}

export async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Request failed');
  return data;
}
