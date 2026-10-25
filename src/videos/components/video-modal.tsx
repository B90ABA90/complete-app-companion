import { useQuery } from '@tanstack/react-query';
import { Heart, Loader2, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VideoCard } from './clip-video';
import { feedOptions } from '@/videos/lib/clip.queries';
import { creatorName, formatCount, type ClipVideo } from '@/videos/lib/clip.types';
import { useVideoExpiry } from '@/videos/lib/use-video-expiry';

/** A video card shown in the page grid; clicking it opens the player in a modal on the same page. */
export function VideoTile({ v, onOpen }: { v: ClipVideo; onOpen: (id: string) => void }) {
  const expired = useVideoExpiry(v.expires_at);
  if (expired) return null;
  const name = creatorName(v);
  return <button type="button" onClick={() => onOpen(v.id)} aria-label={`Lire la vidéo de ${name}`} className="group relative block w-full min-w-0 overflow-hidden rounded-xl border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <span className="relative block aspect-[3/4] bg-muted">
      {v.video_url && <video src={`${v.video_url}#t=0.1`} muted playsInline preload="metadata" tabIndex={-1} className="pointer-events-none h-full w-full object-cover" />}
      <span className="absolute inset-0 flex items-center justify-center bg-brand-ink/10 opacity-90 transition group-hover:bg-brand-ink/30">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition group-hover:scale-110"><Play className="size-6 translate-x-0.5 fill-current" /></span>
      </span>
      <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-brand-ink/80 px-2 py-0.5 text-xs font-semibold text-foreground"><Heart className="size-3" />{formatCount(v.likes[0]?.count ?? 0)}</span>
    </span>
    <span className="block p-2.5">
      <span className="block truncate text-sm font-semibold">{name}</span>
      <span className="line-clamp-2 break-words text-xs text-muted-foreground">{v.caption || 'Son original'}</span>
    </span>
  </button>;
}

/** Player modal for the video whose id is in the page address (?v=…). */
export function VideoModal({ id, videos, onClose }: { id: string | undefined; videos: ClipVideo[]; onClose: () => void }) {
  const inList = id ? videos.find(v => v.id === id) : undefined;
  const { data, isPending } = useQuery({ ...feedOptions({ video: id }), enabled: !!id && !inList });
  const video = inList ?? data?.videos[0];
  return <Dialog open={!!id} onOpenChange={o => { if (!o) onClose(); }}>
    <DialogContent aria-describedby={undefined} className="h-[min(92dvh,900px)] w-[min(100vw,30rem)] max-w-none gap-0 overflow-hidden border-0 bg-background p-0 sm:rounded-2xl [&>button]:z-30 [&>button]:rounded-full [&>button]:bg-brand-ink/80 [&>button]:p-2 [&>button]:text-foreground [&>button]:opacity-100">
      <DialogTitle className="sr-only">{video ? `Vidéo de ${creatorName(video)}` : 'Vidéo'}</DialogTitle>
      <div className="h-full min-h-0 [&>section]:h-full">
        {video ? <VideoCard key={video.id} v={video} /> : !inList && id && isPending ? <div className="flex h-full items-center justify-center"><Loader2 aria-label="Chargement de la vidéo" className="size-10 animate-spin text-primary" /></div> : <p className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">Vidéo indisponible.</p>}
      </div>
    </DialogContent>
  </Dialog>;
}
