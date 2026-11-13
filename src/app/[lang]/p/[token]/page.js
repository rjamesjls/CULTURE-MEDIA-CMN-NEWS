import Link from 'next/link';
import { getPrivateArticlePreview } from '@/app/actions/private-access';
import PrivateReaderGate from '@/components/PrivateReaderGate';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Article Privé Confidentiel | A FOLUKU TV',
    description: 'Accès privé restreint par code de lecture.',
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  };
}

export default async function PrivateArticlePage({ params }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'fr';
  const token = resolvedParams.token;

  const result = await getPrivateArticlePreview(token);

  if (!result.success) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '480px',
          backgroundColor: '#12121a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '40px 30px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            margin: '0 auto 20px auto',
          }}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px' }}>
            Lien privé invalide ou expiré
          </h1>

          <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.6', marginBottom: '26px' }}>
            {result.error || "Ce lien d'accès privé n'existe pas ou a été désactivé."}
          </p>

          <Link
            href={`/${lang}`}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#d97706',
              color: '#fff',
              borderRadius: '10px',
              fontWeight: '700',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            <i className="fas fa-home" style={{ marginRight: '8px' }}></i>
            Retour au site public
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PrivateReaderGate
      token={token}
      lang={lang}
      initialUnlocked={result.isUnlocked}
      initialArticle={result.article}
    />
  );
}
