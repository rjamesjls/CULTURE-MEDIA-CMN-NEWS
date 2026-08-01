'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Simple SVG Icons
const Icons = {
  Overview: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Profile: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Premium: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Stats: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

export default function ProDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [company, setCompany] = useState({
    name: '', description: '', siret: '', contact_email: '', contact_phone: '',
    address: '', industry: '', business_type: '', contact_first_name: '',
    contact_last_name: '', contact_role: '', website_url: '', facebook: '',
    instagram: '', linkedin: ''
  });
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login?redirect=/pro/dashboard');
        return;
      }
      setUser(session.user);
      const { data } = await supabase.from('companies').select('*').eq('user_id', session.user.id).single();

      if (data) {
        const social = data.social_links || {};
        setCompany({
          ...data,
          contact_email: data.contact_email || '', contact_phone: data.contact_phone || '',
          address: data.address || '', industry: data.industry || '', business_type: data.business_type || '',
          contact_first_name: data.contact_first_name || '', contact_last_name: data.contact_last_name || '',
          contact_role: data.contact_role || '', facebook: social.facebook || '',
          instagram: social.instagram || '', linkedin: social.linkedin || ''
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [supabase, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompany(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const slug = company.slug || company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const payload = {
      user_id: user.id, name: company.name, slug, siret: company.siret, contact_email: company.contact_email,
      contact_phone: company.contact_phone, address: company.address, industry: company.industry,
      business_type: company.business_type, contact_first_name: company.contact_first_name,
      contact_last_name: company.contact_last_name, contact_role: company.contact_role,
      description: company.description, website_url: company.website_url,
      social_links: { facebook: company.facebook, instagram: company.instagram, linkedin: company.linkedin }
    };

    let result = company.id 
      ? await supabase.from('companies').update(payload).eq('id', company.id)
      : await supabase.from('companies').insert(payload);

    if (result.error) alert('Erreur lors de la sauvegarde: ' + result.error.message);
    else {
      alert('Profil mis à jour avec succès !');
      if (!company.id) window.location.reload();
    }
    setSaving(false);
  };

  const handleUpgrade = async () => {
    if (!company.id) return alert("Veuillez d'abord enregistrer votre profil.");
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Erreur lors de la redirection Stripe.');
    } catch (err) {
      alert('Une erreur est survenue.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div><style>{`.spinner{width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0F172A; border-radius: 50%; animation: spin 1s linear infinite;} @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style></div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'var(--font-body)' }}>
      
      {/* Sidebar */}
      <div style={{ width: '280px', backgroundColor: '#FFFFFF', borderRight: '1px solid #E2E8F0', padding: '30px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', marginBottom: '40px', paddingLeft: '10px' }}>Espace PRO</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: <Icons.Overview/> },
            { id: 'profile', label: 'Profil Entreprise', icon: <Icons.Profile/> },
            { id: 'stats', label: 'Statistiques', icon: <Icons.Stats/> },
            { id: 'premium', label: 'Abonnement Premium', icon: <Icons.Premium/> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: '15px', width: '100%', padding: '15px', 
              borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px',
              backgroundColor: activeTab === tab.id ? '#0F172A' : 'transparent',
              color: activeTab === tab.id ? '#FFFFFF' : '#64748B',
              transition: 'all 0.2s'
            }}>
              {tab.icon}
              {tab.label}
              {tab.id === 'premium' && company.tier !== 'premium' && (
                <span style={{ marginLeft: 'auto', backgroundColor: '#FEF3C7', color: '#D97706', fontSize: '11px', padding: '3px 8px', borderRadius: '20px' }}>PRO</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ padding: '20px', backgroundColor: '#F1F5F9', borderRadius: '12px', marginBottom: '15px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B', fontWeight: '600' }}>Connecté en tant que</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#0F172A', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '12px', backgroundColor: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px 60px', overflowY: 'auto' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="fade-in">
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' }}>Bonjour, {company.name || 'Professionnel'} 👋</h1>
            <p style={{ color: '#64748B', fontSize: '16px', marginBottom: '40px' }}>Bienvenue sur votre tableau de bord Culture Média News.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '40px' }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icons.Profile/> État de votre profil
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '60px', height: '60px', backgroundColor: '#E2E8F0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🏢</div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '20px' }}>
                      {company.name || 'Nom non défini'}
                      {company.tier === 'premium' && <span style={{ marginLeft: '5px', color: '#10B981', fontSize: '16px' }} title="Entreprise Vérifiée">✓</span>}
                    </h4>
                    <p style={{ margin: '5px 0 0 0', color: '#64748B', fontSize: '14px' }}>{company.industry || 'Secteur non défini'}</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab('profile')} style={{ marginTop: '25px', width: '100%', padding: '12px', backgroundColor: '#F1F5F9', color: '#0F172A', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#E2E8F0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}>Compléter mon profil</button>
              </div>

              <div style={{ background: company.tier === 'premium' ? 'linear-gradient(135deg, #1E293B, #0F172A)' : '#FFFFFF', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9', color: company.tier === 'premium' ? '#FFF' : '#0F172A' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: company.tier === 'premium' ? '#FFF' : '#0F172A' }}>
                  <Icons.Premium/> Votre Abonnement
                </h3>
                <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '10px' }}>
                  {company.tier === 'premium' ? 'Premium 👑' : 'Gratuit'}
                </div>
                <p style={{ margin: 0, opacity: 0.8, fontSize: '14px', marginBottom: '25px' }}>
                  {company.tier === 'premium' ? 'Vous bénéficiez de toutes les fonctionnalités avancées (Stats, Réservations, Priorité).' : 'Passez à la vitesse supérieure pour débloquer les statistiques, les réservations et bien plus.'}
                </p>
                {company.tier !== 'premium' && (
                  <button onClick={() => setActiveTab('premium')} style={{ width: '100%', padding: '12px', backgroundColor: '#D32F2F', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseOver={e => e.currentTarget.style.opacity = '0.9'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>Découvrir Premium</button>
                )}
              </div>
            </div>
            
            <div style={{ backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#0F172A' }}>Aperçu des performances</h3>
              {company.tier === 'premium' ? (
                <div style={{ display: 'flex', gap: '30px' }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#64748B', fontSize: '14px' }}>Vues ce mois-ci</p>
                    <h4 style={{ margin: 0, fontSize: '28px', color: '#0F172A', fontWeight: '900' }}>1,240 <span style={{ fontSize: '14px', color: '#10B981', fontWeight: 'bold' }}>+24%</span></h4>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#64748B', fontSize: '14px' }}>Clics vers site web</p>
                    <h4 style={{ margin: 0, fontSize: '28px', color: '#0F172A', fontWeight: '900' }}>85 <span style={{ fontSize: '14px', color: '#10B981', fontWeight: 'bold' }}>+10%</span></h4>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#64748B', fontSize: '15px', margin: 0 }}>
                  Abonnez-vous au Premium pour suivre en temps réel la visibilité de votre entreprise sur l'annuaire. <span onClick={() => setActiveTab('premium')} style={{ color: '#D32F2F', cursor: 'pointer', fontWeight: '600' }}>En savoir plus →</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="fade-in">
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', marginBottom: '30px' }}>Mon Profil d'Entreprise</h1>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '25px', borderBottom: '1px solid #F1F5F9', paddingBottom: '15px' }}>Informations générales</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155' }}>Nom de l'entreprise *</label>
                    <input type="text" name="name" value={company.name} onChange={handleChange} required style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155' }}>Secteur d'activité</label>
                    <input type="text" name="industry" value={company.industry} onChange={handleChange} style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155' }}>Type d'activité</label>
                    <select name="business_type" value={company.business_type} onChange={handleChange} style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px', backgroundColor: '#FFF' }}>
                      <option value="">Sélectionnez</option><option value="Produits">Produits</option><option value="Services">Services</option><option value="Les deux">Les deux</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155' }}>Numéro de SIRET</label>
                    <input type="text" name="siret" value={company.siret} onChange={handleChange} style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155' }}>Adresse complète</label>
                    <input type="text" name="address" value={company.address} onChange={handleChange} style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }} />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155' }}>Description *</label>
                    <textarea name="description" value={company.description} onChange={handleChange} required rows={5} style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px', resize: 'vertical' }} />
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '25px', borderBottom: '1px solid #F1F5F9', paddingBottom: '15px' }}>Contact & Coordonnées</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155' }}>Email de l'entreprise *</label>
                    <input type="email" name="contact_email" value={company.contact_email} onChange={handleChange} required style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155' }}>Numéro de téléphone *</label>
                    <input type="tel" name="contact_phone" value={company.contact_phone} onChange={handleChange} required style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }} />
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', opacity: company.tier === 'free' ? 0.8 : 1 }}>
                <h2 style={{ fontSize: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Liens & Réseaux Sociaux 
                </h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '25px' }}>
                  En version gratuite, vous pouvez ajouter <strong>un seul</strong> réseau social. Passez au Premium pour lier votre Site Web officiel et plusieurs réseaux !
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
                      Site Web Officiel {company.tier === 'free' && <span style={{ color: '#D32F2F', fontSize: '12px' }}>⭐ Premium</span>}
                    </label>
                    <input type="url" name="website_url" value={company.website_url} onChange={handleChange} disabled={company.tier === 'free'} placeholder="https://" style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px', backgroundColor: company.tier === 'free' ? '#F1F5F9' : '#FFF' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155' }}>LinkedIn</label>
                    <input type="url" name="linkedin" value={company.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
                      Instagram {company.tier === 'free' && <span style={{ color: '#D32F2F', fontSize: '12px' }}>⭐ Premium</span>}
                    </label>
                    <input type="url" name="instagram" value={company.instagram} onChange={handleChange} disabled={company.tier === 'free'} placeholder="https://instagram.com/..." style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '15px', backgroundColor: company.tier === 'free' ? '#F1F5F9' : '#FFF' }} />
                  </div>
                </div>
              </div>

              <div style={{ position: 'sticky', bottom: '20px', zIndex: 10 }}>
                <button type="submit" disabled={saving} style={{ width: '100%', background: '#0F172A', color: 'white', border: 'none', padding: '18px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 10px 25px rgba(15,23,42,0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {saving ? 'Enregistrement en cours...' : 'Sauvegarder mon profil'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PREMIUM TAB */}
        {activeTab === 'premium' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', color: '#D97706' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', marginBottom: '20px' }}>Débloquez votre plein potentiel</h1>
            <p style={{ color: '#64748B', fontSize: '18px', lineHeight: '1.6', marginBottom: '50px' }}>Passez à l'abonnement Premium pour dominer l'annuaire, obtenir des statistiques détaillées et recevoir directement des réservations de clients.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', textAlign: 'left', width: '100%', marginBottom: '50px' }}>
              {[
                "Statistiques avancées (Vues /j, /sem, /mois, /an)",
                "Système d'avis et de notations par les lecteurs",
                "Ajout de sites web multiples",
                "Intégration de tous vos réseaux sociaux",
                "Système de réservation intégré",
                "Apparition en première position dans l'annuaire",
                "Badge 'Entreprise Vérifiée' exclusif"
              ].map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ flexShrink: 0, marginTop: '2px' }}><Icons.Check /></div>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>{feat}</span>
                </div>
              ))}
            </div>

            {company.tier === 'premium' ? (
              <div style={{ padding: '20px 40px', backgroundColor: '#10B981', color: 'white', borderRadius: '30px', fontWeight: 'bold', fontSize: '18px' }}>
                Vous êtes déjà Premium ! 🎉
              </div>
            ) : (
              <button onClick={handleUpgrade} style={{ padding: '20px 60px', backgroundColor: '#D32F2F', color: 'white', border: 'none', borderRadius: '30px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(211,47,47,0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                Devenir Premium Maintenant
              </button>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="fade-in">
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', marginBottom: '10px' }}>Statistiques & Visibilité</h1>
            <p style={{ color: '#64748B', fontSize: '16px', marginBottom: '40px' }}>Analysez les performances de votre profil sur notre plateforme.</p>

            {company.tier === 'free' ? (
              <div style={{ backgroundColor: '#FFFFFF', padding: '60px 40px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5, pointerEvents: 'none' }}></div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '15px', position: 'relative', zIndex: 1, color: '#0F172A' }}>Verrouillé : Exclusivité Premium</h2>
                <p style={{ color: '#64748B', fontSize: '16px', marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px auto', position: 'relative', zIndex: 1, lineHeight: '1.6' }}>Découvrez combien de personnes consultent votre profil par jour, par semaine et par mois. Suivez les clics vers votre site web pour mesurer votre retour sur investissement.</p>
                <button onClick={() => setActiveTab('premium')} style={{ padding: '15px 40px', backgroundColor: '#0F172A', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', position: 'relative', zIndex: 1 }}>
                  Débloquer les statistiques
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {/* Mock Stats Data for Premium */}
                {[
                  { label: "Vues aujourd'hui", value: "42", trend: "+12%" },
                  { label: "Vues cette semaine", value: "318", trend: "+5%" },
                  { label: "Vues ce mois-ci", value: "1,240", trend: "+24%" },
                  { label: "Clics vers site web", value: "85", trend: "+10%" },
                  { label: "Nouveaux Avis", value: "4", trend: "4.8/5" },
                  { label: "Réservations", value: "12", trend: "+2" },
                ].map((stat, i) => (
                  <div key={i} style={{ backgroundColor: '#FFFFFF', padding: '25px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                    <p style={{ margin: '0 0 10px 0', color: '#64748B', fontWeight: '600', fontSize: '14px' }}>{stat.label}</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '900', color: '#0F172A' }}>{stat.value}</h2>
                      <span style={{ color: '#10B981', fontWeight: 'bold', fontSize: '14px', backgroundColor: '#D1FAE5', padding: '4px 8px', borderRadius: '20px' }}>{stat.trend}</span>
                    </div>
                  </div>
                ))}
                
                <div style={{ gridColumn: '1 / -1', backgroundColor: '#FFFFFF', height: '300px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', marginTop: '20px', fontSize: '14px', fontStyle: 'italic' }}>
                  [ Graphique interactif de l'évolution des visites ]
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
