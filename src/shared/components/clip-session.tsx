import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
const SessionContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });
export function ClipSession({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    // No account linking required: visitors get an automatic guest session so they can publish and go live.
    supabase.auth.getSession().then(async ({ data }) => { let u = data.session?.user ?? null; if (!u) { const r = await supabase.auth.signInAnonymously(); u = r.data.user ?? null; } setUser(u); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null); setReady(true);
      if (event === 'SIGNED_OUT') { qc.removeQueries({ predicate: q => q.queryKey[0] !== 'feed' }); router.invalidate(); }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') { qc.invalidateQueries(); router.invalidate(); }
    });
    return () => data.subscription.unsubscribe();
  }, [qc, router]);
  return <SessionContext.Provider value={{ user, ready }}>{children}</SessionContext.Provider>;
}
export const useClipSession = () => useContext(SessionContext);