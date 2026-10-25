import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClipNav } from '@/shared/components/clip-shell';
import { VideoCard } from '@/videos/components/clip-video';
import { feedOptions } from '@/videos/lib/clip.queries';
import { VinasoundBrand } from '@/shared/components/vinasound-brand';
export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'VINASOUND — Vidéos courtes' }, { name: 'description', content: 'Découvre des vidéos, partage tes créations et retrouve tes créateurs sur VINASOUND.' }, { property: 'og:title', content: 'VINASOUND — Vidéos courtes' }, { property: 'og:description', content: 'Découvre des vidéos, partage tes créations et retrouve tes créateurs sur VINASOUND.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(feedOptions()), component: Index,
});
function Index() {
  const [page, setPage] = useState(0);
  const { data: first } = useSuspenseQuery(feedOptions());
  const { data: next } = useQuery(feedOptions({ page }));
  const current = page === 0 ? first : next;
  const list = current?.videos ?? [];
  return <main className="feed-page relative mx-auto h-dvh max-w-md overflow-hidden bg-background"><header className="relative z-20 grid h-24 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-card px-4"><div className="flex min-w-0 items-center"><VinasoundBrand /><h1 className="sr-only">Vidéos</h1></div>{list.length > 0 && <Button asChild size="icon" className="size-12 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"><Link to="/publier" aria-label="Publier une vidéo" title="Publier une vidéo"><Plus className="size-6" strokeWidth={2.5} /></Link></Button>}</header><div key={page} className="snap-feed h-[calc(100dvh-10rem)] overflow-y-scroll">{list.map(v => <VideoCard key={v.id} v={v} />)}{list.length === 0 && <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"><p className="text-muted-foreground">Aucune vidéo pour le moment.</p><Button asChild size="lg" className="rounded-full"><Link to="/publier">Publier une vidéo</Link></Button></div>}{current?.hasMore && <div className="flex justify-center py-6"><Button onClick={() => setPage(page + 1)}>Vidéos suivantes</Button></div>}{page > 0 && <div className="flex justify-center pb-6"><Button variant="ghost" onClick={() => setPage(page - 1)}>Vidéos précédentes</Button></div>}</div><ClipNav standalone /></main>;
}
