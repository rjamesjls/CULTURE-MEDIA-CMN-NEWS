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
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    if (lang === 'bsh') {
      return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
    }
    return `${day}/${month}/${year} à ${hours}:${minutes}:${seconds}`;
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
          {/* ── CÔTÉ GAUCHE : Logo + (Pastille format si article) + Slogan ── */}
          <div className="header-left-cluster">
            <Link href={`/${lang}`} className="header-logo-link" title="A FOLUKU TV - Accueil">
              <img 
                src="/afoluku-tv-logo.png" 
                alt="A FOLUKU TV" 
                className="header-logo-compact" 
              />
            </Link>

            {isArticlePage && (
              <div className="header-badge header-badge-red" title={`Format : ${badge}`}>
                {badge}
              </div>
            )}

            <div className="header-slogan" title={slogan}>
              {slogan}
            </div>
          </div>

          {/* ── CÔTÉ DROIT : Article Mode vs Home Mode ── */}
          {isArticlePage ? (
            <div className="header-right-article">
              {pubDateFormatted && (
                <div className="header-pub-date" title="Date exacte de publication">
                  <span className="header-pub-date-label">
                    {lang === 'bsh' ? 'Pasa : ' : 'Publié le '}
                  </span>
                  <span className="header-pub-date-value">{pubDateFormatted}</span>
                </div>
              )}
              <div className="header-badge header-badge-red header-badge-cat" title={`Catégorie : ${category}`}>
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
