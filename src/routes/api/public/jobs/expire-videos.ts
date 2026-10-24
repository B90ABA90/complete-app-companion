import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';
import { deleteExpiredVideos } from '@/videos/lib/video-lifetime';

export const Route = createFileRoute('/api/public/jobs/expire-videos')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        const cutoff = new Date().toISOString();
        const result = await supabaseAdmin.from('videos').select('id,storage_path').lte('expires_at', cutoff).order('expires_at').limit(50);
        if (result.error) return Response.json({ success: false }, { status: 503 });
        const counts = await deleteExpiredVideos(result.data ?? [], async path => {
          const removed = await supabaseAdmin.storage.from('clip-videos').remove([path]);
          if (removed.error) throw new Error('Storage cleanup failed');
        }, async id => {
          const removed = await supabaseAdmin.from('videos').delete().eq('id', id).lte('expires_at', cutoff);
          if (removed.error) throw new Error('Video cleanup failed');
        });
        return Response.json({ success: counts.failed === 0, ...counts }, { status: counts.failed ? 503 : 200 });
      },
    },
  },
});