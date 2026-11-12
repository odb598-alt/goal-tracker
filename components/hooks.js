'use client';
import { useState, useEffect, useRef } from 'react';

export function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(Math.floor(el.getBoundingClientRect().width));
    const ro = new ResizeObserver((es) => setW(Math.floor(es[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function usePrefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}