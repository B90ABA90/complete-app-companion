import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VinasoundBrand } from '@/shared/components/vinasound-brand';

export function VinasoundVideoIntro() {
  const ref = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        timer = setTimeout(() => setDone(true), 1400);
        observer.disconnect();
      }
    }, { threshold: 0.7 });
    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, []);
  if (done) return null;
  return <div ref={ref} className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 bg-brand-surface text-brand-ink" aria-label="Ouverture VINASOUND"><VinasoundBrand large /><Button variant="default" size="icon" aria-label="Passer à la vidéo" className="size-14 rounded-full" onClick={() => setDone(true)}><Play className="size-6 fill-current" /></Button></div>;
}