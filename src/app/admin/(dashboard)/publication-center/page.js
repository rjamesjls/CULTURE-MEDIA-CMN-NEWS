import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const metadata = {
  title: 'Publication Center | CMN OS',
};

export const revalidate = 0;

export default async function PublicationCenterPage() {
  const supabase = await createClient();

  // On récupère les articles (publiés ou en attente)
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .in('status', ['published', 'pending'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Erreur: {error.message}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#111827', margin: '0 0 10px 0' }}>
          <i className="fas fa-satellite-dish" style={{ color: '#0ea5e9', marginRight: '10px' }}></i>
          Publication Center
        </h2>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>
          Gérez la diffusion multi-plateformes de vos articles (Web, Réseaux Sociaux, Newsletter).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {articles?.map((article) => (
          <div key={article.id} style={{ 
            backgroundColor: '#fff', 
            borderRadius: '12px', 
            border: '1px solid #e5e7eb',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {article.image_url ? (
              <img src={article.image_url} alt={article.title} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
            ) : (
              <div style={{ width: '120px', height: '80px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                <i className="fas fa-image"></i>
              </div>
            )}
            
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#111827' }}>
                {article.title}
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  backgroundColor: article.status === 'published' ? '#d1fae5' : '#fef3c7', 
                  color: article.status === 'published' ? '#065f46' : '#92400e',
                  fontWeight: '500' 
                }}>
                  {article.status === 'published' ? 'En ligne' : 'En attente'}
                </span>
                <span style={{ color: '#6b7280' }}>
                  {article.created_at ? new Date(article.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link 
                href={`/admin/articles/edit/${article.id}`}
                className="admin-btn"
                style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '8px 12px' }}
                title="Gérer sur le site web"
              >
                <i className="fas fa-globe"></i> Web
              </Link>
              
              <Link 
                href={`/admin/articles/${article.id}/spinoffs`}
                className="admin-btn"
                style={{ backgroundColor: '#fdf4ff', color: '#8b5cf6', border: '1px solid #ddd6fe', padding: '8px 12px' }}
                title="Déclinaisons Automatiques"
              >
                <i className="fas fa-magic"></i> Déclinaisons
              </Link>
              
              <Link 
                href={`/admin/articles/${article.id}/social`}
                className="admin-btn"
                style={{ backgroundColor: '#fdf4ff', color: '#c026d3', border: '1px solid #f0abfc', padding: '8px 12px' }}
                title="Générateur Réseaux Sociaux Unifié"
              >
                <i className="fas fa-share-alt"></i> Social Studio
              </Link>

              <Link 
                href={`/admin/articles/${article.id}/story`}
                className="admin-btn"
                style={{ backgroundColor: '#fdf4ff', color: '#c026d3', border: '1px solid #f0abfc', padding: '8px 12px' }}
                title="Créer une Story"
              >
                <i className="fas fa-mobile-alt"></i> Story
              </Link>

              <Link 
                href={`/admin/publication-center/${article.id}/newsletter`}
                className="admin-btn"
                style={{ backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '8px 12px' }}
                title="Créer une Newsletter"
              >
                <i className="fas fa-envelope"></i> Newsletter
              </Link>

              <Link 
                href={`/admin/articles/${article.id}/facebook`}
                className="admin-btn"
                style={{ backgroundColor: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '8px 12px' }}
                title="Créer un post Facebook"
              >
                <i className="fab fa-facebook"></i> Facebook
              </Link>
              
            </div>
          </div>
        ))}
        
        {(!articles || articles.length === 0) && (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db', color: '#6b7280' }}>
            Aucun article disponible pour la diffusion.
          </div>
        )}
      </div>
    </div>
  );
}
