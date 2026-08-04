async function api(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`)
  return json
}

export function fetchMe() {
  return fetch('/api/auth/me', { credentials: 'same-origin' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => (j?.user || null))
    .catch(() => null)
}

export function login(email, password) {
  return api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function logout() {
  return api('/api/auth/logout', { method: 'POST' })
}
