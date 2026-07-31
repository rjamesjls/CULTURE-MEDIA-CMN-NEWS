import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const metadata = {
  title: 'Portail des Entreprises PRO - Culture Média News',
  description: 'Découvrez notre annuaire d\'entreprises partenaires.',
};

export default async function ProDirectory() {
  const supabase = await createClient();
  
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('status', 'active')
    .order('tier', { ascending: false }) // premium first
    .order('created_at', { ascending: false });

  return (
    <div style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 20px', fontFamily: 'var(--font-body)' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '900', fontFamily: 'var(--font-heading)', letterSpacing: '-1px' }}>
          L'Annuaire des <span style={{ color: 'var(--color-primary, #D32F2F)' }}>Professionnels</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#64748B', maxWidth: '600px', margin: '20px auto' }}>
          Découvrez les entreprises qui nous font confiance. Rejoignez le réseau Culture Média News dès aujourd'hui.
        </p>
        <Link href="/pro/dashboard">
          <button style={{ 
            background: '#0F172A', color: 'white', padding: '12px 30px', 
            borderRadius: '30px', fontWeight: 'bold', fontSize: '16px', border: 'none', cursor: 'pointer',
            marginTop: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            Inscrire mon entreprise
          </button>
        </Link>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '30px' 
      }}>
        {companies?.map(company => (
          <Link href={`/pro/${company.slug}`} key={company.id} style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: '#FFF',
              border: company.tier === 'premium' ? '2px solid #0F172A' : '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '25px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: company.tier === 'premium' ? '0 10px 30px rgba(15, 23, 42, 0.1)' : '0 4px 6px rgba(0,0,0,0.05)',
              position: 'relative'
            }} className="company-card">
              
              {company.tier === 'premium' && (
                <div style={{ 
                  position: 'absolute', top: '-12px', right: '20px', 
                  background: '#0F172A', color: '#FFF', fontSize: '11px', fontWeight: 'bold', 
                  padding: '4px 12px', borderRadius: '12px', letterSpacing: '1px'
                }}>
                  RECOMMANDÉ
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '12px', background: '#F8FAFC', 
                  border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '24px', color: '#94A3B8' }}>🏢</span>
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#0F172A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {company.name}
                    {company.is_verified && (
                      <span title="Entreprise Vérifiée" style={{ color: '#10B981', fontSize: '16px' }}>✓</span>
                    )}
                  </h3>
                  {company.siret && <span style={{ fontSize: '12px', color: '#94A3B8' }}>SIRET: {company.siret}</span>}
                </div>
              </div>

              <p style={{ 
                fontSize: '14px', color: '#475569', lineHeight: '1.6', flex: 1,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {company.description}
              </p>

              <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--color-primary, #D32F2F)', fontWeight: '600' }}>
                Voir le profil →
              </div>
            </div>
          </Link>
        ))}
        {(!companies || companies.length === 0) && (
           <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748B' }}>Aucune entreprise n'est inscrite pour le moment.</p>
        )}
      </div>
      
      <style>{`
        .company-card:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </div>
  );
}
