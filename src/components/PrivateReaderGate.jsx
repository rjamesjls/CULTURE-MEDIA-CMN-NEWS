'use client';

import { useState } from 'react';
import Link from 'next/link';
import { verifyPrivateAccessCode, lockPrivateArticle } from '@/app/actions/private-access';
import TextToSpeechButton from '@/components/TextToSpeechButton';
import ArticleHeaderSetter from '@/components/ArticleHeaderSetter';

export default function PrivateReaderGate({
  token,
  lang = 'fr',
  initialUnlocked = false,
  initialArticle = null,
}) {
  const [isUnlocked, setIsUnlocked] = useState(initialUnlocked);
  const [article, setArticle] = useState(initialArticle);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const getTitle = (item) => (lang === 'bsh' && item?.title_bsh ? item.title_bsh : item?.title);
  const getContent = (item) => (lang === 'bsh' && item?.content_bsh ? item.content_bsh : item?.content);
  const getDesc = (item) => (lang === 'bsh' && item?.hook_bsh ? item.hook_bsh : item?.description);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg('Veuillez entrer votre code de lecture.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await verifyPrivateAccessCode(token, code.trim());
      if (res.success && res.article) {
        setArticle(res.article);
        setIsUnlocked(true);
      } else {
        setErrorMsg(res.error || 'Code invalide.');
      }
    } catch (err) {
      setErrorMsg('Erreur de communication avec le serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = async () => {
    try {
      await lockPrivateArticle(token);
      setIsUnlocked(false);
      setCode('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // ----------------------------------------------------
  // VUE 1 : ACCÈS DÉVERROUILLÉ (LECTURE DE L'ARTICLE COMPLET)
  // ----------------------------------------------------
  if (isUnlocked && article) {
    const fullTextForSpeech = `${getDesc(article) || ''} ${getContent(article) || ''}`.replace(/<[^>]*>/g, ' ');

    return (
      <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '80px' }}>
        <ArticleHeaderSetter
          badge={article.seo_metadata?.header_badge || (article.seo_metadata?.article_format === 'web_magazine' ? 'Magazine' : 'News')}
          category={article.category}
          pubDate={article.pub_date}
        />
        {/* Barre d'alerte sécurité en haut */}
        <div style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '12px 20px',
          borderBottom: '2px solid #f59e0b',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              color: '#fff',
              fontSize: '12px',
            }}>
              <i className="fas fa-check"></i>
            </span>
            <span>
              <strong>Accès Privé Autorisé :</strong> Vous lisez cet article via votre code de lecture confidentiel.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handleCopyLink}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fas fa-link"></i>
              {copiedLink ? 'Lien copié !' : 'Copier le lien'}
            </button>

            <button
              onClick={handleLock}
              style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Verrouiller à nouveau la lecture sur cet appareil"
            >
              <i className="fas fa-lock"></i>
              Verrouiller
            </button>
          </div>
        </div>

        {/* Conteneur de l'article */}
        <article style={{ maxWidth: '860px', margin: '40px auto 0 auto', padding: '0 20px' }}>
          {/* Header */}
          <header style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{
                backgroundColor: 'var(--color-primary, #b91c1c)',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {article.category || 'Actualité'}
              </span>

              <span style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <i className="fas fa-shield-alt"></i> Édition Privée Confidentielle
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontFamily: 'var(--font-heading, inherit)',
              lineHeight: '1.2',
              color: '#111827',
              margin: '0 0 16px 0',
              fontWeight: '800',
            }}>
              {getTitle(article)}
            </h1>

            {getDesc(article) && (
              <p style={{
                fontSize: '1.2rem',
                lineHeight: '1.6',
                color: '#4b5563',
                margin: '0 0 20px 0',
                fontWeight: '500',
              }}>
                {getDesc(article)}
              </p>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              paddingBottom: '16px',
              borderTop: '1px solid #e5e7eb',
              borderBottom: '1px solid #e5e7eb',
              color: '#6b7280',
              fontSize: '14px',
              flexWrap: 'wrap',
              gap: '15px',
            }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <span>
                  <i className="far fa-user" style={{ marginRight: '6px' }}></i>
                  {article.author || 'La Rédaction'}
                </span>
                <time>
                  <i className="far fa-calendar" style={{ marginRight: '6px' }}></i>
                  {article.pub_date ? new Date(article.pub_date).toLocaleDateString(lang === 'bsh' ? 'bs-BA' : 'fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }) : 'Date non spécifiée'}
                </time>
              </div>

              <TextToSpeechButton title={getTitle(article)} content={fullTextForSpeech} />
            </div>
          </header>

          {/* Image de couverture */}
          {article.image_url && (
            <div style={{
              marginBottom: '35px',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
              backgroundColor: '#e5e7eb',
            }}>
              <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 9',
                maxHeight: '520px',
                overflow: 'hidden',
                backgroundColor: '#0f172a',
              }}>
                <img
                  src={article.image_url}
                  alt={getTitle(article)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: article.seo_metadata?.image_position || '50% 50%',
                    transform: (Number(article.seo_metadata?.image_zoom) > 100)
                      ? `scale(${Number(article.seo_metadata.image_zoom) / 100})`
                      : 'none',
                    transformOrigin: article.seo_metadata?.image_position || '50% 50%',
                    display: 'block'
                  }}
                />
              </div>
              {(article.seo_metadata?.image_caption || article.seo_metadata?.image_credit) && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '10px 14px',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  color: '#64748b',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  {article.seo_metadata?.image_caption ? (
                    <span style={{ fontStyle: 'italic', flex: 1, minWidth: '200px' }}>
                      {article.seo_metadata.image_caption}
                    </span>
                  ) : <span />}
                  {article.seo_metadata?.image_credit && (
                    <span style={{ fontWeight: '500', color: '#94a3b8', fontSize: '12px' }}>
                      <i className="fas fa-camera" style={{ marginRight: '5px' }}></i>
                      {article.seo_metadata.image_credit}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Corps de l'article */}
          <div
            className="article-body"
            style={{
              fontSize: '1.18rem',
              lineHeight: '1.85',
              color: '#27272a',
              backgroundColor: '#ffffff',
              padding: 'clamp(20px, 4vw, 40px)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              border: '1px solid #f1f5f9',
            }}
            dangerouslySetInnerHTML={{
              __html: getContent(article) ? getContent(article).replace(/&nbsp;/g, ' ') : '',
            }}
          />

          {/* Footer d'information confidentielle */}
          <div style={{
            marginTop: '40px',
            padding: '24px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}>
              <i className="fas fa-lock"></i>
            </div>
            <div style={{ fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
              <strong>Notice de confidentialité :</strong> Cet article a été mis à disposition à titre privé et exclusif via A FOLUKU TV. Merci de ne pas rediffuser son contenu ou son code sans autorisation.
            </div>
          </div>
        </article>
      </div>
    );
  }

  // ----------------------------------------------------
  // VUE 2 : PORTE DE SÉCURITÉ (DEMANDE DU CODE DE LECTURE)
  // ----------------------------------------------------
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(217, 119, 6, 0.15), transparent 70%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      color: '#fff',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: '#12121a',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(217, 119, 6, 0.1)',
        overflow: 'hidden',
      }}>
        {/* En-tête avec badge de sécurité */}
        <div style={{
          padding: '30px 30px 20px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
        }}>
          {/* Icône animée */}
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: 'rgba(217, 119, 6, 0.15)',
            border: '2px solid rgba(217, 119, 6, 0.4)',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 20px rgba(217, 119, 6, 0.25)',
          }}>
            <i className="fas fa-lock"></i>
          </div>

          <div style={{
            display: 'inline-block',
            padding: '4px 14px',
            backgroundColor: 'rgba(217, 119, 6, 0.2)',
            color: '#fbbf24',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}>
            Article Privé • Accès Protégé
          </div>

          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '22px',
            fontWeight: '700',
            color: '#ffffff',
          }}>
            Code de lecture requis
          </h2>

          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#9ca3af',
            lineHeight: '1.5',
          }}>
            Cet article a été partagé en accès confidentiel. Renseignez le code reçu pour débloquer sa lecture.
          </p>
        </div>

        {/* Aperçu de l'article ciblé */}
        {article && (
          <div style={{
            padding: '20px 30px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}>
            {article.image_url ? (
              <img
                src={article.image_url}
                alt="Miniature"
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  flexShrink: 0,
                  filter: 'blur(1px)',
                }}
              />
            ) : (
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '22px',
                flexShrink: 0,
              }}>
                <i className="fas fa-newspaper"></i>
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#f59e0b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {article.category || 'Actualité'}
              </span>
              <h3 style={{
                margin: '4px 0 0 0',
                fontSize: '15px',
                fontWeight: '600',
                color: '#f3f4f6',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {getTitle(article)}
              </h3>
            </div>
          </div>
        )}

        {/* Formulaire de saisie du code */}
        <form onSubmit={handleUnlock} style={{ padding: '30px' }}>
          {errorMsg && (
            <div style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <i className="fas fa-exclamation-circle" style={{ color: '#ef4444' }}></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ marginBottom: '22px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#d1d5db',
              marginBottom: '10px',
              textAlign: 'center',
            }}>
              Entrez votre code de lecture :
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                autoFocus
                autoComplete="off"
                placeholder="Ex: 849201"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(217, 119, 6, 0.5)',
                  borderRadius: '12px',
                  color: '#fbbf24',
                  fontSize: '22px',
                  fontWeight: '700',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace, sans-serif',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#f59e0b';
                  e.target.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(217, 119, 6, 0.5)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#d97706',
              backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 10px 25px rgba(217, 119, 6, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Vérification du code...
              </>
            ) : (
              <>
                <i className="fas fa-key"></i>
                Déverrouiller et lire l'article
              </>
            )}
          </button>

          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#6b7280',
            lineHeight: '1.5',
          }}>
            <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
            Le code vous a été communiqué par l'expéditeur (par message, email ou WhatsApp).
          </div>
        </form>

        {/* Retour au site public */}
        <div style={{
          padding: '16px 30px',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center',
        }}>
          <Link
            href={`/${lang}`}
            style={{
              color: '#9ca3af',
              fontSize: '13px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fas fa-arrow-left"></i>
            Retour à l'accueil A FOLUKU TV
          </Link>
        </div>
      </div>
    </div>
  );
}
