import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Stethoscope, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { diagnoseLiveAudio, type AudioDiagnosis } from '@/lives/lib/live-ai.functions';

const PROBLEMS = [['inaudible', 'On ne m’entend pas'], ['echo', 'Écho / larsen'], ['bruit', 'Bruit, vent, souffle'], ['coupures', 'Son qui coupe'], ['autre', 'Autre']] as const;
type Problem = typeof PROBLEMS[number][0];

export function AudioDoctor() {
  const run = useServerFn(diagnoseLiveAudio);
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [res, setRes] = useState<AudioDiagnosis | null>(null);
  const [f, setF] = useState({ problem: 'inaudible' as Problem, device: '', mic: '', output: '', environment: '', details: '' });
  const field = (k: 'device' | 'mic' | 'output' | 'environment', label: string, ph: string) => <label className="block text-xs"><span className="text-muted-foreground">{label}</span><input maxLength={80} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} placeholder={ph} className="mt-1 w-full rounded-lg border bg-background p-2 text-base sm:text-sm" /></label>;
  if (!open) return <Button variant="outline" className="rounded-full" onClick={() => setOpen(true)}><Stethoscope />Diagnostic audio IA</Button>;
  return <div className="space-y-3 rounded-xl border bg-background/60 p-3">
    <p className="flex items-center gap-2 font-semibold"><Stethoscope className="size-4 text-primary" />Diagnostic audio</p>
    <div className="flex flex-wrap gap-1.5">{PROBLEMS.map(([k, l]) => <button key={k} type="button" aria-pressed={f.problem === k} onClick={() => setF({ ...f, problem: k })} className={`rounded-full border px-3 py-1 text-xs ${f.problem === k ? 'border-primary bg-primary text-primary-foreground' : ''}`}>{l}</button>)}</div>
    <div className="grid gap-2 sm:grid-cols-2">
      {field('device', 'Appareil et navigateur', 'iPhone 13, Safari')}{field('mic', 'Micro', 'Micro intégré, AirPods, micro USB…')}
      {field('output', 'Tu écoutes avec', 'Haut-parleur, casque…')}{field('environment', 'Lieu', 'Dehors avec vent, studio…')}
    </div>
    <label className="block text-xs"><span className="text-muted-foreground">Décris ce qui se passe</span><textarea maxLength={1000} rows={3} value={f.details} onChange={e => setF({ ...f, details: e.target.value })} placeholder="Les spectateurs disent qu’ils n’entendent rien depuis 5 minutes…" className="mt-1 w-full rounded-lg border bg-background p-2 text-base sm:text-sm" /></label>
    <div className="flex gap-2"><Button className="rounded-full" disabled={busy} onClick={async () => { setBusy(true); setErr(''); try { setRes(await run({ data: f })); } catch (e) { setErr(e instanceof Error ? e.message : 'Diagnostic indisponible.'); } finally { setBusy(false); } }}>{busy ? <Loader2 className="animate-spin" /> : <Stethoscope />}{busy ? 'Analyse…' : 'Diagnostiquer'}</Button><Button variant="ghost" onClick={() => { setOpen(false); setRes(null); }}>Fermer</Button></div>
    {err && <p className="text-xs text-destructive">{err}</p>}
    {res && <div className="space-y-3 text-sm">
      <p className="rounded-lg bg-primary/10 p-2 font-medium">{res.verdict}</p>
      <div><p className="mb-1 font-semibold">Causes probables</p><ul className="space-y-1">{res.causes.map((c, i) => <li key={i} className="rounded-lg border p-2"><span className={`mr-2 rounded px-1.5 text-[10px] font-bold ${c.likelihood === 'élevée' ? 'bg-destructive text-destructive-foreground' : 'bg-muted'}`}>{c.likelihood}</span><b>{c.cause}</b><p className="text-xs text-muted-foreground">{c.why}</p></li>)}</ul></div>
      <div><p className="mb-1 font-semibold">À faire, dans l’ordre</p><ol className="space-y-1">{res.steps.map((s, i) => <li key={i} className="flex gap-2"><span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/15 text-xs font-bold text-primary">{i + 1}</span><span><b>{s.title}</b><br /><span className="text-xs text-muted-foreground">{s.detail}</span></span></li>)}</ol></div>
      <p className="rounded-lg border border-dashed p-2 text-xs"><b>Test rapide :</b> {res.quickCheck}</p>
    </div>}
  </div>;
}
