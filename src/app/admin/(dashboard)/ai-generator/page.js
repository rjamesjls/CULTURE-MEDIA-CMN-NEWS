import { Suspense } from 'react';
import AIGeneratorClient from './AIGeneratorClient';

export default function AIGeneratorPage() {
  return (
    <div className="admin-content-card">
      <div className="admin-header">
        <h1 className="admin-title">🤖 Générateur d'Articles IA</h1>
      </div>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        Donnez un sujet à l'intelligence artificielle. Elle parcourra ses connaissances et le web pour vous rédiger un brouillon structuré que vous pourrez ensuite ajuster ou publier.
      </p>

      <Suspense fallback={<div>Chargement de l'assistant IA...</div>}>
        <AIGeneratorClient />
      </Suspense>
    </div>
  );
}
