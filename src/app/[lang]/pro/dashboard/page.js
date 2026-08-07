import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/utils/supabase/auth';
import Link from 'next/link';
import { getDictionary } from '@/i18n/dictionaries';

export const metadata = {
  title: 'Dashboard Pro | Culture Média News',
};

export default async function ProDashboardPage({ params }) {
  const { lang = 'fr' } = await params;
  const dict = await getDictionary(lang);
  
  const profile = await getUserProfile();

  if (!profile) {
    redirect(`/${lang}/auth/login?redirect=pro/dashboard`);
  }

  // Define Pro features status
  const isPremium = profile.role === 'pro' || profile.role === 'admin';

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: '60px', maxWidth: '1000px' }}>
      <header style={{ marginBottom: '40px', borderBottom: '1px solid var(--color-gray-800)', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Espace Professionnel</h1>
        <p style={{ color: 'var(--color-gray-400)', fontSize: '1.1rem' }}>
          Bienvenue {profile.full_name || profile.username || 'Professionnel'}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        
        {/* Subscription Status Card */}
        <div style={{ backgroundColor: 'var(--color-gray-900)', padding: '30px', borderRadius: '12px', border: '1px solid var(--color-gray-800)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-crown" style={{ color: '#eab308' }}></i> Mon Abonnement
          </h2>
          
          {isPremium ? (
            <div>
              <div style={{ display: 'inline-block', padding: '5px 12px', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '20px' }}>
                Actif (Accès Pro)
              </div>
              <p style={{ color: 'var(--color-gray-400)', marginBottom: '20px' }}>
                Vous bénéficiez d'un accès illimité à nos articles Premium, aux statistiques détaillées et à notre système de réservation.
              </p>
              <button className="btn" style={{ backgroundColor: 'var(--color-gray-800)', color: 'white', border: 'none', width: '100%' }}>
                Gérer mon abonnement
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'inline-block', padding: '5px 12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '20px' }}>
                Inactif
              </div>
              <p style={{ color: 'var(--color-gray-400)', marginBottom: '20px' }}>
                Passez au compte Pro pour débloquer l'accès aux articles Premium, au réseau d'affaires et aux réservations d'espaces.
              </p>
              <form action={`/api/stripe/checkout`} method="POST">
                <input type="hidden" name="lang" value={lang} />
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  S'abonner maintenant (19,99€/mois)
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Reservation Card */}
        <div style={{ backgroundColor: 'var(--color-gray-900)', padding: '30px', borderRadius: '12px', border: '1px solid var(--color-gray-800)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="far fa-calendar-check" style={{ color: 'var(--color-primary)' }}></i> Réservations
          </h2>
          
          <p style={{ color: 'var(--color-gray-400)', marginBottom: '20px' }}>
            Réservez un espace publicitaire, une table événementielle ou proposez un partenariat média.
          </p>

          {!isPremium ? (
            <div style={{ padding: '15px', backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '8px', color: '#eab308', fontSize: '0.9rem' }}>
              <i className="fas fa-lock" style={{ marginRight: '8px' }}></i> Réservé aux membres Pro
            </div>
          ) : (
            <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--color-gray-300)' }}>Type de réservation</label>
                <select style={{ width: '100%', padding: '10px', backgroundColor: 'var(--color-gray-800)', border: '1px solid var(--color-gray-700)', borderRadius: '6px', color: 'white' }}>
                  <option>Espace Publicitaire (Web)</option>
                  <option>Table (Événement Culture Média)</option>
                  <option>Publireportage (Article)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--color-gray-300)' }}>Date souhaitée</label>
                <input type="date" style={{ width: '100%', padding: '10px', backgroundColor: 'var(--color-gray-800)', border: '1px solid var(--color-gray-700)', borderRadius: '6px', color: 'white' }} />
              </div>
              <button type="button" className="btn btn-primary" onClick={() => alert("Fonctionnalité en cours de développement.")}>
                Envoyer la demande
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
