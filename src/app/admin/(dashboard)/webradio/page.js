import {redirect} from 'next/navigation';
import Link from 'next/link';
import {admin,ApiError} from '@/lib/afoluku-radio/server';
import Studio from '@/components/afoluku-radio/studio';
import '@/components/afoluku-radio/radio.css';
export const metadata={title:'Régie AFOLUKU RADIO | AFOLUKU TV',robots:{index:false,follow:false}};
export default async function WebradioPage(){
 try{await admin()}catch(error){if(error instanceof ApiError&&error.status===401)redirect('/admin/login?next=%2Fadmin%2Fwebradio');if(error instanceof ApiError&&error.status===403)return <p role="alert">La régie est réservée aux administrateurs actifs.</p>;throw error;}
 return (
  <div className="afoluku-radio-app">
    <Link 
      href="/admin" 
      style={{
        position: 'fixed',
        top: '15px',
        right: '15px',
        zIndex: 9999,
        background: '#111310',
        color: '#f6cf28',
        padding: '10px 16px',
        borderRadius: '8px',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: '600',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        border: '1px solid #3c492e'
      }}
      title="Retour au tableau de bord"
    >
      <i className="fas fa-sign-out-alt"></i> Quitter la régie
    </Link>
    <Studio/>
  </div>
 );
}
