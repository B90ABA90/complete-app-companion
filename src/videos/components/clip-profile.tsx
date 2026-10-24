import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useVideoExpiry } from '@/videos/lib/use-video-expiry';
type GridVideo = { id: string; expires_at: string; video_url: string; caption: string; visibility?: string; source?: string; tiktok_id?: string | null };
export function VideoGrid({ videos, own=false, onDelete }: { videos: GridVideo[]; own?:boolean; onDelete?:(id:string)=>void }) {
 return <div className="grid grid-cols-2 gap-2 py-5">{videos.map(v=><VideoGridItem key={v.id} v={v} own={own} onDelete={onDelete}/>)}{videos.length===0&&<p className="col-span-2 py-10 text-center text-muted-foreground">Aucune vidéo pour le moment.</p>}</div>;
}
function VideoGridItem({v,own,onDelete}:{v:GridVideo;own:boolean;onDelete:((id:string)=>void)|undefined}) {
 const expired=useVideoExpiry(v.expires_at);
 if(expired)return null;
 return <div className="relative min-w-0 overflow-hidden rounded-md bg-card"><Link to="/video/$id" params={{id:v.id}} className="block"><video src={v.video_url} muted playsInline preload="metadata" className="aspect-[3/4] w-full object-cover"/><p className="line-clamp-2 break-words p-2 text-xs">{v.caption||'Son original'}</p></Link>{v.visibility==='private'&&<span className="absolute left-2 top-2 bg-background px-2 text-xs">Privée</span>}{own&&<Button variant="ghost" size="sm" className="w-full text-primary" onClick={()=>onDelete?.(v.id)}>Supprimer</Button>}</div>;
}
