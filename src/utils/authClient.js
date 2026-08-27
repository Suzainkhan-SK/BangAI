// authClient.js — Real Client-Side API Helper for Authentication
const AUTH_ENDPOINT = '/.netlify/functions/auth';

export async function registerUser({ name, email, password, channel, niche, plan }) {
  const response = await fetch(`${AUTH_ENDPOINT}?action=register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      email,
      password,
      channel,
      niche,
      plan
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create account');
  }

  if (data.token) {
    localStorage.setItem('shortsai_token', data.token);
  }
  if (data.user) {
    localStorage.setItem('shortsai_user', JSON.stringify(data.user));
  }

  return data;
}

export async function loginUser(email, password) {
  const response = await fetch(`${AUTH_ENDPOINT}?action=login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Invalid email or password');
  }

  if (data.token) {
    localStorage.setItem('shortsai_token', data.token);
  }
  if (data.user) {
    localStorage.setItem('shortsai_user', JSON.stringify(data.user));
  }

  return data;
}

export async function verifySession() {
  const token = localStorage.getItem('shortsai_token');
  if (!token) {
    // Purge any stale demo user from previous sessions
    localStorage.removeItem('shortsai_user');
    return null;
  }

  try {
    const response = await fetch(`${AUTH_ENDPOINT}?action=me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Token expired or invalid — force clean logout
      localStorage.removeItem('shortsai_token');
      localStorage.removeItem('shortsai_user');
      return null;
    }

    const data = await response.json();
    if (data.user) {
      localStorage.setItem('shortsai_user', JSON.stringify(data.user));
      return data.user;
    }
  } catch (err) {
    console.warn('[authClient] Session verification error:', err.message);
  }

  return null;
}

export function logoutUser() {
  localStorage.removeItem('shortsai_token');
  localStorage.removeItem('shortsai_user');
}

export function initiateGoogleAuth(returnView = 'dashboard') {
  if (typeof window !== 'undefined') {
    const returnUrl = encodeURIComponent(`${window.location.origin}/#/${returnView}`);
    window.location.href = `${AUTH_ENDPOINT}?action=google&returnUrl=${returnUrl}`;
  }
}

export function getAuthToken() {
  return typeof window !== 'undefined' ? (localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token') || '') : '';
}

export function getStoredUser() {
  // STRICT: User is only valid if a real JWT token exists in storage
  const token = typeof window !== 'undefined' ? (localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token')) : null;
  if (!token) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bangai_user');
      localStorage.removeItem('shortsai_user');
    }
    return null;
  }

  try {
    const saved = localStorage.getItem('bangai_user') || localStorage.getItem('shortsai_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}
