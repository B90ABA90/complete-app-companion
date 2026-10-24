import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database } from '@/integrations/supabase/types';
import type { ClipVideo } from './clip.types';
import { MAX_VIDEO_BYTES, videoFormat } from './clip-upload';
import { videoUrlLifetime } from './video-lifetime';

export const getFeed = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ page: z.number().int().min(0).default(0), search: z.string().max(100).default(''), creator: z.string().uuid().optional(), video: z.string().uuid().optional() }))
  .handler(async ({ data }) => {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error('Le fil est momentanément indisponible.');
    const db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key); return fetch(input, { ...init, headers });
    } } });
    let query = db.from('videos').select('*,profiles!videos_user_id_fkey(id,username,display_name,bio,avatar_path),likes(count),comments(count)').gt('expires_at', new Date().toISOString()).eq('visibility', 'public').neq('source', 'tiktok').eq('status', 'published').order('created_at', { ascending: false }).order('id').range(data.page * 20, data.page * 20 + 19);
    if (data.search) query = query.ilike('caption', `%${data.search}%`);
    if (data.creator) query = query.eq('user_id', data.creator);
    if (data.video) query = query.eq('id', data.video);
    const result = await query;
    if (result.error) throw new Error('Impossible de charger les vidéos.');
    const videos = await Promise.all((result.data ?? []).map(async (v) => {
      if (!v.storage_path) return v;
      const lifetime = videoUrlLifetime(v.expires_at);
      if (!lifetime) return { ...v, video_url: '' };
      const signed = await db.storage.from('clip-videos').createSignedUrl(v.storage_path, lifetime);
      return { ...v, video_url: signed.data?.signedUrl ?? '' };
    }));
    return { videos: videos as ClipVideo[], hasMore: videos.length === 20 };
  });

export const publishVideo = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: FormData) => { if (!(input instanceof FormData)) throw new Error('Envoi invalide.'); return input; })
  .handler(async ({ data, context }) => {
    const file = data.get('video');
    const caption = z.string().trim().max(500).parse(data.get('caption') ?? '');
    const visibility = z.enum(['public', 'private']).parse(data.get('visibility') ?? 'public');
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_VIDEO_BYTES) throw new Error('Choisis une vidéo de moins de 50 Mo.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const format = videoFormat(bytes);
    if (!format) throw new Error('Seules les vidéos MP4 et WebM sont acceptées.');
    const profile = await context.supabase.rpc('ensure_clip_profile');
    if (profile.error) throw new Error('Ton profil n’a pas pu être préparé. Réessaie.');
    const path = `${context.userId}/${crypto.randomUUID()}.${format}`;
    const { error: uploadError } = await context.supabase.storage.from('clip-videos').upload(path, bytes, { contentType: format === 'mp4' ? 'video/mp4' : 'video/webm', upsert: false });
    if (uploadError) throw new Error('La vidéo n’a pas pu être envoyée. Réessaie.');
    const result = await context.supabase.from('videos').insert({ user_id: context.userId, caption, storage_path: path, video_url: '', visibility }).select('id').single();
    if (result.error) { console.error('Video publication database error', result.error.code, result.error.message); await context.supabase.storage.from('clip-videos').remove([path]); throw new Error('La publication a échoué.'); }
    return result.data;
  });


export const finalizeVideo = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp4|webm)$/), caption: z.string().trim().max(500), visibility: z.enum(['public', 'private']) }))
  .handler(async ({ data, context }) => {
    if (!data.path.startsWith(`${context.userId}/`)) throw new Error('Envoi invalide.');
    const profile = await context.supabase.rpc('ensure_clip_profile');
    if (profile.error) throw new Error('Ton profil n’a pas pu être préparé. Réessaie.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const file = await supabaseAdmin.storage.from('clip-videos').download(data.path);
    const bytes = file.data ? new Uint8Array(await file.data.slice(0, 16).arrayBuffer()) : null;
    if (!file.data || file.data.size > MAX_VIDEO_BYTES || !bytes || !videoFormat(bytes)) { await supabaseAdmin.storage.from('clip-videos').remove([data.path]); throw new Error('Seules les vidéos MP4 et WebM de moins de 50 Mo sont acceptées.'); }
    const result = await context.supabase.from('videos').insert({ user_id: context.userId, caption: data.caption, storage_path: data.path, video_url: '', visibility: data.visibility }).select('id').single();
    if (result.error) { console.error('Video publication database error', result.error.code, result.error.message); await supabaseAdmin.storage.from('clip-videos').remove([data.path]); throw new Error('La publication a échoué.'); }
    return result.data;
  });
