import { AudioLines } from 'lucide-react';

export function VinasoundBrand({ large = false }: { large?: boolean }) {
  return <span className={`inline-flex shrink-0 items-center gap-2.5 font-extrabold tracking-tight ${large ? 'text-xl' : 'text-base'}`}>
    <span className={`inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground ${large ? 'size-10' : 'size-8'}`}><AudioLines aria-hidden className={large ? 'size-6' : 'size-5'} /></span>
    <span className="leading-none">VINA<span className="text-primary">SOUND</span></span>
  </span>;
}
