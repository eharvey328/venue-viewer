'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SCROLL_KEY = 'venue-list-scroll';

export function ScrollRestore() {
  const pathname = usePathname();
  const saved = useRef(false);

  useEffect(() => {
    if (pathname !== '/') return;
    const y = sessionStorage.getItem(SCROLL_KEY);
    if (y) {
      window.scrollTo({ top: parseInt(y), behavior: 'instant' });
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = () => {
      if (!saved.current) {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
        saved.current = true;
      }
    };
    document.addEventListener('click', handleClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      saved.current = false;
    };
  }, []);

  return null;
}
