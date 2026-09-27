'use client';
import {usePathname} from 'next/navigation';
import Listener from '@/components/afoluku-radio/player';
import '@/components/afoluku-radio/radio.css';
// The root layout keeps the compact player alive during ordinary site navigation.
export default function RadioPlayer(){const pathname=usePathname();if(!pathname||pathname.startsWith('/admin')||/\/radio\/?$/.test(pathname))return null;const lang=pathname.startsWith('/bsh')?'bsh':'fr';return <div className="afoluku-radio-app"><Listener compact href={`/${lang}/radio`}/></div>}
