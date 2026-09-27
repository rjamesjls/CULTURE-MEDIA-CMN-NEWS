'use client';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { api } from '@/lib/afoluku-radio/audio';
export default function AudienceCount({ enabled }) {
    const [count, setCount] = useState(null), [failed, setFailed] = useState(false);
    useEffect(() => {
        if (!enabled)
            return;
        let alive = true;
        let timer;
        async function refresh() {
            try {
                const result = await api('/api/afoluku-radio/listeners');
                if (alive) {
                    setCount(result.count);
                    setFailed(false);
                }
            }
            catch {
                if (alive)
                    setFailed(true);
            }
            finally {
                if (alive)
                    timer = setTimeout(refresh, 5000);
            }
        }
        void refresh();
        return () => { alive = false; clearTimeout(timer); };
    }, [enabled]);
    return <section className="audience-badge" aria-label="Audience actuelle"><Users size={17}/><strong aria-live="polite">{failed ? 'Indisponible' : count === null ? '—' : count.toLocaleString('fr-FR')}</strong><span>{count === 1 ? 'auditeur en cours' : 'auditeurs en cours'}</span></section>;
}
