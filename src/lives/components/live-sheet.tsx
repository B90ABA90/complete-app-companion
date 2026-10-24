import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function LiveSheet({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; children: ReactNode }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="live-theme max-h-[85dvh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-lg bg-card text-foreground"><DialogTitle>{title}</DialogTitle><DialogDescription className="sr-only">Commandes du live VINASOUND</DialogDescription>{children}</DialogContent></Dialog>;
}