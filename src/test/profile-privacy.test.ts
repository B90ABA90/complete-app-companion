import { describe, expect, it } from 'vitest';
import { loadEnv } from 'vite';

// Exercise the real Data API as a visitor, not the privileged migration client.
const env = loadEnv('development', process.cwd(), 'VITE_');
async function read(resource: string) {
  const response = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${resource}`, {
    headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY },
  });
  expect(response.status).toBe(200);
  return response.json();
}

describe('VINASOUND visitor privacy', () => {
  it('does not expose an inactive private account to visitors', async () => {
    expect(await read('profiles?select=id&id=eq.a8f47d75-01b7-4ae4-ba9b-8c4950c26999')).toEqual([]);
  });

  it('does not expose personal follow relationships to visitors', async () => {
    expect(await read('follows?select=follower_id,followed_id&limit=10')).toEqual([]);
  });

  it('preserves artist identity on a current public video', async () => {
    const rows = await read('videos?select=id,user_id,profiles!videos_user_id_fkey(id)&visibility=eq.public&status=eq.published&source=neq.tiktok&user_id=not.is.null&limit=1');
    expect(rows.length).toBe(1);
    expect(rows[0].profiles?.id).toBe(rows[0].user_id);
  });
});