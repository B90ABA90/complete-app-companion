import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Film, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClipNav } from '@/shared/components/clip-shell';
import { VideoModal, VideoTile } from '@/videos/components/video-modal';
import { feedOptions } from '@/videos/lib/clip.queries';
import { VinasoundBrand } from '@/shared/components/vinasound-brand';
import { parseVideoSearch, type VideoSearch } from '@/videos/lib/clip-share';

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): VideoSearch => parseVideoSearch(search),
  head: () => ({ meta: [{ title: 'VINASOUND — Vidéos courtes' }, { name: 'description', content: 'Découvre des vidéos, partage tes créations et retrouve tes créateurs sur VINASOUND.' }, { property: 'og:title', content: 'VINASOUND — Vidéos courtes' }, { property: 'og:description', content: 'Découvre des vidéos, partage tes créations et retrouve tes créateurs sur VINASOUND.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(feedOptions()), component: Index,
});

function Index() {
  const { v: openId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [page, setPage] = useState(0);
  const { data: first } = useSuspenseQuery(feedOptions());
  const { data: next } = useQuery({ ...feedOptions({ page }), enabled: page > 0 });
  const current = page === 0 ? first : next;
  const list = current?.videos ?? [];
  const open = (id: string) => navigate({ search: { v: id } });
  const close = () => navigate({ search: {}, replace: true });

  return <div className="min-h-dvh bg-background">
    <header className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" search={{}} aria-label="VINASOUND — Accueil"><VinasoundBrand /></Link>
        <Button asChild className="rounded-full"><Link to="/publier"><Plus strokeWidth={2.5} />Publier</Link></Button>
      </div>
      <div className="mx-auto max-w-6xl px-4"><ClipNav inline /></div>
    </header>

    <main className="mx-auto max-w-6xl px-4 py-6">
      <section aria-labelledby="videos-title">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h1 id="videos-title" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><Film className="size-6 text-primary" />Vidéos</h1>
            <p className="text-sm text-muted-foreground">Appuie sur une vidéo pour la regarder.</p>
          </div>
        </div>

        {list.length > 0
          ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{list.map(v => <VideoTile key={v.id} v={v} onOpen={open} />)}</div>
          : <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center"><p className="text-muted-foreground">{page > 0 && !next ? 'Chargement…' : 'Aucune vidéo pour le moment.'}</p>{page === 0 && <Button asChild size="lg" className="rounded-full"><Link to="/publier">Publier une vidéo</Link></Button>}</div>}

        <div className="flex flex-wrap justify-center gap-3 py-6">
          {page > 0 && <Button variant="ghost" onClick={() => setPage(page - 1)}>Vidéos précédentes</Button>}
          {current?.hasMore && <Button onClick={() => setPage(page + 1)}>Vidéos suivantes</Button>}
        </div>
      </section>
    </main>

    <VideoModal id={openId} videos={list} onClose={close} />
  </div>;
}
