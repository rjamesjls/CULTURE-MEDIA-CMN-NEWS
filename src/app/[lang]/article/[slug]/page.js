import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ArticleInteractions from '@/components/ArticleInteractions';
import ArticleComments from '@/components/ArticleComments';
import ViewTracker from '@/components/ViewTracker';
import TextToSpeechButton from '@/components/TextToSpeechButton';
import { getUserProfile } from '@/utils/supabase/auth';

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const { data: article } = await supabase
    .from('articles')
    .select('title, description, image_url, category_id, categories(name)')
    .eq('slug', slug)
    .single();

  if (!article) return { title: 'Article non trouvé' };

  const categoryName = article.categories?.name || 'Actualité';
  const ogImage = article.image_url || '/icon.png';
  const lang = resolvedParams.lang;

  const getTitle = () => (lang === 'bsh' && article.title_bsh) ? article.title_bsh : article.title;
  const getDesc = () => (lang === 'bsh' && article.hook_bsh) ? article.hook_bsh : article.description;

  return {
    title: `${getTitle()} | A FOLUKU TV`,
    description: getDesc(),
    keywords: [categoryName, 'A FOLUKU TV', 'Actualité'],
    alternates: {
      canonical: `/${lang}/article/${slug}`,
      languages: {
        'fr': `/fr/article/${slug}`,
        'bsh': `/bsh/article/${slug}`,
      },
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url: `/article/${slug}`,
      type: 'article',
      publishedTime: article.pub_date,
      authors: ['A FOLUKU TV'],
      section: categoryName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [ogImage],
    },
  };
}

import { getDictionary } from '@/i18n/dictionaries';

