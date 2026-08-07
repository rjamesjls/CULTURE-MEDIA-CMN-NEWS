'use client';

import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LanguageSwitcher({ currentLang }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLanguage = (newLang) => {
    if (newLang === currentLang) return;
    
    // Replace the first part of the pathname (e.g., /fr/...) with the new lang
    const segments = pathname.split('/');
    if (segments.length > 1 && (segments[1] === 'fr' || segments[1] === 'bsh')) {
      segments[1] = newLang;
      router.push(segments.join('/'));
    } else {
      router.push(`/${newLang}${pathname}`);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '10px', background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '20px' }}>
      <button 
        onClick={() => switchLanguage('fr')}
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          opacity: currentLang === 'fr' ? 1 : 0.4,
          transition: 'opacity 0.2s',
          display: 'flex', alignItems: 'center', gap: '4px',
          color: '#fff', fontWeight: 'bold', fontSize: '14px'
        }}
        title="Français"
      >
        <img src="https://flagcdn.com/w40/fr.png" alt="FR" width="20" style={{ borderRadius: '2px' }} />
        FR
      </button>

      <div style={{ color: 'rgba(255,255,255,0.3)' }}>|</div>

      <button 
        onClick={() => switchLanguage('bsh')}
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          opacity: currentLang === 'bsh' ? 1 : 0.4,
          transition: 'opacity 0.2s',
          display: 'flex', alignItems: 'center', gap: '4px',
          color: '#fff', fontWeight: 'bold', fontSize: '14px'
        }}
        title="Bushinengué"
      >
        <img src="https://flagcdn.com/w40/sr.png" alt="BSH" width="20" style={{ borderRadius: '2px' }} />
        BSH
      </button>
    </div>
  );
}
