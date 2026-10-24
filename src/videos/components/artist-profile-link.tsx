import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { artistDestination } from '@/shared/lib/vinasound-integration';

export function ArtistProfileLink({ id, username, children, className, label, action = 'profile' }: {
  id: string | null; username?: string | null | undefined; children: ReactNode; className?: string; label: string; action?: 'profile' | 'follow';
}) {
  const href = artistDestination(id, username, action);
  return href ? <a href={href} target="_top" className={className} aria-label={label}>{children}</a> :
    <Button variant="ghost" className={className} aria-label={label} onClick={() => toast(action === 'follow' ? 'La liaison des abonnements au site principal reste à compléter.' : 'Le lien vers ce profil artiste reste à compléter.')}>{children}</Button>;
}