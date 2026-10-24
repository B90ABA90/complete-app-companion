import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Search, Sparkles, Users, Film } from 'lucide-react';
import { ClipShell } from '@/shared/components/clip-shell';
import { VideoGrid } from '@/videos/components/clip-profile';
import { Avatar } from '@/shared/components/clip-avatar';
import { ArtistProfileLink } from '@/videos/components/artist-profile-link';
import { feedOptions } from '@/videos/lib/clip.queries';
import { supabase } from '@/integrations/supabase/client';
export const Route=createFileRoute('/decouvrir')({head:()=>({meta:[{title:'VINASOUND — Découvrir'},{name:'description',content:'Recherche des vidéos, hashtags et créateurs sur VINASOUND.'},{property:'og:title',content:'VINASOUND — Découvrir'},{property:'og:description',content:'Recherche des vidéos, hashtags et créateurs sur VINASOUND.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),loader:({context})=>context.queryClient.ensureQueryData(feedOptions()),component:Page});
function Page(){const [text,setText]=useState('');const [search,setSearch]=useState('');const {data:first}=useSuspenseQuery(feedOptions());const {data:results}=useQuery(feedOptions({search}));const {data:creators=[]}=useQuery({queryKey:['creators',search],queryFn:async()=>{let q=supabase.from('profiles').select('id,username,display_name,bio,avatar_path').limit(20);if(search)q=q.ilike('username',`%${search}%`);const r=await q;if(r.error)throw r.error;return r.data;}});const videos=(results??first).videos;
return <ClipShell title="Découvrir">
<section className="mb-6 rounded-xl bg-gradient-to-br from-primary/25 via-card to-card p-4 md:p-8">
<p className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="size-4"/> Nouveaux sons, nouveaux talents</p>
<h1 className="hidden text-3xl font-bold md:block md:text-4xl">Découvrir</h1>
<p className="mt-1 text-muted-foreground">Trouve des vidéos, des #hashtags et des artistes</p>
<form className="mt-4 flex items-center gap-2 rounded-full border bg-background px-4 shadow-sm focus-within:border-primary" onSubmit={e=>{e.preventDefault();setSearch(text.trim());}}><Search className="size-5 shrink-0 text-primary"/><input value={text} onChange={e=>{setText(e.target.value);setSearch(e.target.value.trim());}} maxLength={100} aria-label="Rechercher" placeholder="Vidéos, #hashtags, créateurs" className="h-12 flex-1 bg-transparent text-base outline-none md:text-sm"/></form>
</section>
<h2 className="flex items-center gap-2 font-semibold"><Users className="size-4 text-primary"/>Créateurs</h2>
{creators.length?<div className="flex snap-x snap-mandatory gap-3 overflow-x-auto py-4">{creators.map(p=><ArtistProfileLink key={p.id} id={p.id} username={p.username} label={`Profil de ${p.display_name}`} className="flex h-auto w-28 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border bg-card p-3 text-center transition hover:border-primary md:w-32 md:p-4"><Avatar path={p.avatar_path} name={p.username} className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-bold text-primary"/><div className="w-full min-w-0"><p className="truncate text-sm font-semibold">{p.display_name}</p><p className="truncate text-xs text-muted-foreground">@{p.username}</p></div></ArtistProfileLink>)}</div>:<p className="my-4 rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">Aucun créateur trouvé.</p>}
<h2 className="mt-4 flex items-center gap-2 pb-3 font-semibold"><Film className="size-4 text-primary"/>{search?'Résultats vidéo':'À découvrir'}</h2>
{videos.length?<VideoGrid videos={videos}/>:<div className="rounded-xl border border-dashed p-10 text-center"><Film className="mx-auto size-8 text-muted-foreground"/><p className="mt-3 font-semibold">Aucune vidéo pour le moment</p><p className="text-sm text-muted-foreground">Publie la première ou reviens bientôt.</p><Link to="/publier" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Publier une vidéo</Link></div>}
</ClipShell>;}