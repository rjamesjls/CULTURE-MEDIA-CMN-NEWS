import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const metadata = {
  title: 'Kiosque Numérique | A FOLUKU TV',
  description: 'Feuilletez nos éditions au format magazine interactif',
};

export const revalidate = 60;

export default async function MagazineKioskPage() {
  const supabase = await createClient();
  const { data: magazines } = await supabase
    .from('magazines')
    .select('id, title, description, cover_image_url, publication_date, type')
    .order('publication_date', { ascending: false });

  return (
    <div className="container" style={{ padding: '60px 20px', minHeight: '80vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', color: '#111827', marginBottom: '15px' }}>
          Le Kiosque
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
          Découvrez nos éditions spéciales en format immersif. Feuilletez A FOLUKU TV comme un vrai magazine.
        </p>
      </header>

      {(!magazines || magazines.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
          <i className="fas fa-book-open" style={{ fontSize: '3rem', color: '#d1d5db', marginBottom: '20px' }}></i>
          <h2>Le Kiosque est vide</h2>
          <p style={{ color: '#6b7280' }}>Nos numéros numériques arrivent bientôt.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '30px' 
        }}>
          {magazines.map((mag) => (
            <div key={mag.id} className="magazine-card" style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ 
                height: '350px', 
                backgroundColor: '#f3f4f6',
                backgroundImage: mag.cover_image_url ? `url(${mag.cover_image_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                }}></div>
              </div>
              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '10px', color: '#111827' }}>{mag.title}</h3>
                <p style={{ color: '#4b5563', fontSize: '0.95rem', marginBottom: '20px', flex: 1 }}>
                  {mag.description || 'Une plongée au cœur de la culture.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                    {new Date(mag.publication_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                  <Link href={`/magazine/${mag.id}`} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                    Feuilleter <i className="fas fa-arrow-right" style={{ marginLeft: '5px' }}></i>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .magazine-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .magazine-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        }
      `}} />
    </div>
  );
}
