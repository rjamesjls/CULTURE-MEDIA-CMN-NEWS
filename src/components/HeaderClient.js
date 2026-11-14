'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useArticleHeader } from '@/context/ArticleHeaderContext';
import SubscribeButton from './SubscribeButton';

function formatPubDate(pubDateStr, lang = 'fr') {
  if (!pubDateStr) return '';
  try {
    const d = new Date(pubDateStr);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate();
    const year = d.getFullYear();
    const month = d.toLocaleDateString('fr-FR', { month: 'long' });

    return `${day} ${month} ${year}`;
  } catch {
    return '';
  }
}

export default function HeaderClient({ lang = 'fr', menus = [], initialArticle = null }) {
  const pathname = usePathname();
  const { articleHeader } = useArticleHeader();

  // Détermine si on est sur une page de lecture d'article
  const isArticlePage = Boolean(
    articleHeader ||
    (pathname && (
      pathname.includes('/article/') || 
      pathname.includes('/p/') ||
      pathname.includes('/magazine/')
    ))
  );

  const currentArticle = articleHeader || initialArticle;
  const badge = (currentArticle?.badge || currentArticle?.seo_metadata?.header_badge || (currentArticle?.seo_metadata?.article_format === 'web_magazine' ? 'Magazine' : 'News')).toUpperCase();
  const category = (currentArticle?.category || 'ACTUALITÉ').toUpperCase();
  const pubDateFormatted = formatPubDate(currentArticle?.pubDate || currentArticle?.pub_date, lang);

  const slogan = lang === 'bsh'
    ? 'WI MEDIA, WI KULTURU, WI TOLI'
    : 'NOTRE MÉDIA, NOS CULTURES, NOS HISTOIRES';

  return (
    <>
      <header className={`header ${isArticlePage ? 'header-article-mode' : 'header-home-mode'}`} id="header" suppressHydrationWarning>
        <div className="header-container">
          {/* ── CÔTÉ GAUCHE : Logo, et en dessous la thématique avec le slogan à côté ── */}
          <div className="header-left-cluster">
            {isArticlePage ? (
              <div className="header-article-left">
                <Link href={`/${lang}`} className="header-logo-link" title="A FOLUKU TV - Accueil">
                  <img 
                    src="/afoluku-tv-logo.png" 
                    alt="A FOLUKU TV" 
                    className="header-logo-compact" 
                  />
                </Link>

                <div className="header-theme-slogan-row">
                  <div className="header-badge header-badge-red header-badge-theme" title={`Format : ${badge}`}>
                    {badge}
                  </div>
                  <div className="header-slogan" title={slogan}>
                    {slogan}
                  </div>
                </div>
              </div>
            ) : (
              <div className="header-home-left">
                <Link href={`/${lang}`} className="header-logo-link" title="A FOLUKU TV - Accueil">
                  <img 
                    src="/afoluku-tv-logo.png" 
                    alt="A FOLUKU TV" 
                    className="header-logo-compact" 
                  />
                </Link>
                <div className="header-slogan" title={slogan}>
                  {slogan}
                </div>
              </div>
            )}
          </div>

          {/* ── CÔTÉ DROIT : Article Mode vs Home Mode ── */}
          {isArticlePage ? (
            <div className="header-right-article">
              {pubDateFormatted && (
                <div className="header-pub-date" title="Date de publication">
                  <span className="header-pub-date-label">
                    {lang === 'bsh' ? 'Pasa : ' : 'Publié le '}
                  </span>
                  <span className="header-pub-date-value">{pubDateFormatted}</span>
                </div>
              )}
              <div className="header-badge header-badge-yellow header-badge-cat" title={`Catégorie : ${category}`}>
                {category}
              </div>
            </div>
          ) : (
            <nav className="nav-menu" id="navMenu">
              {!menus?.some(menu => menu.url === "/radio") && (
                <Link href={`/${lang}/radio`} className="nav-link">
                  Radio
                </Link>
              )}
              {menus?.map((menu) => (
                <Link key={menu.id} href={`/${lang}${menu.url === '/' ? '' : menu.url}`} className={`nav-link ${menu.url === '/' ? 'active' : ''}`}>
                  {menu.label}
                </Link>
              ))}

              <div className="search-bar">
                <i className="fas fa-search search-icon"></i>
                <input type="text" placeholder="Rechercher..." className="search-input" id="searchInput" />
              </div>

              <SubscribeButton />
            </nav>
          )}
        </div>
      </header>

      {/* Espacement compensatoire sous le header fixe */}
      <div className="header-spacer"></div>
    </>
  );
}