export default async function ArticlePage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const lang = resolvedParams.lang;
  const dict = await getDictionary(lang);
  
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !article) {
    notFound();
  }

  // Si c'est un brouillon, on vérifie que l'utilisateur est admin ou auteur
  let isPreviewMode = false;
  if (article.status === 'draft') {
    const profile = await getUserProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'author')) {
      notFound(); // On simule que l'article n'existe pas pour le grand public
    }
    isPreviewMode = true;
  }

  // Fetch comments (approved only)
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('article_id', article.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  // Fetch Latest Articles
  const { data: latestArticles } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .neq('id', article.id)
    .order('pub_date', { ascending: false })
    .limit(4);

  // Fetch Most Read Articles (using likes_count as proxy)
  const { data: mostReadArticles } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .neq('id', article.id)
    .order('likes_count', { ascending: false })
    .limit(4);

  const getTitle = (item) => (lang === 'bsh' && item.title_bsh) ? item.title_bsh : item.title;
  const getContent = (item) => (lang === 'bsh' && item.content_bsh) ? item.content_bsh : item.content;
  const getDesc = (item) => (lang === 'bsh' && item.hook_bsh) ? item.hook_bsh : item.description;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: getTitle(article),
    image: [
      article.image_url || 'https://www.culturemedia.news/icon.png'
    ],
    datePublished: article.pub_date,
    dateModified: article.updated_at || article.pub_date,
    author: [{
      '@type': 'Organization',
      name: 'A FOLUKU TV',
      url: 'https://www.culturemedia.news'
    }]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {isPreviewMode && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, backgroundColor: '#fef08a', color: '#854d0e', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', borderBottom: '2px solid #eab308' }}>
          ⚠️ MODE APERÇU : Cet article est un brouillon et n'est pas visible par le public.
        </div>
      )}
      <div className="article-layout-wrapper" style={{ maxWidth: '1400px', padding: '0 20px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <ViewTracker articleId={article.id} />
        
        {/* Left Sidebar: Latest Articles */}
      <aside className="sidebar-latest" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <div style={{ width: '4px', height: '24px', backgroundColor: 'var(--color-primary)' }}></div>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', margin: 0, textTransform: 'uppercase' }}>{dict.home.latest_news}</h3>
        </div>
        
        <div className="sidebar-list">
        {latestArticles && latestArticles.map((item) => (
          <Link href={`/${lang}/article/${item.slug}`} key={item.slug} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textDecoration: 'none', color: 'inherit' }} className="sidebar-article">
            <div style={{ height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
              <img src={item.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=400&auto=format&fit=crop'} alt={getTitle(item)} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} className="hover-zoom" />
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--color-primary)', textTransform: 'uppercase' }}>{item.category}</span>
              <h4 style={{ fontSize: '0.95rem', margin: '5px 0 0 0', lineHeight: '1.4', fontWeight: '600' }} className="hover-color">{getTitle(item)}</h4>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '5px' }}>{new Date(item.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR')}</div>
            </div>
          </Link>
        ))}
        </div>
      </aside>

      {/* Center: Main Article */}
      <article className="article-container" style={{ flex: 1, minWidth: 0, padding: '0', margin: '0' }}>
        <header className="article-header">
          <span className="badge" style={{ background: 'var(--color-primary)', color: 'white', padding: '5px 10px', borderRadius: '4px' }}>
            {article.category}
          </span>
          <h1 className="article-title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginTop: '15px', fontFamily: 'var(--font-heading)', lineHeight: '1.2' }}>
            {getTitle(article)}
          </h1>
          <div className="article-meta" style={{ display: 'flex', gap: '20px', color: 'var(--color-gray-500)', marginTop: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-gray-200)', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <span className="author">
                <i className="far fa-user"></i> {article.author || 'La Rédaction'}
              </span>
              <time dateTime={article.pub_date}>
                <i className="far fa-calendar"></i> {new Date(article.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR')}
              </time>
            </div>
            <TextToSpeechButton title={getTitle(article)} content={getDesc(article) + " " + getContent(article)} />
          </div>
        </header>

        <div className="article-featured-image" style={{ margin: '30px 0' }}>
          <img src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=800&auto=format&fit=crop'} alt={getTitle(article)} style={{ width: '100%', borderRadius: '12px' }} />
        </div>

        <div className="article-body" id="article-content" style={{ fontSize: '1.15rem', lineHeight: '1.8', color: '#374151' }}>
          <div dangerouslySetInnerHTML={{ __html: getContent(article) ? getContent(article).replace(/&nbsp;/g, ' ') : '' }} />
        </div>

        <ArticleInteractions articleId={article.id} initialLikes={article.likes_count || 0} />
        <ArticleComments articleId={article.id} initialComments={comments || []} />

        <footer className="article-footer" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--color-gray-200)' }}>
          <Link href={`/${lang}/faits-divers`} className="btn btn-secondary">
            <i className="fas fa-arrow-left"></i> {dict.article?.back || "Retour"}
          </Link>
        </footer>
      </article>

      {/* Right Sidebar: Most Read Articles */}
      <aside className="sidebar-popular" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <div style={{ width: '4px', height: '24px', backgroundColor: '#eab308' }}></div>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', margin: 0, textTransform: 'uppercase' }}>{dict.home.most_read}</h3>
        </div>
        
        <div className="sidebar-list">
        {mostReadArticles && mostReadArticles.map((item, index) => (
          <Link href={`/${lang}/article/${item.slug}`} key={item.slug} style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none', color: 'inherit' }} className="sidebar-article">
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#f3f4f6', lineHeight: '1', minWidth: '40px', textAlign: 'center', fontFamily: 'var(--font-heading)' }}>
              {index + 1}
            </div>
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#eab308', textTransform: 'uppercase' }}>{item.category}</span>
              <h4 style={{ fontSize: '0.9rem', margin: '3px 0 0 0', lineHeight: '1.4', fontWeight: '600' }} className="hover-color">{getTitle(item)}</h4>
            </div>
          </Link>
        ))}
        </div>
      </aside>

      <style>{`
        /* Mobile First Layout */
        .article-layout-wrapper {
          flex-direction: column;
          margin: 100px auto 40px auto;
        }
        
        .article-container {
          order: 1; /* Main article always first on mobile */
          width: 100%;
        }

        .sidebar-latest {
          order: 2;
          width: 100% !important;
          position: static !important;
          margin-top: 40px;
        }

        .sidebar-popular {
          order: 3;
          width: 100% !important;
          position: static !important;
          margin-top: 40px;
        }
        
        .sidebar-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        /* Desktop Layout */
        @media (min-width: 1024px) {
          .article-layout-wrapper {
            flex-direction: row;
            margin: 140px auto 40px auto;
          }
          
          .article-container {
            order: 2; /* Center */
          }

          .sidebar-latest {
            order: 1; /* Left */
            width: 280px !important;
            position: sticky !important;
            margin-top: 0;
          }

          .sidebar-popular {
            order: 3; /* Right */
            width: 280px !important;
            position: sticky !important;
            margin-top: 0;
          }
          
          .sidebar-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
        }

        /* Hover Effects */
        .sidebar-article .hover-zoom {
          transition: transform 0.3s ease;
        }
        .sidebar-article:hover .hover-zoom {
          transform: scale(1.05);
        }
        .sidebar-article .hover-color {
          transition: color 0.2s ease;
        }
        .sidebar-article:hover .hover-color {
          color: var(--color-primary);
        }

        /* TTS Highlight */
        .tts-highlight {
          background-color: #fef08a; /* yellow-200 */
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
          transition: background-color 0.3s ease;
        }
      `}</style>
    </div>
    </>
  );
}
