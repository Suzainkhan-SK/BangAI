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
  const token = localStorage.getItem('bangai_token') || localStorage.getItem('shortsai_token');
  if (!token) {
    // Purge any stale demo user from previous sessions
    localStorage.removeItem('bangai_user');
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
      localStorage.removeItem('bangai_token');
      localStorage.removeItem('bangai_user');
      localStorage.removeItem('shortsai_token');
      localStorage.removeItem('shortsai_user');
      return null;
    }

    const data = await response.json();
    if (data.user) {
      localStorage.setItem('bangai_user', JSON.stringify(data.user));
      localStorage.setItem('shortsai_user', JSON.stringify(data.user));
      return data.user;
    }
  } catch (err) {
    console.warn('[authClient] Session verification error:', err.message);
  }

  return null;
}

export function logoutUser() {
  localStorage.removeItem('bangai_token');
  localStorage.removeItem('bangai_user');
  localStorage.removeItem('shortsai_token');
  localStorage.removeItem('shortsai_user');
}

export const GOOGLE_CLIENT_ID = '332704127629-qeh7u7cvkjdpieluefmpcef85q64khin.apps.googleusercontent.com';

// Verify Google ID Token from Google Identity Services (GSI)
export async function verifyGoogleCredential(credential) {
  const response = await fetch(`${AUTH_ENDPOINT}?action=google-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Google login verification failed');
  }

  if (data.token) {
    localStorage.setItem('bangai_token', data.token);
    localStorage.setItem('shortsai_token', data.token);
  }
  if (data.user) {
    localStorage.setItem('bangai_user', JSON.stringify(data.user));
    localStorage.setItem('shortsai_user', JSON.stringify(data.user));
  }

  return data;
}

// Generate Direct Google OAuth 2.0 URL
export function getGoogleOAuthUrl(returnView = 'dashboard') {
  if (typeof window === 'undefined') return '#';
  const origin = window.location.origin;
  const redirectUri = `${origin}/.netlify/functions/google-auth-callback`;
  const returnUrl = `${origin}/#/${returnView}`;
  const state = btoa(JSON.stringify({ returnUrl }));

  return `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&access_type=offline` +
    `&prompt=${encodeURIComponent('select_account consent')}` +
    `&state=${encodeURIComponent(state)}`;
}

// Smart 1-Click Google Authentication (Direct OAuth Navigation)
export function initiateGoogleAuth(returnView = 'dashboard') {
  if (typeof window !== 'undefined') {
    const targetUrl = getGoogleOAuthUrl(returnView);
    window.location.href = targetUrl;
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
