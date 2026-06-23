'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SCROLL_KEY = 'venue-list-scroll';

export function saveScrollPosition() {
  sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
}

export function ScrollRestorer() {
  const pathname = usePathname();

  // Save scroll when clicking into a venue
  useEffect(() => {
    function saveScroll(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a[href^="/venues/"]');
      if (target) saveScrollPosition();
    }
    document.addEventListener('click', saveScroll);
    return () => document.removeEventListener('click', saveScroll);
  }, []);

  return null;
}

// Rendered inside the Suspense boundary (after content loads) to restore scroll
export function ScrollPositionRestorer() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      window.scrollTo(0, parseInt(saved));
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, [pathname]);

  return null;
}
