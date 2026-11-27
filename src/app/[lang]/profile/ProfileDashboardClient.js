'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { logout } from '@/app/auth/actions';

export default function ProfileDashboardClient({
  user,
  userName,
  userRole = 'user',
  lang = 'fr',
  socialPosts = [],
  latestArticles = [],
  initialBookmarks = [],
  initialComments = []
}) {
  const [activeTab, setActiveTab] = useState('social'); // 'social' | 'articles' | 'bookmarks' | 'comments'
  const [socialLang, setSocialLang] = useState('fr'); // 'fr' | 'bsh'
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [bookmarkedArticleIds, setBookmarkedArticleIds] = useState(() => {
    return new Set(initialBookmarks.map(b => b.articles?.id || b.article_id).filter(Boolean));
  });
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleToggleBookmark = async (articleId) => {
    if (!user) return;
    const isBookmarked = bookmarkedArticleIds.has(articleId);

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .match({ user_id: user.id, article_id: articleId });

        if (!error) {
          setBookmarkedArticleIds(prev => {
            const next = new Set(prev);
            next.delete(articleId);
            return next;
          });
          setBookmarks(prev => prev.filter(b => (b.articles?.id || b.article_id) !== articleId));
          showToast('Article retiré de vos favoris');
        }
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, article_id: articleId });

        if (!error) {
          setBookmarkedArticleIds(prev => new Set(prev).add(articleId));
          // Trouver l'article dans les listes
          const art = latestArticles.find(a => a.id === articleId) || 
                      socialPosts.find(p => p.id === articleId);
          if (art) {
            setBookmarks(prev => [{
              id: `temp-${Date.now()}`,
              article_id: articleId,
              created_at: new Date().toISOString(),
              articles: art
            }, ...prev]);
          }
          showToast('Article ajouté à vos favoris !');
        }
      }
    } catch (err) {
      console.error('Erreur bookmark:', err);
    }
  };

  const handleShareLink = (slug) => {
    const url = `${window.location.origin}/${lang}/article/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Lien de l\'article copié dans le presse-papier !');
    } else {
      showToast(url);
    }
  };

  const getRoleBadge = () => {
    if (userRole === 'admin') {
      return { label: 'Administrateur', bg: '#fee2e2', color: '#b91c1c' };
    }
    if (userRole === 'pro') {
      return { label: 'Compte Pro', bg: '#fef3c7', color: '#b45309' };
    }
    if (userRole === 'author') {
      return { label: 'Rédacteur', bg: '#e0e7ff', color: '#4338ca' };
    }
    return { label: 'Lecteur Membre', bg: '#ecfdf5', color: '#047857' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div style={{ maxWidth: '1100px', margin: '120px auto 80px auto', padding: '0 20px', fontFamily: 'inherit' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          backgroundColor: '#0f172a',
          color: '#fff',
          padding: '12px 22px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
          {toastMessage}
        </div>
      )}

      {/* HEADER DU PROFIL / TABLEAU DE BORD */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '28px 32px',
        marginBottom: '30px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d16c7 0%, #e41318 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(13,22,199,0.25)'
          }}>
            {userName ? userName.charAt(0).toUpperCase() : <i className="fas fa-user"></i>}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', margin: 0, color: '#0f172a' }}>
                {userName}
              </h1>
              <span style={{
                fontSize: '11.5px',
                padding: '3px 10px',
                borderRadius: '20px',
                fontWeight: '700',
                backgroundColor: roleBadge.bg,
                color: roleBadge.color,
                letterSpacing: '0.3px'
              }}>
                {roleBadge.label}
              </span>
            </div>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
              {user.email} &bull; Espace Lecteur Connecté A FOLUKU TV
            </p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            style={{
              padding: '9px 18px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fca5a5'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            <i className="fas fa-sign-out-alt"></i>
            Se déconnecter
          </button>
        </form>
      </div>

      {/* BARRE D'ONGLETS NAVIGATION DU TABLEAU DE BORD */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '30px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          {
            id: 'social',
            label: '📱 Posts Réseaux Sociaux',
            count: socialPosts.length,
            badgeBg: '#16a34a',
            badgeColor: '#fff'
          },
          {
            id: 'articles',
            label: '📰 Articles Récents',
            count: latestArticles.length,
            badgeBg: '#e2e8f0',
            badgeColor: '#334155'
          },
          {
            id: 'bookmarks',
            label: '🔖 Mes Favoris',
            count: bookmarks.length,
            badgeBg: '#e2e8f0',
            badgeColor: '#334155'
          },
          {
            id: 'comments',
            label: '💬 Mes Commentaires',
            count: initialComments.length,
            badgeBg: '#e2e8f0',
            badgeColor: '#334155'
          }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
                color: isActive ? '#2563eb' : '#64748b',
                fontWeight: isActive ? '700' : '600',
                fontSize: '14.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                marginBottom: '-2px'
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#2563eb' : tab.badgeBg,
                  color: isActive ? '#fff' : tab.badgeColor,
                  fontWeight: '700'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── CONTENU DE L'ONGLET 1 : POSTS RÉSEAUX SOCIAUX (EXCLUSIF LECTEURS) ── */}
      {activeTab === 'social' && (
        <section>
          {/* Entête de section avec switcher de langue */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', margin: '0 0 4px 0', color: '#0f172a' }}>
                Flux Réseaux Sociaux & Actus Flash
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Visuels officiels préparés pour les réseaux sociaux, diffusés en exclusivité directe pour nos lecteurs connectés.
              </p>
            </div>

            {/* Sélecteur FR / BSH */}
            <div style={{ display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setSocialLang('fr')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: socialLang === 'fr' ? '#fff' : 'transparent',
                  color: socialLang === 'fr' ? '#2563eb' : '#64748b',
                  boxShadow: socialLang === 'fr' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
              >
                🇫🇷 Français
              </button>
              <button
                type="button"
                onClick={() => setSocialLang('bsh')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: socialLang === 'bsh' ? '#fff' : 'transparent',
                  color: socialLang === 'bsh' ? '#16a34a' : '#64748b',
                  boxShadow: socialLang === 'bsh' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
              >
                🇬🇫 Boushingué
              </button>
            </div>
          </div>

          {/* Grille des posts sociaux */}
          {socialPosts.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              border: '2px dashed #cbd5e1',
              textAlign: 'center'
            }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '24px' }}>
                <i className="fas fa-bullhorn"></i>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#1e293b' }}>
                Aucun post social diffusé pour le moment
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
                Dès que la rédaction valide et clique sur « Envoyer aux lecteurs » sur un post, il apparaîtra ici avec son visuel haute définition.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '28px'
            }}>
              {socialPosts.map((post) => {
                const postImage = socialLang === 'bsh'
                  ? (post.image_bsh || post.image_fr)
                  : (post.image_fr || post.image_bsh);
                const isBookmarked = bookmarkedArticleIds.has(post.id);

                return (
                  <div
                    key={post.id}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    {/* En-tête de la carte */}
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{
                        backgroundColor: '#ffce00',
                        color: '#000',
                        fontWeight: '900',
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {post.category}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                        {new Date(post.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    {/* Cadre Visuel 4:5 Social Post */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      paddingTop: '125%', // Ratio 4:5 Instagram
                      backgroundColor: '#090d16',
                      overflow: 'hidden'
                    }}>
                      {postImage ? (
                        <img
                          src={postImage}
                          alt={post.title}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            backgroundColor: '#090d16'
                          }}
                        />
                      ) : (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                          fontSize: '14px'
                        }}>
                          Visuel en cours de génération
                        </div>
                      )}
                    </div>

                    {/* Légende & Titre */}
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{
                        fontSize: '1.05rem',
                        fontWeight: '700',
                        lineHeight: '1.35',
                        margin: '0 0 10px 0',
                        color: '#0f172a'
                      }}>
                        <Link href={`/${lang}/article/${post.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {socialLang === 'bsh' ? (post.title_bsh || post.title) : post.title}
                        </Link>
                      </h3>

                      {post.caption && (
                        <p style={{
                          fontSize: '12.5px',
                          color: '#475569',
                          lineHeight: '1.5',
                          margin: '0 0 14px 0',
                          whiteSpace: 'pre-line',
                          maxHeight: '80px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {post.caption}
                        </p>
                      )}

                      {/* Barre d'action */}
                      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <Link
                          href={`/${lang}/article/${post.slug}`}
                          style={{
                            flex: 1,
                            padding: '8px 14px',
                            backgroundColor: '#2563eb',
                            color: '#fff',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className="fas fa-book-open"></i> Lire l'article
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(post.id)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: isBookmarked ? '#eff6ff' : '#fff',
                            color: isBookmarked ? '#2563eb' : '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            transition: 'all 0.15s ease'
                          }}
                          title={isBookmarked ? 'Retirer des favoris' : 'Sauvegarder en favoris'}
                        >
                          <i className={isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
                        </button>

                        {postImage && (
                          <a
                            href={postImage}
                            download={`afoluku-social-${post.slug}.jpg`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#fff',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              textDecoration: 'none'
                            }}
                            title="Télécharger le visuel HD"
                          >
                            <i className="fas fa-download"></i>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleShareLink(post.slug)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            backgroundColor: '#fff',
                            color: '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px'
                          }}
                          title="Copier le lien"
                        >
                          <i className="fas fa-share-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── CONTENU DE L'ONGLET 2 : DERNIERS ARTICLES PUBLIÉS ── */}
      {activeTab === 'articles' && (
        <section>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', margin: '0 0 4px 0', color: '#0f172a' }}>
              Derniers Articles Publiés
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Retrouvez l'actualité fraîche et complète publiée sur la plateforme A FOLUKU TV.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {latestArticles.map((article) => {
              const isBookmarked = bookmarkedArticleIds.has(article.id);
              return (
                <div
                  key={article.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <div style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: '#0f172a'
                  }}>
                    <img
                      src={article.image_url || 'https://images.unsplash.com/photo-1620287341056-49a2f1ab2fdc?q=80&w=600&auto=format&fit=crop'}
                      alt={article.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: article.seo_metadata?.image_position || 'center',
                        transform: (Number(article.seo_metadata?.image_zoom) > 100)
                          ? `scale(${Number(article.seo_metadata.image_zoom) / 100})`
                          : 'none',
                        transformOrigin: article.seo_metadata?.image_position || 'center'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: '#e41318',
                      color: '#fff',
                      fontSize: '10.5px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {article.category}
                    </span>
                  </div>

                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '6px' }}>
                      {new Date(article.pub_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: '700', lineHeight: '1.35', margin: '0 0 10px 0' }}>
                      <Link href={`/${lang}/article/${article.slug}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                        {article.title}
                      </Link>
                    </h3>

                    {article.description && (
                      <p style={{
                        fontSize: '12.5px',
                        color: '#64748b',
                        lineHeight: '1.45',
                        margin: '0 0 14px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {article.description}
                      </p>
                    )}

                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <Link
                        href={`/${lang}/article/${article.slug}`}
                        style={{ fontSize: '12.5px', fontWeight: '700', color: '#2563eb', textDecoration: 'none' }}
                      >
                        Lire l'article &rarr;
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(article.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: isBookmarked ? '#2563eb' : '#94a3b8',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '4px'
                        }}
                        title={isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <i className={isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── CONTENU DE L'ONGLET 3 : MES FAVORIS ── */}
      {activeTab === 'bookmarks' && (
        <section>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', margin: '0 0 4px 0', color: '#0f172a' }}>
              Mes Articles Sauvegardés
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Retrouvez tous les articles et posts que vous avez mis de côté pour les lire plus tard.
            </p>
          </div>

          {bookmarks.length === 0 ? (
            <div style={{ padding: '50px 20px', backgroundColor: '#f9fafb', borderRadius: '12px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', margin: '0 0 15px 0' }}>Vous n'avez pas encore sauvegardé d'articles.</p>
              <button
                type="button"
                onClick={() => setActiveTab('articles')}
                style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
              >
                Explorer les actualités
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {bookmarks.map((bookmark) => {
                const article = bookmark.articles;
                if (!article) return null;
                return (
                  <div
                    key={bookmark.id}
                    style={{
                      display: 'flex',
                      gap: '15px',
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      padding: '12px'
                    }}
                  >
                    <div style={{ width: '90px', height: '90px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                      <img src={article.image_url || '/icon.png'} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '10px', color: '#2563eb', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {article.category || 'Actualité'}
                      </span>
                      <h3 style={{ fontSize: '13.5px', margin: '4px 0 6px 0', lineHeight: '1.3', fontWeight: '700' }}>
                        <Link href={`/${lang}/article/${article.slug}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                          {article.title}
                        </Link>
                      </h3>
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8' }}>
                        <span>Sauvegardé</span>
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(article.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '11px', fontWeight: '600', padding: 0 }}
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── CONTENU DE L'ONGLET 4 : MES COMMENTAIRES ── */}
      {activeTab === 'comments' && (
        <section>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', margin: '0 0 4px 0', color: '#0f172a' }}>
              Mon Historique de Commentaires
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Tous vos avis et commentaires publiés sous les articles.
            </p>
          </div>

          {initialComments.length === 0 ? (
            <div style={{ padding: '40px 20px', backgroundColor: '#f9fafb', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <p style={{ color: '#64748b', margin: 0 }}>Aucun commentaire trouvé avec votre compte.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {initialComments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: '18px',
                    backgroundColor: '#fff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12.5px', color: '#64748b' }}>
                    <div>
                      Sur l'article :{' '}
                      <Link href={`/${lang}/article/${comment.articles?.slug}`} style={{ color: '#2563eb', fontWeight: '600' }}>
                        {comment.articles?.title}
                      </Link>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                      {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#334151', lineHeight: '1.5', fontSize: '13.5px', fontStyle: 'italic' }}>
                    "{comment.content}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
}
