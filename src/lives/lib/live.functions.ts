import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const CF_VERSION = '/client/v4';

async function cf(path: string, init?: RequestInit) {
  const lovable = process.env['LOVABLE_API_KEY']; const key = process.env['CLOUDFLARE_API_KEY'];
  if (!lovable || !key) throw new Error('Cloudflare n’est pas connecté.');
  const base = (process.env['CONNECTOR_GATEWAY_BASE_URL'] ?? 'https://connector-gateway.lovable.dev').replace(/\/$/, '');
  const res = await fetch(`${base}/cloudflare${CF_VERSION}${path}`, { ...init, headers: { Authorization: `Bearer ${lovable}`, 'X-Connection-Api-Key': key, 'Content-Type': 'application/json' } });
  const body = await res.text();
  let json: { success?: boolean; result?: any; errors?: { message: string }[] } = {};
  try { json = JSON.parse(body); } catch { /* keep raw */ }
  if (!res.ok || !json.success) {
    console.error(`Cloudflare ${path} failed [${res.status}]: ${body}`);
    if (res.status === 403) throw new Error('Cloudflare refuse l’accès : vérifie que la clé a la permission « Stream : Edit » et aucune restriction d’adresse IP.');
    throw new Error('Cloudflare Stream est indisponible pour le moment.');
  }
  return json.result;
}

// Creates the live session and a Cloudflare live input owned by the caller; the stream key is only readable by the artist.
export const startStreamLive = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ title: z.string().trim().min(1).max(120), kind: z.enum(['audio', 'video']).default('video'), genre: z.string().trim().max(30).optional(), settings: z.object({ visibility: z.enum(['public', 'followers', 'private']), join_policy: z.enum(['everyone', 'followers', 'nobody']), guest_slots: z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(8)]), comments_enabled: z.boolean(), gifts_enabled: z.boolean(), strict_spam: z.boolean() }).optional() }))
  .handler(async ({ data, context }) => {
    const accounts = await cf('/accounts?per_page=1');
    const accountId = accounts?.[0]?.id;
    if (!accountId) throw new Error('Aucun compte Cloudflare trouvé.');
    const input = await cf(`/accounts/${accountId}/stream/live_inputs`, { method: 'POST', body: JSON.stringify({ meta: { name: data.title, vinasound_user: context.userId }, recording: { mode: 'automatic' } }) });
    const live = await context.supabase.from('lives').insert({ user_id: context.userId, title: data.title, kind: data.kind, genre: data.genre || null, ...(data.settings ?? {}), stream_url: `https://iframe.videodelivery.net/${input.uid}` }).select('id').single();
    if (live.error) throw new Error('Le live n’a pas pu démarrer.');
    const k = await context.supabase.from('live_stream_keys').insert({ live_id: live.data.id, user_id: context.userId, input_id: input.uid, rtmps_url: input.rtmps?.url ?? '', stream_key: input.rtmps?.streamKey ?? '' });
    if (k.error) throw new Error('La clé de diffusion n’a pas pu être enregistrée.');
    return { id: live.data.id };
  });
