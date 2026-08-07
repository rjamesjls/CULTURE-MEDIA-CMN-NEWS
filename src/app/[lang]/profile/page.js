import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 0; // Dynamic page

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch Bookmarks
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      articles (
        id,
        title,
        slug,
        image_url,
        category,
        pub_date
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch Comments (using name or email as proxy since user_id isn't in comments table)
  const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0];
  const { data: comments } = await supabase
    .from('comments')
    .select('id, content, created_at, article_id, articles(title, slug)')
    .eq('author_name', userName)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div style={{ maxWidth: '1000px', margin: '140px auto 60px auto', padding: '0 20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: '#111827', margin: '0 0 10px 0' }}>
            Mon Profil
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.1rem', margin: 0 }}>
            Bienvenue, <strong>{userName}</strong> ({user.email})
          </p>
        </div>
        
        <form action="/auth/actions" method="POST">
          <button formAction={async () => {
            'use server';
            const s = await createClient();
            await s.auth.signOut();
            redirect('/');
          }} style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#374151', transition: 'all 0.2s' }}>
            Se déconnecter
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
        
        {/* Favoris Section */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <i className="fas fa-bookmark" style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}></i>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', margin: 0 }}>Mes Articles Sauvegardés</h2>
          </div>
          
          {(!bookmarks || bookmarks.length === 0) ? (
            <div style={{ padding: '40px', backgroundColor: '#f9fafb', borderRadius: '12px', textAlign: 'center', border: '1px dashed #d1d5db' }}>
              <p style={{ color: '#6b7280', margin: '0 0 15px 0' }}>Vous n'avez pas encore sauvegardé d'articles.</p>
              <Link href="/faits-divers" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                Explorer les actualités
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {bookmarks.map(bookmark => {
                const article = bookmark.articles;
                if (!article) return null;
                return (
                  <div key={bookmark.id} style={{ display: 'flex', gap: '15px', backgroundColor: '#fff', border: '1px solid #f3f4f6', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '100px', flexShrink: 0 }}>
                      <img src={article.image_url || '/icon.png'} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '15px 15px 15px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {article.category}
                      </span>
                      <h3 style={{ fontSize: '0.95rem', margin: '5px 0', lineHeight: '1.4' }}>
                        <Link href={`/article/${article.slug}`} style={{ color: '#111827', textDecoration: 'none' }}>
                          {article.title}
                        </Link>
                      </h3>
                      <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#9ca3af' }}>
                        Sauvegardé le {new Date(bookmark.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Comments Section */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <i className="fas fa-comment" style={{ color: '#3b82f6', fontSize: '1.2rem' }}></i>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', margin: 0 }}>Mon Historique de Commentaires</h2>
          </div>
          
          {(!comments || comments.length === 0) ? (
            <div style={{ padding: '30px', backgroundColor: '#f9fafb', borderRadius: '12px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
              <p style={{ color: '#6b7280', margin: 0 }}>Aucun commentaire trouvé avec ce pseudo.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {comments.map(comment => (
                <div key={comment.id} style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Sur l'article : <Link href={`/article/${comment.articles?.slug}`} style={{ color: 'var(--color-primary)', fontWeight: '500' }}>{comment.articles?.title}</Link>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <p style={{ margin: 0, color: '#374151', lineHeight: '1.5' }}>"{comment.content}"</p>
                </div>
              ))}
            </div>
          )}
        </section>
        
      </div>
    </div>
  );
}
