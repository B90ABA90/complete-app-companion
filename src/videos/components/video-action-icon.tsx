import type { SVGProps } from 'react';

export function VideoActionIcon({ kind, ...props }: SVGProps<SVGSVGElement> & { kind: 'heart' | 'comment' | 'bookmark' | 'share' }) {
  return <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" {...props}>
    {kind === 'heart' && <path d="M24 41S5 30 5 17C5 5 20 4 24 13 28 4 43 5 43 17c0 13-19 24-19 24Z" />}
    {kind === 'comment' && <><path d="M24 5C11 5 2 13 2 23c0 10 8 17 20 18l1 5c0 1 1 1 2 0 12-7 21-13 21-23C46 13 37 5 24 5Z" /><g fill="var(--video-action-background)"><circle cx="14" cy="23" r="3"/><circle cx="24" cy="23" r="3"/><circle cx="34" cy="23" r="3"/></g></>}
    {kind === 'bookmark' && <path d="M14 6h20a4 4 0 0 1 4 4v31c0 2-2 3-4 1L24 33 14 42c-2 2-4 1-4-1V10a4 4 0 0 1 4-4Z"/>}
    {kind === 'share' && <path d="M23 4c0-2 2-3 4-1l19 17c2 2 2 3 0 5L27 44c-2 2-4 1-4-1V31C12 31 7 34 3 39c-1 1-3 0-2-2C3 20 11 16 23 15Z"/>}
  </svg>;
}