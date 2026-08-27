// googleAuthHelper.js — High-Performance Singleton Google Identity Services (GSI) Client
import { GOOGLE_CLIENT_ID, verifyGoogleCredential } from './authClient';

let isGsiInitialized = false;
let currentSuccessHandler = null;
let currentErrorHandler = null;

/**
 * Global Callback invoked by Google Identity Services when user selects an account
 */
async function globalCredentialCallback(response) {
  if (!response || !response.credential) {
    if (typeof currentErrorHandler === 'function') {
      currentErrorHandler(new Error('No credential returned by Google'));
    }
    return;
  }

  try {
    const data = await verifyGoogleCredential(response.credential);
    if (typeof currentSuccessHandler === 'function') {
      currentSuccessHandler(data.user);
    }
  } catch (err) {
    if (typeof currentErrorHandler === 'function') {
      currentErrorHandler(err);
    }
  }
}

/**
 * Ensure GSI SDK is initialized exactly once
 */
export function ensureGsiInitialized() {
  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
    return false;
  }

  if (!isGsiInitialized) {
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: globalCredentialCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true
      });
      isGsiInitialized = true;
    } catch (e) {
      console.warn('[googleAuthHelper] GSI initialize warning:', e);
    }
  }

  return isGsiInitialized;
}

/**
 * Safely render Google Sign-In button into a DOM container
 */
export function renderGoogleSignInButton(containerElement, { text = 'continue_with', theme = 'filled_blue', width = 380, onSuccess, onError } = {}) {
  if (!containerElement || typeof window === 'undefined') return () => {};

  currentSuccessHandler = onSuccess;
  currentErrorHandler = onError;

  const tryRender = () => {
    if (ensureGsiInitialized() && window.google?.accounts?.id) {
      try {
        containerElement.innerHTML = '';
        window.google.accounts.id.renderButton(containerElement, {
          theme,
          size: 'large',
          shape: 'pill',
          width,
          text,
          logo_alignment: 'left'
        });
        return true;
      } catch (err) {
        console.warn('[googleAuthHelper] renderButton error:', err);
      }
    }
    return false;
  };

  if (!tryRender()) {
    const interval = setInterval(() => {
      if (tryRender()) {
        clearInterval(interval);
      }
    }, 250);
    return () => clearInterval(interval);
  }

  return () => {};
}
