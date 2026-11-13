import { useState, useSyncExternalStore } from 'react';
const query = '(prefers-reduced-motion: reduce)';
const snapshot = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
const subscribe = (notify: () => void) => {
  const media =
    typeof window.matchMedia === 'function'
      ? window.matchMedia(query)
      : undefined;
  media?.addEventListener('change', notify);
  return () => media?.removeEventListener('change', notify);
};
/** User pause persists after focus leaves; OS reduced-motion changes take effect immediately. */
export function useCarouselMotion() {
  const reduced = useSyncExternalStore(subscribe, snapshot, () => true);
  const [paused, setPaused] = useState(false);
  return { reduced, paused, setPaused, stopped: reduced || paused };
}
