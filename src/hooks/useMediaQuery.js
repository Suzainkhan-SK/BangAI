import { useState, useEffect } from 'react';

/**
 * Subscribe to a CSS media query from React.
 * SSR/first-paint safe: returns false until the browser reports a match.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    // Safari < 14 only supports addListener
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

/** Named breakpoints shared by CSS (design-system.css) and JS. */
export const BREAKPOINTS = {
  xs: 479,
  sm: 767,
  md: 1023,
  lg: 1200,
  xl: 1599,
};

/**
 * Single source of truth for layout decisions.
 * isMobile  ≤ 767px   → drawer sidebar, single column, full-bleed sheets
 * isTablet  ≤ 1023px  → stacked storyboard, condensed toolbars
 */
export function useBreakpoint() {
  const isXSmall = useMediaQuery(`(max-width: ${BREAKPOINTS.xs}px)`);
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.sm}px)`);
  const isTablet = useMediaQuery(`(max-width: ${BREAKPOINTS.md}px)`);
  const isDesktop = !isTablet;
  const isWide = useMediaQuery(`(min-width: ${BREAKPOINTS.xl + 1}px)`);
  const isTouch = useMediaQuery('(hover: none) and (pointer: coarse)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return { isXSmall, isMobile, isTablet, isDesktop, isWide, isTouch, prefersReducedMotion };
}

/** Lock background scrolling while a drawer/modal is open. */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return undefined;
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [locked]);
}

export default useMediaQuery;
