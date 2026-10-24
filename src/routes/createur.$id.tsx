import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipShell } from '@/shared/components/clip-shell';
import { Button } from '@/components/ui/button';
import { artistDestination } from '@/shared/lib/vinasound-integration';
import { supabase } from '@/integrations/supabase/client';
export const Route=createFileRoute('/createur/$id')({head:()=>({meta:[{title:'VINASOUND — Profil artiste principal'},{name:'description',content:'Accède au profil artiste sur le site audio VINASOUND.'},{property:'og:title',content:'VINASOUND — Profil artiste principal'},{property:'og:description',content:'Accède au profil artiste sur le site audio VINASOUND.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){
  const {id}=Route.useParams();
  const {data:profile,isPending}=useQuery({queryKey:['profile',id],queryFn:async()=>{const r=await supabase.from('profiles').select('username').eq('id',id).maybeSingle();if(r.error)throw r.error;return r.data;}});
  const href=artistDestination(id,profile?.username);
  useEffect(()=>{if(href)window.location.replace(href);},[href]);
  return <ClipShell title="Artiste VINASOUND"><div className="space-y-4 py-8">{href?<Button asChild><a href={href} target="_top">Ouvrir le profil artiste</a></Button>:<p>{isPending?'Chargement…':'Le lien vers ce profil artiste reste à compléter.'}</p>}<Button asChild variant="outline"><Link to="/">Retour aux vidéos</Link></Button></div></ClipShell>;
}