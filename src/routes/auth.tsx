import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [
    { title: 'VINASOUND — Accès direct' },
    { name: 'description', content: 'Accède directement aux vidéos VINASOUND.' },
    { property: 'og:title', content: 'VINASOUND — Accès direct' },
    { property: 'og:description', content: 'Accède directement aux vidéos VINASOUND.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  beforeLoad: () => { throw redirect({ to: '/', replace: true }); },
});
