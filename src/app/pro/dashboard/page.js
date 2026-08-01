'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ProDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState({
    name: '',
    description: '',
    siret: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    industry: '',
    business_type: '',
    contact_first_name: '',
    contact_last_name: '',
    contact_role: '',
    website_url: '',
    facebook: '',
    instagram: '',
    linkedin: ''
  });
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login?redirect=/pro/dashboard');
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        const social = data.social_links || {};
        setCompany({
          ...data,
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          address: data.address || '',
          industry: data.industry || '',
          business_type: data.business_type || '',
          contact_first_name: data.contact_first_name || '',
          contact_last_name: data.contact_last_name || '',
          contact_role: data.contact_role || '',
          facebook: social.facebook || '',
          instagram: social.instagram || '',
          linkedin: social.linkedin || ''
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
      user_id: user.id,
      name: company.name,
      slug: slug,
      siret: company.siret,
      contact_email: company.contact_email,
      contact_phone: company.contact_phone,
      address: company.address,
      industry: company.industry,
      business_type: company.business_type,
      contact_first_name: company.contact_first_name,
      contact_last_name: company.contact_last_name,
      contact_role: company.contact_role,
      description: company.description,
      website_url: company.website_url,
      social_links: {
        facebook: company.facebook,
        instagram: company.instagram,
        linkedin: company.linkedin
      }
    };

    // Upsert company
    let result;
    if (company.id) {
      result = await supabase.from('companies').update(payload).eq('id', company.id);
    } else {
      result = await supabase.from('companies').insert(payload);
    }

    if (result.error) {
      alert('Erreur lors de la sauvegarde: ' + result.error.message);
    } else {
      alert('Profil mis à jour !');
      if (!company.id) {
         window.location.reload(); // To fetch the new ID
      }
    }
    
    setSaving(false);
  };

  const handleUpgrade = async () => {
    if (!company.id) {
      alert('Veuillez d\'abord enregistrer votre profil avant de passer Premium.');
      return;
    }
    
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Erreur lors de la redirection vers Stripe.');
      }
    } catch (err) {
      alert('Une erreur est survenue.');
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '10px', fontWeight: '800' }}>Mon Espace Pro</h1>
      
      {company.id && (
        <div style={{ 
          background: company.tier === 'premium' ? 'linear-gradient(135deg, #0F172A, #1E293B)' : '#F1F5F9', 
          color: company.tier === 'premium' ? '#FFF' : '#333',
          padding: '20px', 
          borderRadius: '12px', 
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: company.tier === 'premium' ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Statut: {company.tier === 'premium' ? '👑 Premium' : 'Gratuit'}</h3>
            {company.is_verified && <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#10B981' }}>✓ Profil Vérifié</p>}
          </div>
          {company.tier === 'free' && (
            <button onClick={handleUpgrade} style={{ 
              background: 'var(--color-primary, #D32F2F)', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              Passer Premium
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ padding: '20px', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Informations générales</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nom de l'entreprise *</label>
              <input type="text" name="name" value={company.name} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Prénom du contact</label>
                <input type="text" name="contact_first_name" value={company.contact_first_name} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Nom du contact</label>
                <input type="text" name="contact_last_name" value={company.contact_last_name} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Fonction du contact</label>
              <input type="text" name="contact_role" value={company.contact_role} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email de l'entreprise *</label>
                <input type="email" name="contact_email" value={company.contact_email} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Numéro de téléphone *</label>
                <input type="tel" name="contact_phone" value={company.contact_phone} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Secteur d'activité</label>
                <input type="text" name="industry" value={company.industry} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Type d'activité</label>
                <select name="business_type" value={company.business_type} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#fff' }}>
                  <option value="">Sélectionnez</option>
                  <option value="Produits">Produits</option>
                  <option value="Services">Services</option>
                  <option value="Les deux">Les deux</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Adresse complète</label>
              <input type="text" name="address" value={company.address} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
            </div>
            


            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Numéro de SIRET</label>
              <input type="text" name="siret" value={company.siret} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description *</label>
              <textarea name="description" value={company.description} onChange={handleChange} required rows={4} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '20px', border: '1px solid #E2E8F0', borderRadius: '12px', opacity: company.tier === 'free' ? 0.6 : 1 }}>
          <h2 style={{ fontSize: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Liens & Réseaux Sociaux 
            {company.tier === 'free' && <span style={{ fontSize: '12px', background: '#E2E8F0', padding: '3px 8px', borderRadius: '4px' }}>Premium</span>}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>Ces champs sont affichés uniquement pour les membres Premium.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Site web</label>
              <input type="url" name="website_url" value={company.website_url} onChange={handleChange} disabled={company.tier === 'free'} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>LinkedIn</label>
                <input type="url" name="linkedin" value={company.linkedin} onChange={handleChange} disabled={company.tier === 'free'} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Instagram</label>
                <input type="url" name="instagram" value={company.instagram} onChange={handleChange} disabled={company.tier === 'free'} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ 
          background: '#0F172A', 
          color: 'white', 
          border: 'none', 
          padding: '14px', 
          borderRadius: '8px', 
          fontWeight: 'bold',
          fontSize: '16px',
          cursor: saving ? 'not-allowed' : 'pointer'
        }}>
          {saving ? 'Enregistrement...' : 'Enregistrer mon profil'}
        </button>

      </form>
    </div>
  );
}
