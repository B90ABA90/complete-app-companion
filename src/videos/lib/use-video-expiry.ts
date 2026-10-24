import { useEffect, useState } from 'react';
import { videoExpired } from './video-lifetime';

export function useVideoExpiry(expiresAt: string) {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const check = () => setExpired(videoExpired(expiresAt));
    check();
    const timer = setTimeout(check, Math.max(0, Date.parse(expiresAt) - Date.now()));
    const onVisibility = () => check();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', check);
    };
  }, [expiresAt]);
  return expired;
}