import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const supabase = await createClient();
  const { data: company } = await supabase.from('companies').select('*').eq('slug', params.slug).single();
  
  if (!company) return { title: 'Entreprise introuvable' };
  
  return {
    title: `${company.name} - Portail PRO Culture Média News`,
    description: company.description,
  };
}

export default async function CompanyProfile({ params }) {
  const supabase = await createClient();
  
  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !company) {
    notFound();
  }

  const social = company.social_links || {};

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '60px' }}>
      
      {/* Banner */}
      <div style={{ 
        height: '250px', 
        background: company.tier === 'premium' ? 'linear-gradient(135deg, #0F172A, #1E293B)' : '#E2E8F0',
        position: 'relative'
      }}>
        <div style={{ 
          maxWidth: '1000px', margin: '0 auto', padding: '0 20px', height: '100%', 
          display: 'flex', alignItems: 'flex-end', paddingBottom: '30px'
        }}>
          {company.tier === 'premium' && (
            <div style={{ position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,255,255,0.1)', color: '#FFF', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              💎 Partenaire Premium
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '-80px auto 0', padding: '0 20px', position: 'relative' }}>
        <div style={{ 
          background: '#FFF', 
          borderRadius: '16px', 
          padding: '40px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '30px'
        }}>
          
          {/* Header section */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '20px', background: '#F1F5F9',
              border: '4px solid #FFF', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
            }}>
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '40px' }}>🏢</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 10px 0', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {company.name}
                {company.is_verified && (
                  <span title="Entreprise Vérifiée" style={{ color: '#10B981', fontSize: '24px' }}>✓</span>
                )}
              </h1>
              {company.siret && <div style={{ color: '#64748B', fontSize: '14px' }}>SIRET : {company.siret}</div>}
            </div>

            {/* Actions for Premium */}
            {company.tier === 'premium' && company.website_url && (
              <a href={company.website_url} target="_blank" rel="noopener noreferrer" style={{
                background: 'var(--color-primary, #D32F2F)', color: '#FFF', padding: '14px 24px', 
                borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block'
              }}>
                Visiter le site web
              </a>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0' }} />

          {/* Content section */}
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 600px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>À propos de {company.name}</h2>
              <div style={{ color: '#475569', fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                {company.description}
              </div>
            </div>

            {/* Sidebar for Premium Links */}
            {company.tier === 'premium' && (social.facebook || social.instagram || social.linkedin) && (
              <div style={{ flex: '1 1 300px', background: '#F8FAFC', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', alignSelf: 'flex-start' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '15px' }}>Réseaux sociaux</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {social.linkedin && (
                    <a href={social.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#0F172A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', background: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      💼 LinkedIn
                    </a>
                  )}
                  {social.instagram && (
                    <a href={social.instagram} target="_blank" rel="noopener noreferrer" style={{ color: '#0F172A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', background: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      📸 Instagram
                    </a>
                  )}
                  {social.facebook && (
                    <a href={social.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#0F172A', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', background: '#FFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      👥 Facebook
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
