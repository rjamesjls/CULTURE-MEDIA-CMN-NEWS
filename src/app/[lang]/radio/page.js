import Listener from '@/components/afoluku-radio/player';
import Link from 'next/link';
import '@/components/afoluku-radio/radio.css';
export const metadata={title:'AFOLUKU RADIO — Le direct',description:'Écoutez AFOLUKU RADIO et retrouvez la musique et les émissions en direct d’AFOLUKU TV.'};
export default async function RadioPage({ params }) {
  const { lang } = await params;
  return (
    <div className="afoluku-radio-app">
      <Link 
        href={`/${lang}`} 
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 9999,
          background: 'rgba(17, 19, 16, 0.8)',
          backdropFilter: 'blur(10px)',
          color: '#f2f3e9',
          padding: '10px 16px',
          borderRadius: '50px',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        title="Retourner à l'accueil"
      >
        <i className="fas fa-arrow-left"></i> Retour au site
      </Link>
      <Listener autoPlay={true} />
    </div>
  );
}
