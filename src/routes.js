// src/routes.js
// Single source of truth for BangAI application routes

export const ROUTES = [
  { path: '',                      view: 'landing',          private: false },
  { path: 'login',                 view: 'login',            private: false },
  { path: 'register',              view: 'register',         private: false },
  { path: 'pricing',               view: 'pricing',          private: false },
  { path: 'api',                   view: 'api',              private: false },
  { path: 'dashboard',             view: 'dashboard',        private: true  },
  { path: 'dashboard/t/:threadId', view: 'dashboard',        private: true, param: 'threadId' },
  { path: 'studio',                view: 'studio',           private: true, redirect: 'studio/voices' },
  { path: 'studio/voices',         view: 'studio-voices',    private: true, tab: 'voices' },
  { path: 'studio/subtitles',      view: 'studio-subtitles', private: true, tab: 'subtitles' },
  { path: 'studio/music',      view: 'studio-music',     private: true, tab: 'music' },
  { path: 'profile',               view: 'profile',          private: true  },
  { path: 'settings',              view: 'settings',         private: true  }
];

export function normalizeRoutePath(rawHash) {
  return String(rawHash || '').replace(/^#\/?/, '').split('?')[0].toLowerCase().trim();
}

export function matchRoute(rawHash) {
  const cleanPath = normalizeRoutePath(rawHash);
  let matched = ROUTES.find(r => r.path === cleanPath);

  if (!matched && cleanPath) matched = ROUTES.find(r => r.view === cleanPath);

  // Single trailing-param routes, e.g. 'dashboard/t/:threadId'
  if (!matched && cleanPath) {
    const parts = cleanPath.split('/');
    matched = ROUTES.find(r => {
      const tpl = r.path.split('/');
      if (!r.param || tpl.length !== parts.length) return false;
      return tpl.every((seg, i) => seg.startsWith(':') || seg === parts[i]);
    });
    if (matched) {
      const tpl = matched.path.split('/');
      const params = {};
      tpl.forEach((seg, i) => { if (seg.startsWith(':')) params[seg.slice(1)] = parts[i]; });
      return { ...matched, path: cleanPath, params };
    }
  }

  if (matched && matched.redirect) {
    const target = ROUTES.find(r => r.path === matched.redirect);
    if (target) return target;
  }

  return matched || null;
}
