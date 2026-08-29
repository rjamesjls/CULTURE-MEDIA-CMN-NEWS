'use client';

import React, { useRef, useState, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import Link from 'next/link';
import ArticleInteractions from '@/components/ArticleInteractions';

// Page component must be forwarded ref for HTMLFlipBook to work
const Page = React.forwardRef((props, ref) => {
  return (
    <div className="page" ref={ref} style={{ backgroundColor: '#fff', overflow: 'hidden', position: 'relative' }}>
      <div className="page-content" style={{ padding: '40px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {props.children}
      </div>
      <div className="page-footer" style={{ position: 'absolute', bottom: '15px', right: '20px', fontSize: '12px', color: '#9ca3af' }}>
        {props.number}
      </div>
    </div>
  );
});

Page.displayName = 'Page';

export default function MagazineViewer({ magazine, articlesData = [] }) {
  const flipBook = useRef();
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const goNext = () => flipBook.current.pageFlip().flipNext();
  const goPrev = () => flipBook.current.pageFlip().flipPrev();

  // Construct pages based on type/builder
  const rawPages = magazine.content_data || [];
  
  // Backward compatibility for old simple static array
  const formattedPages = rawPages.map(p => {
    if (typeof p === 'string') {
      return magazine.type === 'static' 
        ? { id: Math.random(), type: 'advert', imageUrl: p }
        : { id: Math.random(), type: 'article', articleId: p };
    }
    return p;
  });

  const pages = formattedPages.map((pageData, i) => {
    const pageNum = i + 1;
    
    if (pageData.type === 'cover') {
      return (
        <Page key={`page-${pageData.id}`} number={pageNum}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: '#111827', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '20px' }}>{magazine.title}</h1>
            <p style={{ fontSize: '1.2rem', color: '#9ca3af' }}>A FOLUKU TV</p>
          </div>
        </Page>
      );
    }
    
    if (pageData.type === 'sommaire') {
      // Find all articles in the magazine to list in summary
      const summaryArticles = formattedPages
        .filter(p => p.type === 'article')
        .map(p => articlesData.find(a => a.id === p.articleId))
        .filter(Boolean);

      return (
        <Page key={`page-${pageData.id}`} number={pageNum}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '30px', color: '#111827', borderBottom: '2px solid #111827', paddingBottom: '10px' }}>
            SOMMAIRE
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {summaryArticles.map((art, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #d1d5db', paddingBottom: '5px' }}>
                <span style={{ fontWeight: 'bold', color: '#374151', fontSize: '1rem' }}>{art.title}</span>
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{art.category || 'Article'}</span>
              </div>
            ))}
          </div>
        </Page>
      );
    }

    if (pageData.type === 'advert' || pageData.type === 'image') {
      return (
        <Page key={`page-${pageData.id}`} number={pageNum}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${pageData.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        </Page>
      );
    }

    // Default to article
    const article = articlesData.find(a => a.id === pageData.articleId);
    if (!article) return <Page key={`page-${pageData.id}`} number={pageNum}><p>Article introuvable</p></Page>;

    return (
      <Page key={`page-${pageData.id}`} number={pageNum}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', marginBottom: '15px', color: '#111827' }}>
          {article.title}
        </h2>
        {article.image_url && (
          <div style={{ width: '100%', height: '250px', marginBottom: '20px', backgroundImage: `url(${article.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px' }}></div>
        )}
        <div 
          className="article-content" 
          dangerouslySetInnerHTML={{ __html: article.content ? article.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') : '' }} 
          style={{ fontSize: '14px', lineHeight: '1.6', color: '#374151', overflowY: 'auto', flex: 1 }}
        />
      </Page>
    );
  });

  // Main Cover page (always displayed first outside of builder pages)
  const coverPage = (
    <Page key="main-cover" number={0}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: '#111827', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center', backgroundImage: magazine.cover_image_url ? `url(${magazine.cover_image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '20px' }}>{magazine.title}</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>{magazine.description}</p>
        </div>
      </div>
    </Page>
  );

  const allPages = [coverPage, ...pages];

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px' 
    }}>
      
      {/* Viewer controls */}
      <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Link href="/magazine" className="btn" style={{ backgroundColor: 'white', color: '#374151' }}>
          <i className="fas fa-arrow-left"></i> Retour au Kiosque
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={goPrev} className="btn" style={{ backgroundColor: 'white' }}>
            <i className="fas fa-chevron-left"></i>
          </button>
          <button onClick={goNext} className="btn" style={{ backgroundColor: 'white' }}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div style={{ 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
        borderRadius: '4px',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* We have to conditional render based on screen size because dimensions are fixed in stPageFlip for best performance */}
        {isMounted ? (
          <HTMLFlipBook 
            width={isMobile ? window.innerWidth - 40 : 450} 
            height={isMobile ? window.innerHeight - 200 : 600}
            size="stretch"
            minWidth={300}
            maxWidth={1000}
            minHeight={400}
            maxHeight={1536}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            ref={flipBook}
            className="magazine-flipbook"
            usePortrait={isMobile}
          >
            {allPages}
          </HTMLFlipBook>
        ) : (
          <div style={{ width: '450px', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', color: '#6b7280' }}>
            <i className="fas fa-spinner fa-spin fa-2x"></i>
          </div>
        )}
      </div>

      {/* Interactions (Partage, Likes) */}
      <div style={{ marginTop: '40px', width: '100%', maxWidth: '800px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px' }}>
        <ArticleInteractions articleId={magazine.id} initialLikes={magazine.likes_count || 0} />
      </div>

      <style jsx global>{`
        .magazine-flipbook {
          background-color: transparent !important;
        }
        .page {
          box-shadow: inset 0 0 20px rgba(0,0,0,0.05);
          border-right: 1px solid rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
