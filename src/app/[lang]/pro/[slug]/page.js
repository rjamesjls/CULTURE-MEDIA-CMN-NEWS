import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const supabase = await createClient();
  const { slug } = await params;
  const { data: company } = await supabase.from('companies').select('*').eq('slug', slug).single();
  
  if (!company) return { title: 'Entreprise introuvable' };
  
  return {
    title: `${company.name} - Annuaire PRO Culture Média News`,
    description: company.description,
  };
}

export default async function CompanyProfile({ params }) {
  const supabase = await createClient();
  const { slug } = await params;
  
  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !company) {
    notFound();
  }

  const social = company.social_links || {};
  const isPremium = company.tier === 'premium';
  
  // Fake rating for premium to demonstrate 2.0 layout
  const rating = isPremium ? 4.8 : null;
  const reviewCount = isPremium ? 24 : null;

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      
      {/* 2.0 Hero Section with Glassmorphism */}
      <div style={{ 
        position: 'relative',
        height: '400px',
        background: isPremium 
          ? 'linear-gradient(135deg, #0F172A, #1E293B, #334155)' 
          : 'linear-gradient(135deg, #CBD5E1, #94A3B8)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '40px',
        overflow: 'hidden'
      }}>
        {/* Decorative background shapes */}
        <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '100%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', transform: 'rotate(30deg)', pointerEvents: 'none' }}></div>
        
        {isPremium && (
          <div style={{ position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,255,255,0.1)', color: '#FFF', padding: '10px 20px', borderRadius: '30px', fontSize: '14px', fontWeight: 'bold', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
            💎 Partenaire Premium
          </div>
        )}

        <div style={{ maxWidth: '1200px', width: '100%', padding: '0 20px', display: 'flex', alignItems: 'flex-end', gap: '40px', position: 'relative', zIndex: 10 }}>
          
          {/* Logo with 3D effect */}
          <div style={{ 
            width: '150px', height: '150px', borderRadius: '30px', background: '#FFFFFF',
            border: '5px solid rgba(255,255,255,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            flexShrink: 0, transform: 'translateY(50px)' // Pushes it down to overlap the content below
          }}>
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '60px' }}>🏢</span>
            )}
          </div>

          <div style={{ flex: 1, color: '#FFF', paddingBottom: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', backdropFilter: 'blur(5px)' }}>
                {company.industry || 'Secteur non défini'}
              </span>
              {company.business_type && (
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', backdropFilter: 'blur(5px)' }}>
                  {company.business_type}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '15px', lineHeight: '1.1' }}>
              {company.name}
              {company.is_verified && (
                <span title="Entreprise Vérifiée" style={{ color: '#10B981', fontSize: '32px', background: '#FFF', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>✓</span>
              )}
            </h1>
            {isPremium && rating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '500' }}>
                <span style={{ color: '#FBBF24', fontSize: '20px' }}>★★★★★</span> 
                <span>{rating} ({reviewCount} avis)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px 60px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
        
        {/* Left Column (Description & Details) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', gridColumn: '1 / -2' }}>
          
          {/* About Section */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              À propos
            </h2>
            <div style={{ color: '#475569', fontSize: '17px', lineHeight: '1.9', whiteSpace: 'pre-wrap' }}>
              {company.description}
            </div>
          </div>

          {/* Key People / Human Contact */}
          {(company.contact_first_name || company.contact_last_name) && (
            <div style={{ background: '#FFF', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
               <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginBottom: '25px' }}>Votre Contact</h2>
               <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, #E2E8F0, #CBD5E1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#64748B', fontWeight: 'bold' }}>
                    {company.contact_first_name ? company.contact_first_name[0] : ''}
                    {company.contact_last_name ? company.contact_last_name[0] : ''}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0F172A' }}>
                      {company.contact_first_name} {company.contact_last_name}
                    </h3>
                    <p style={{ margin: '5px 0 0 0', color: '#64748B', fontSize: '15px', fontWeight: '500' }}>
                      {company.contact_role || 'Représentant'}
                    </p>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar: Action & Info) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', minWidth: '350px' }}>
          
          {/* Main Action / Premium Booking Box */}
          <div style={{ background: isPremium ? '#0F172A' : '#FFF', color: isPremium ? '#FFF' : '#0F172A', borderRadius: '24px', padding: '35px', boxShadow: '0 15px 40px rgba(0,0,0,0.08)', border: isPremium ? 'none' : '1px solid #E2E8F0', textAlign: 'center' }}>
            <h3 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 15px 0' }}>Prendre contact</h3>
            <p style={{ fontSize: '15px', opacity: 0.8, marginBottom: '25px', lineHeight: '1.5' }}>
              Intéressé par les services de {company.name} ? N'hésitez pas à les joindre.
            </p>
            
            {isPremium && (
              <button style={{ width: '100%', padding: '16px', background: 'var(--color-primary, #D32F2F)', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px', transition: 'transform 0.2s', boxShadow: '0 8px 20px rgba(211,47,47,0.3)' }}>
                📅 Réserver en ligne
              </button>
            )}

            <a href={`mailto:${company.contact_email}`} style={{ display: 'block', width: '100%', padding: '16px', background: isPremium ? 'rgba(255,255,255,0.1)' : '#F1F5F9', color: isPremium ? '#FFF' : '#0F172A', textDecoration: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', transition: 'background 0.2s' }}>
              ✉️ Envoyer un message
            </a>
          </div>

          {/* Contact Details Card */}
          <div style={{ background: '#FFF', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '25px', borderBottom: '1px solid #F1F5F9', paddingBottom: '15px' }}>Coordonnées</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {company.contact_phone && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📞</div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>Téléphone</div>
                    <a href={`tel:${company.contact_phone}`} style={{ color: '#0F172A', fontSize: '16px', fontWeight: '500', textDecoration: 'none' }}>{company.contact_phone}</a>
                  </div>
                </div>
              )}
              
              {company.contact_email && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>✉️</div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>Email Pro</div>
                    <a href={`mailto:${company.contact_email}`} style={{ color: '#0F172A', fontSize: '16px', fontWeight: '500', textDecoration: 'none', wordBreak: 'break-all' }}>{company.contact_email}</a>
                  </div>
                </div>
              )}

              {company.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📍</div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>Adresse</div>
                    <div style={{ color: '#0F172A', fontSize: '15px', fontWeight: '500', lineHeight: '1.5' }}>{company.address}</div>
                  </div>
                </div>
              )}

              {company.siret && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🏢</div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', marginBottom: '4px' }}>SIRET</div>
                    <div style={{ color: '#0F172A', fontSize: '15px', fontWeight: '500' }}>{company.siret}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Links & Socials (Premium + Free subset) */}
          {(company.website_url || social.facebook || social.instagram || social.linkedin) && (
            <div style={{ background: '#FFF', borderRadius: '24px', padding: '35px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '25px', borderBottom: '1px solid #F1F5F9', paddingBottom: '15px' }}>Retrouvez-nous sur</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isPremium && company.website_url && (
                  <a href={company.website_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', background: '#F8FAFC', borderRadius: '12px', textDecoration: 'none', color: '#0F172A', fontWeight: '600', transition: 'background 0.2s' }}>
                    <span style={{ fontSize: '20px' }}>🌐</span> Site Web Officiel
                  </a>
                )}
                {social.linkedin && (
                  <a href={social.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', background: '#F8FAFC', borderRadius: '12px', textDecoration: 'none', color: '#0F172A', fontWeight: '600', transition: 'background 0.2s' }}>
                    <span style={{ fontSize: '20px' }}>💼</span> LinkedIn
                  </a>
                )}
                {isPremium && social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', background: '#F8FAFC', borderRadius: '12px', textDecoration: 'none', color: '#0F172A', fontWeight: '600', transition: 'background 0.2s' }}>
                    <span style={{ fontSize: '20px' }}>📸</span> Instagram
                  </a>
                )}
                {isPremium && social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', background: '#F8FAFC', borderRadius: '12px', textDecoration: 'none', color: '#0F172A', fontWeight: '600', transition: 'background 0.2s' }}>
                    <span style={{ fontSize: '20px' }}>👥</span> Facebook
                  </a>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
