import { Link, useRouterState } from '@tanstack/react-router';
import { Radio, User, ArrowLeft, Clapperboard } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { VinasoundBrand } from './vinasound-brand';

const NAV = [{ to: '/', label: 'Vidéos', Icon: Clapperboard }, { to: '/lives', label: 'Lives', Icon: Radio }] as const;
const isActive = (path: string, to: string) => to === '/lives' ? path === '/lives' || path.startsWith('/live/') : path !== '/lives' && !path.startsWith('/live/');

export function ClipNav({ standalone = false }: { standalone?: boolean }) {
  const path = useRouterState({ select: s => s.location.pathname });
  return <nav aria-label="Navigation principale" className={`clip-nav absolute inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t pb-[env(safe-area-inset-bottom)] ${standalone ? '' : 'md:hidden'}`}>
    {NAV.map(({ to, label, Icon }) => { const on = isActive(path, to); return <Link key={to} to={to} aria-label={label} aria-current={on ? 'page' : undefined} className={`relative flex h-16 min-w-0 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-200 active:scale-95 ${on ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
      {on && <span aria-hidden className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
      <><span className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-200 ${on ? 'bg-primary/15' : ''}`}><Icon className="size-5" strokeWidth={on ? 2.4 : 2} /></span><span className="truncate">{label}</span></>
    </Link>; })}
  </nav>;
}

const SECTIONS = [{ title: 'Menu', items: NAV }] as const;

export function ClipSidebar() {
  const path = useRouterState({ select: s => s.location.pathname });
  return <aside aria-label="Menu VINASOUND" className="hidden w-64 shrink-0 flex-col gap-7 overflow-y-auto border-r bg-card/60 px-4 py-6 md:flex">
    <Link to="/" aria-label="VINASOUND — Accueil" className="rounded-xl px-2 py-1 transition-opacity hover:opacity-90"><VinasoundBrand large /></Link>
    {SECTIONS.map(s => <div key={s.title}><p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{s.title}</p>
      <ul className="space-y-1">{s.items.map(({ to, label, Icon }) => { const on = isActive(path, to); return <li key={to}><Link to={to} aria-current={on ? 'page' : undefined} className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${on ? 'bg-primary/15 font-semibold text-primary before:absolute before:inset-y-2 before:-left-4 before:w-1 before:rounded-r-full before:bg-primary' : 'text-foreground/80 hover:bg-muted/70 hover:text-foreground'}`}><Icon className="size-5 shrink-0" strokeWidth={on ? 2.4 : 2} /><span className="truncate">{label}</span></Link></li>; })}</ul></div>)}
  </aside>;
}

export function ClipShell({ children, title, action, wide }: { children: ReactNode; title: string; action?: ReactNode; wide?: boolean }) {
  return <div className="volcano-glow flex h-dvh">
    <ClipSidebar />
    <main className={`relative mx-auto h-dvh w-full overflow-hidden ${wide ? 'md:max-w-none' : 'max-w-md md:max-w-3xl'}`}>
      <header className="glass flex h-24 shrink-0 flex-col justify-center gap-2 border-b px-4 md:h-16 md:px-6"><Link to="/" aria-label="VINASOUND — Accueil" className="md:hidden"><VinasoundBrand /></Link><div className="flex w-full items-center gap-2"><Button asChild variant="ghost" size="icon" className="size-8 rounded-full md:hidden"><Link to="/" aria-label="Retour au fil"><ArrowLeft className="size-4" /></Link></Button><h1 className="flex-1 truncate text-lg font-bold tracking-tight md:text-xl">{title}</h1>{action}</div></header>
      <div className="h-[calc(100dvh-10rem)] overflow-y-auto p-5 md:h-[calc(100dvh-4rem)] md:p-8">{children}</div>
      <ClipNav />
    </main>
  </div>;
}
export function AccountUnavailable() {
  return <div role="status" className="flex min-h-64 flex-col items-center justify-center gap-5 text-center"><User className="size-12 text-secondary" /><p className="text-muted-foreground">Ton compte VINASOUND n’est pas encore relié à cet aperçu.</p><Button asChild variant="outline"><Link to="/decouvrir">Découvrir les vidéos</Link></Button></div>;
}
