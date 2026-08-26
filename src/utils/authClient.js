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
  if (!token) return null;

  try {
    const response = await fetch(`${AUTH_ENDPOINT}?action=me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Token expired or invalid
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
    console.warn('Session verification offline fallback:', err.message);
    const savedUser = localStorage.getItem('shortsai_user');
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch (e) {}
    }
  }

  return null;
}

export function logoutUser() {
  localStorage.removeItem('shortsai_token');
  localStorage.removeItem('shortsai_user');
}

export function getStoredUser() {
  try {
    const saved = localStorage.getItem('shortsai_user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}
