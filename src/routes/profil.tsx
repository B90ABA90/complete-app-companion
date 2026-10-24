import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ClipShell, AccountUnavailable } from '@/shared/components/clip-shell';
import { VideoGrid } from '@/videos/components/clip-profile';
import { useClipSession } from '@/shared/components/clip-session';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { videoUrlLifetime } from '@/videos/lib/video-lifetime';
import { safeMainSiteUrl, vinasoundIntegration } from '@/shared/lib/vinasound-integration';
export const Route=createFileRoute('/profil')({head:()=>({meta:[{title:'VINASOUND — Mes vidéos'},{name:'description',content:'Retrouve et gère tes vidéos temporaires VINASOUND.'},{property:'og:title',content:'VINASOUND — Mes vidéos'},{property:'og:description',content:'Retrouve et gère tes vidéos temporaires VINASOUND.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:Page});
function Page(){const {user,ready}=useClipSession();const qc=useQueryClient();const [busy,setBusy]=useState(false);const [deleteId,setDeleteId]=useState<string|null>(null);const accountUrl=safeMainSiteUrl(vinasoundIntegration.accountUrl);
const {data:videos=[]}=useQuery({queryKey:['own-videos',user?.id],enabled:!!user,refetchInterval:30000,queryFn:async()=>{const r=await supabase.from('videos').select('*').gt('expires_at',new Date().toISOString()).eq('user_id',user?.id??'').neq('source','tiktok').order('created_at',{ascending:false}).limit(100);if(r.error)throw r.error;return Promise.all(r.data.map(async v=>{if(!v.storage_path)return v;const lifetime=videoUrlLifetime(v.expires_at);if(!lifetime)return {...v,video_url:''};const s=await supabase.storage.from('clip-videos').createSignedUrl(v.storage_path,lifetime);return {...v,video_url:s.data?.signedUrl??''};}));}});
return <ClipShell title="Mes vidéos" action={<Button asChild variant="ghost" size="icon"><Link to="/notifications" aria-label="Notifications"><Bell/></Link></Button>}>{!ready?<p>Chargement…</p>:!user?<AccountUnavailable/>:<>{accountUrl && <Button asChild variant="outline"><a href={accountUrl} target="_top">Mon compte VINASOUND</a></Button>}<VideoGrid videos={videos} own onDelete={setDeleteId}/></>}
<Dialog open={!!deleteId} onOpenChange={o=>!o&&setDeleteId(null)}><DialogContent aria-describedby={undefined} className="max-w-sm"><DialogTitle>Supprimer cette vidéo ?</DialogTitle><Button variant="destructive" disabled={busy} onClick={async()=>{if(!deleteId)return;setBusy(true);const v=videos.find(v=>v.id===deleteId);const r=await supabase.from('videos').delete().eq('id',deleteId);if(r.error)toast.error('Suppression impossible.');else{if(v?.storage_path)await supabase.storage.from('clip-videos').remove([v.storage_path]);qc.invalidateQueries({queryKey:['own-videos']});qc.invalidateQueries({queryKey:['feed']});setDeleteId(null);}setBusy(false);}}>Supprimer définitivement</Button><Button variant="ghost" onClick={()=>setDeleteId(null)}>Annuler</Button></DialogContent></Dialog></ClipShell>;}