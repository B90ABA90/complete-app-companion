import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Shows the profile photo stored in the private clip-avatars bucket through an
// expiring read URL; falls back to the first letter of the username.
export function Avatar({ path, name, className }: { path?: string | null | undefined; name: string; className: string }) {
  const { data: url } = useQuery({
    queryKey: ['avatar', path],
    enabled: !!path,
    staleTime: 300_000,
    queryFn: async () => {
      if (!path) return '';
      const s = await supabase.storage.from('clip-avatars').createSignedUrl(path, 3600);
      if (s.error) throw s.error;
      return s.data?.signedUrl ?? '';
    },
  });
  if (!path || !url) return <span className={className}>{name.charAt(0).toUpperCase()}</span>;
  return <img src={url} alt={`Photo de ${name}`} className={`${className} object-cover`} />;
}
