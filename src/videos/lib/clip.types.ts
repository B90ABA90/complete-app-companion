import { vinasoundIntegration } from '@/shared/lib/vinasound-integration';

export type Profile = { id: string; username: string; display_name: string; bio: string; avatar_path: string | null };
export type ClipVideo = { id: string; expires_at: string; source: string; tiktok_id: string | null; user_id: string | null; creator_name: string; caption: string; video_url: string; storage_path: string | null; song: string; is_example: boolean; profiles: Profile | null; likes: { count: number }[]; comments: { count: number }[] };
export const creatorName = (v: Pick<ClipVideo, 'user_id' | 'profiles' | 'creator_name'>) => {
  const accountName = v.profiles?.display_name.trim();
  if (accountName) return accountName;
  const mappedArtist = v.user_id ? vinasoundIntegration.artistHandles[v.user_id]?.trim() : undefined;
  if (mappedArtist) return mappedArtist;
  const name = v.profiles?.username?.trim();
  if (name && !/^user_[a-f0-9]+$/i.test(name)) return name;
  const publishedName = v.creator_name.trim();
  return publishedName && !/^user_[a-f0-9]+$/i.test(publishedName) ? publishedName : 'Artiste';
};
export const formatCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : String(n);
/** Only the account that published a video may delete it (also enforced by database rules). */
export const canDeleteVideo = (userId: string | null | undefined, v: Pick<ClipVideo, 'user_id' | 'is_example'>) => !!userId && !v.is_example && v.user_id === userId;
