import { useSyncExternalStore } from 'react';

export type UploadState = { status: 'idle' | 'uploading' | 'finishing' | 'done' | 'error'; progress: number; message?: string };
let state: UploadState = { status: 'idle', progress: 0 };
const subs = new Set<() => void>();
export const setUpload = (next: UploadState) => { state = next; subs.forEach(f => f()); };
export const useUpload = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => state, () => state);

/** Uploads straight to the private bucket with real byte progress (fetch has no upload progress). */
export function uploadWithProgress(path: string, file: File, token: string, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${import.meta.env['VITE_SUPABASE_URL']}/storage/v1/object/clip-videos/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('La vidéo n’a pas pu être envoyée.')));
    xhr.onerror = () => reject(new Error('Connexion interrompue pendant l’envoi.'));
    xhr.send(file);
  });
}
