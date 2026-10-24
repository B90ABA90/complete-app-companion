import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { VideoCard } from '@/videos/components/clip-video';
import { ClipNav, ClipSidebar } from '@/shared/components/clip-shell';
import { Button } from '@/components/ui/button';
import { feedOptions } from '@/videos/lib/clip.queries';
export const Route = createFileRoute('/video/$id')({
  head: () => ({ meta: [{ title: 'VINASOUND — Une vidéo à partager' }, { name: 'description', content: 'Regarde cette vidéo et rejoins la conversation sur VINASOUND.' }, { property: 'og:title', content: 'VINASOUND — Une vidéo à partager' }, { property: 'og:description', content: 'Regarde cette vidéo et rejoins la conversation sur VINASOUND.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(feedOptions({ video: params.id })), component: Page,
});
function Page() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(feedOptions({ video: id }));
  const video = data.videos[0];
  return <div className="flex h-dvh bg-background">
    <ClipSidebar />
    <main className="relative mx-auto flex h-dvh w-full min-w-0 max-w-md flex-col overflow-hidden bg-background pb-16 md:pb-0">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-card px-3">
        <Button asChild variant="ghost" className="h-11 px-3">
          <Link to="/" aria-label="Retour à l’accueil"><ArrowLeft />Accueil</Link>
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">Vidéo</h1>
        <Button asChild variant="outline" size="sm"><Link to="/profil">Mes vidéos</Link></Button>
      </header>
      <div className="relative min-h-0 flex-1 overflow-hidden [&>section]:h-full">
        {video ? <VideoCard v={video} /> : <p className="p-8">Vidéo indisponible. <Link to="/" className="underline">Retour au fil</Link></p>}
      </div>
      <ClipNav />
    </main>
  </div>;
}