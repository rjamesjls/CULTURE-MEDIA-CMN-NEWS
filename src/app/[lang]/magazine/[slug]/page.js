import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ArticleInteractions from '@/components/ArticleInteractions';
import ArticleComments from '@/components/ArticleComments';
import ViewTracker from '@/components/ViewTracker';
export const revalidate = 60;

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { slug, lang } = resolvedParams;

  const { data: article } = await supabase
    .from('articles')
    .select('title, title_bsh, description, hook_bsh, image_url')
    .eq('slug', slug)
    .single();

  if (!article) return { title: 'Magazine Introuvable' };



  const getTitle = () => (lang === 'bsh' && article.title_bsh) ? article.title_bsh : article.title;
  const getDesc = () => (lang === 'bsh' && article.hook_bsh) ? article.hook_bsh : article.description;

  return {
    title: `${getTitle()} | Édition Spéciale`,
    description: getDesc(),
    openGraph: {
      images: [article.image_url || ''],
    }
  };
}

export default async function MagazineReaderPage({ params }) {
  const resolvedParams = await params;
  const { slug, lang } = resolvedParams;
  
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !article) {
    notFound();
  }

  // Si c'est pas un web magazine, on pourrait rediriger vers l'article normal, mais on le laisse accessible ici s'il est appelé
  
  // Fetch comments (approved only)
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('article_id', article.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  const getTitle = () => (lang === 'bsh' && article.title_bsh) ? article.title_bsh : article.title;
  const getDesc = () => (lang === 'bsh' && article.hook_bsh) ? article.hook_bsh : article.description;
  const getContent = () => (lang === 'bsh' && article.content_bsh) ? article.content_bsh : article.content;

  return (
    <div className="magazine-reader" style={{ backgroundColor: '#020617', minHeight: '100vh', color: '#f8fafc', overflowX: 'hidden' }}>
      <ViewTracker articleId={article.id} />
      
      {/* Bouton Retour Discret */}
      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 100 }}>
        <Link href={`/${lang}/magazine`} className="mag-back-btn" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          color: '#ffffff', 
          textDecoration: 'none', 
          background: 'rgba(2, 6, 23, 0.4)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '50%',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          opacity: 0.5,
          transition: 'all 0.3s ease'
        }}>
          <i className="fas fa-arrow-left"></i>
        </Link>
      </div>

      {/* Hero Section */}
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '10vh', paddingTop: '100px', overflow: 'hidden' }}>
        {/* Image Background */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          backgroundImage: article.seo_metadata?.magazine_cover_url ? `url(${article.seo_metadata.magazine_cover_url})` : (article.image_url ? `url(${article.image_url})` : 'url(https://images.unsplash.com/photo-1499750310107-5fef28a66643)'),
          backgroundSize: 'cover', 
          backgroundPosition: 'top center',
          backgroundAttachment: 'fixed',
          filter: 'blur(20px)',
          transform: 'scale(1.1)',
          zIndex: 0
        }}></div>
        
        {/* Gradient Overlay */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(to top, #020617 0%, rgba(2,6,23,0.8) 30%, rgba(2,6,23,0.3) 100%)',
          zIndex: 1
        }}></div>

        {/* Header Content */}
        <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '1000px', width: '100%', margin: 'auto auto 0 auto', padding: '0 20px' }}>
          
          <div style={{ marginBottom: '-40px', marginTop: '-40px' }}>
            <img src="/magazine-logo.png" alt="Web Magazine" style={{ height: 'auto', width: '400px', maxWidth: '100%', objectFit: 'contain' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
            <span style={{ 
              padding: '6px 16px', 
              background: '#c026d3', 
              color: '#ffffff',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(192, 38, 211, 0.4)'
            }}>Édition Spéciale</span>
            <span style={{ color: '#94a3b8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="far fa-calendar-alt"></i> {new Date(article.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <h1 style={{ 
            fontFamily: 'var(--font-heading)', 
            fontSize: 'clamp(3rem, 6vw, 5.5rem)', 
            color: '#ffffff', 
            marginBottom: '30px',
            lineHeight: '1.1',
            textShadow: '0 10px 30px rgba(0,0,0,0.8)',
            maxWidth: '900px'
          }}>
            {getTitle()}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', border: '2px solid #334155' }}>
              <i className="fas fa-pen-nib" style={{ color: '#94a3b8' }}></i>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Rédigé par</div>
              <div style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 'bold' }}>{article.author || 'La Rédaction'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ backgroundColor: '#020617', padding: '80px 20px', position: 'relative', zIndex: 3 }}>
        <article style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Introduction / Hook */}
          {getDesc() && (
            <div style={{ 
              fontSize: '1.6rem', 
              lineHeight: '1.7', 
              color: '#e2e8f0', 
              marginBottom: '60px',
              fontFamily: 'var(--font-heading)',
              fontWeight: '300',
              borderLeft: '4px solid #c026d3',
              paddingLeft: '30px',
              fontStyle: 'italic'
            }}>
              {getDesc()}
            </div>
          )}

          {/* Core Content */}
          <div className="mag-content" dangerouslySetInnerHTML={{ __html: (getContent() || '').replace(/&nbsp;/g, ' ') }}></div>
          
          {/* Section Partage et Interactions */}
          <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#ffffff', marginBottom: '20px', textAlign: 'center' }}>
              Partager cette édition
            </h3>
            <ArticleInteractions articleId={article.id} initialLikes={article.likes_count || 0} />
          </div>
          
          {/* Section Commentaires */}
          <div style={{ marginTop: '40px' }}>
            <ArticleComments articleId={article.id} initialComments={comments || []} />
          </div>

        </article>
      </div>

      {/* Footer minimaliste pour l'immersion */}
      <div style={{ textAlign: 'center', padding: '60px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '40px' }}>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>© {new Date().getFullYear()} A FOLUKU TV - Tous droits réservés.</p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .mag-back-btn:hover {
          background-color: rgba(255,255,255,0.1);
          color: #ffffff !important;
        }
        .mag-content {
          font-family: var(--font-body);
          font-size: 1.15rem;
          line-height: 1.9;
          color: #cbd5e1;
        }

        /* Lettrine (Drop Cap) pour le premier paragraphe */
        .mag-content > p:first-of-type::first-letter {
          float: left;
          font-size: 5rem;
          line-height: 0.8;
          padding: 10px 15px 10px 0;
          font-family: var(--font-heading);
          color: #c026d3;
          font-weight: bold;
        }

        .mag-content h2 {
          font-family: var(--font-heading);
          font-size: 2.2rem;
          color: #ffffff;
          margin-top: 60px;
          margin-bottom: 30px;
          line-height: 1.3;
        }

        .mag-content h3 {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          color: #e2e8f0;
          margin-top: 40px;
          margin-bottom: 20px;
        }

        .mag-content p {
          margin-bottom: 30px;
        }

        .mag-content img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 40px 0;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }

        .mag-content blockquote {
          margin: 50px 0;
          padding: 40px;
          background: rgba(30, 41, 59, 0.4);
          border-left: none;
          border-radius: 16px;
          text-align: center;
          position: relative;
        }

        .mag-content blockquote::before {
          content: '"';
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 5rem;
          color: rgba(192, 38, 211, 0.2);
          font-family: var(--font-heading);
          line-height: 1;
        }

        .mag-content blockquote p {
          font-size: 1.8rem;
          font-family: var(--font-heading);
          color: #ffffff;
          margin: 0;
          line-height: 1.5;
        }

        .mag-content a {
          color: #f0abfc;
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .mag-content a:hover {
          color: #c026d3;
        }

        /* Surcharge forte pour écraser les styles en ligne (WYSIWYG) qui mettraient le texte en noir ou empêcheraient le retour à la ligne */
        .mag-content * {
          color: inherit !important;
          background-color: transparent !important;
          font-family: inherit !important;
          white-space: normal !important;
          word-break: normal !important;
          overflow-wrap: normal !important;
          max-width: 100% !important;
        }
        
        .mag-content b, .mag-content strong {
          color: #ffffff !important;
          font-weight: bold !important;
        }
      `}} />
    </div>
  );
}
