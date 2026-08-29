import { Suspense } from 'react';
import VeilleClient from './VeilleClient';

export const metadata = {
  title: 'Veille & Sources - Admin A FOLUKU TV',
};

export default function VeillePage() {
  return (
    <div className="admin-content-card">
      <div className="admin-header">
        <h1 className="admin-title"><i className="fas fa-satellite-dish" style={{ color: '#8b5cf6', marginRight: '10px' }}></i> Veille & Sources</h1>
      </div>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Suivez vos sources d'information préférées via leurs flux RSS. Générez instantanément des articles IA à partir des actualités qui vous intéressent.
      </p>

      <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}><i className="fas fa-spinner fa-spin fa-2x"></i></div>}>
        <VeilleClient />
      </Suspense>
    </div>
  );
}
