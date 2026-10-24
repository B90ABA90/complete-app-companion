import { toast } from 'sonner';
import { Link2, Share2 } from 'lucide-react';
import type { IconType } from 'react-icons';
import { FaWhatsapp, FaFacebookF, FaFacebookMessenger, FaTelegram, FaXTwitter, FaLinkedinIn, FaRedditAlien, FaPinterestP } from 'react-icons/fa6';
import { MdSms, MdEmail } from 'react-icons/md';

// Official brand colours are kept as data: each network's identity, not app theming.
type Target = { name: string; color: string; Icon: IconType; href: (u: string, t: string) => string };
const e = encodeURIComponent;
const TARGETS: Target[] = [
  { name: 'WhatsApp', color: '#25D366', Icon: FaWhatsapp, href: (u, t) => `https://wa.me/?text=${e(`${t} ${u}`)}` },
  { name: 'Facebook', color: '#1877F2', Icon: FaFacebookF, href: u => `https://www.facebook.com/sharer/sharer.php?u=${e(u)}` },
  { name: 'Messenger', color: '#0084FF', Icon: FaFacebookMessenger, href: u => `fb-messenger://share/?link=${e(u)}` },
  { name: 'Telegram', color: '#26A5E4', Icon: FaTelegram, href: (u, t) => `https://t.me/share/url?url=${e(u)}&text=${e(t)}` },
  { name: 'X', color: '#000000', Icon: FaXTwitter, href: (u, t) => `https://twitter.com/intent/tweet?url=${e(u)}&text=${e(t)}` },
  { name: 'LinkedIn', color: '#0A66C2', Icon: FaLinkedinIn, href: u => `https://www.linkedin.com/sharing/share-offsite/?url=${e(u)}` },
  { name: 'Reddit', color: '#FF4500', Icon: FaRedditAlien, href: (u, t) => `https://www.reddit.com/submit?url=${e(u)}&title=${e(t)}` },
  { name: 'Pinterest', color: '#E60023', Icon: FaPinterestP, href: (u, t) => `https://pinterest.com/pin/create/button/?url=${e(u)}&description=${e(t)}` },
  { name: 'SMS', color: '#34C759', Icon: MdSms, href: (u, t) => `sms:?&body=${e(`${t} ${u}`)}` },
  { name: 'E-mail', color: '#6B7280', Icon: MdEmail, href: (u, t) => `mailto:?subject=${e(t)}&body=${e(u)}` },
];

export async function copyLink(u: string) {
  try { await navigator.clipboard.writeText(u); return true; } catch { /* blocked in embedded previews */ }
  const t = document.createElement('textarea'); t.value = u; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
  const ok = document.execCommand('copy'); t.remove();
  if (!ok) window.prompt('Copie le lien :', u);
  return ok;
}

export function ShareTargets({ title, text, url: given, onNative }: { title: string; text?: string; url?: string; onNative?: () => void }) {
  const url = given ?? (typeof window === 'undefined' ? '' : window.location.href);
  const msg = text ?? `Rejoins mon live « ${title} » sur VINASOUND`;
  const item = 'flex flex-col items-center gap-1.5 text-xs transition active:scale-95';
  return <div className="grid grid-cols-4 gap-x-3 gap-y-4">
    {TARGETS.map(({ name, color, Icon, href }) => <button key={name} type="button" className={item} onClick={() => window.open(href(url, msg), '_blank', 'noopener,noreferrer')}>
      <span className="grid size-12 place-items-center rounded-full text-[22px] text-white shadow-sm ring-1 ring-border" style={{ background: color }}><Icon aria-hidden /></span>{name}</button>)}
    <button type="button" className={item} onClick={async () => { if (await copyLink(url)) toast.success('Lien copié'); }}><span className="grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground"><Link2 /></span>Copier</button>
    {onNative && typeof navigator !== 'undefined' && 'share' in navigator && <button type="button" className={item} onClick={onNative}><span className="grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground"><Share2 /></span>Plus…</button>}
  </div>;
}
