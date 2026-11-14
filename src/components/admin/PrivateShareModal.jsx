'use client';

import { useState, useEffect } from 'react';
import { savePrivateShare, revokePrivateShare, getFreshRandomCode } from '@/app/admin/actions/private-share';

export default function PrivateShareModal({ isOpen, onClose, article, onUpdated }) {
  const [token, setToken] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expirationDays, setExpirationDays] = useState(0);
  const [isPrivateOnly, setIsPrivateOnly] = useState(true);
  const [viewsCount, setViewsCount] = useState(0);
  const [expiresAt, setExpiresAt] = useState(null);
  const [isEnabled, setIsEnabled] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  // Initialisation à l'ouverture
  useEffect(() => {
    if (isOpen && article) {
      const privateAccess = article.seo_metadata?.private_access;
      if (privateAccess && privateAccess.token) {
        setToken(privateAccess.token);
        setAccessCode(privateAccess.access_code || '');
        setRecipientName(privateAccess.recipient_name || '');
        setRecipientEmail(privateAccess.recipient_email || '');
        setIsPrivateOnly(privateAccess.is_private_only !== false);
        setViewsCount(privateAccess.views_count || 0);
        setExpiresAt(privateAccess.expires_at || null);
        setIsEnabled(privateAccess.enabled !== false);
      } else {
        // Nouvel accès privé par défaut
        setToken(Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10));
        setAccessCode(Math.floor(100000 + Math.random() * 900000).toString());
        setRecipientName('');
        setRecipientEmail('');
        setIsPrivateOnly(true);
        setViewsCount(0);
        setExpiresAt(null);
        setIsEnabled(false);
      }
      setSaveSuccess(false);
      setErrorMsg('');
      setCopyFeedback('');
    }
  }, [isOpen, article]);

  if (!isOpen || !article) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.afolukutv.com';
  const privateUrl = `${origin}/fr/p/${token}`;

  const greeting = recipientName ? `Bonjour ${recipientName},` : 'Bonjour,';
  const invitationMessage = `${greeting}

Je vous partage un article confidentiel sur A FOLUKU TV :
« ${article.title} »

🔗 Lien d'accès privé :
${privateUrl}

🔑 Votre code de lecture : ${accessCode}

Ce code confidentiel est obligatoire pour déverrouiller la lecture de cet article.
Bonne lecture !`;

  const handleRegenerateCode = async () => {
    try {
      const res = await getFreshRandomCode();
      if (res?.code) {
        setAccessCode(res.code);
      }
    } catch (err) {
      setAccessCode(Math.floor(100000 + Math.random() * 900000).toString());
    }
  };

  const handleSave = async () => {
    if (!accessCode.trim()) {
      setErrorMsg('Veuillez définir un code de lecture.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      const result = await savePrivateShare(article.id, {
        access_code: accessCode.trim(),
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        expiration_days: Number(expirationDays),
        is_private_only: isPrivateOnly,
      });

      if (result.success) {
        setToken(result.token);
        setAccessCode(result.access_code);
        setExpiresAt(result.expires_at);
        setIsEnabled(true);
        setSaveSuccess(true);
        if (onUpdated) {
          onUpdated(result);
        }
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver ce lien privé et son code de lecture ?')) {
      return;
    }

    setIsLoading(true);
    try {
      await revokePrivateShare(article.id);
      setIsEnabled(false);
      setIsPrivateOnly(false);
      if (onUpdated) onUpdated({ enabled: false, is_private_only: false, status: 'published' });
      alert('Lien privé désactivé avec succès.');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Erreur lors de la désactivation.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, typeLabel) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(typeLabel);
    setTimeout(() => setCopyFeedback(''), 2500);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Article confidentiel : ${article.title}`);
    const body = encodeURIComponent(invitationMessage);
    const mailtoUrl = `mailto:${recipientEmail || ''}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
  };

  const handleShareWhatsApp = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(invitationMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* En-tête */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}>
              <i className="fas fa-key"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                Envoyer avec un code de lecture
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                L'article sera accessible uniquement via ce lien privé sécurisé
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Bannière de l'article */}
          <div style={{
            display: 'flex',
            gap: '14px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '10px',
            border: '1px solid #e5e7eb',
            alignItems: 'center',
          }}>
            {article.image_url ? (
              <img
                src={article.image_url}
                alt={article.title}
                style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                <i className="fas fa-newspaper"></i>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase' }}>
                {article.category || 'Article'}
              </span>
              <h4 style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#111827', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {article.title}
              </h4>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                Statut actuel : <strong style={{ color: article.status === 'private' ? '#7e22ce' : (article.status === 'published' ? '#059669' : '#d97706') }}>
                  {article.status === 'private' ? 'Privé (Protégé)' : (article.status === 'published' ? 'En ligne (Public)' : 'Brouillon')}
                </strong>
                {isEnabled && viewsCount > 0 && ` • 👁️ ${viewsCount} lecture(s) privée(s)`}
              </div>
            </div>
          </div>

          {/* Feedback & Alertes */}
          {saveSuccess && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #6ee7b7',
              borderRadius: '8px',
              color: '#065f46',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
              <span>Lien privé et code de lecture activés avec succès ! Prêt à être envoyé.</span>
            </div>
          )}

          {errorMsg && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '13px',
            }}>
              {errorMsg}
            </div>
          )}

          {copyFeedback && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              color: '#1d4ed8',
              fontSize: '12px',
              textAlign: 'center',
              fontWeight: '600',
            }}>
              <i className="fas fa-clipboard-check" style={{ marginRight: '6px' }}></i>
              {copyFeedback} copié dans le presse-papier !
            </div>
          )}

          {/* Configuration : Code et Lien */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}>
            {/* Boîte Code de lecture */}
            <div style={{
              padding: '16px',
              backgroundColor: '#fffbeb',
              border: '2px dashed #fcd34d',
              borderRadius: '12px',
            }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>
                <i className="fas fa-key" style={{ marginRight: '6px' }}></i>
                Code de lecture requis :
              </label>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Ex: 849201"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '18px',
                    fontWeight: '800',
                    color: '#b45309',
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    textAlign: 'center',
                  }}
                />

                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  title="Générer un autre code aléatoire"
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#b45309' }}>
                Ce code devra être saisi par votre lecteur pour accéder au texte.
              </p>
            </div>

            {/* Boîte Lien privé */}
            <div style={{
              padding: '16px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
            }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                <i className="fas fa-link" style={{ marginRight: '6px' }}></i>
                Lien privé sécurisé :
              </label>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={privateUrl}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#4b5563',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                  }}
                />

                <a
                  href={privateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Tester le lien dans un nouvel onglet"
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#4b5563',
                    color: '#fff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <i className="fas fa-external-link-alt"></i>
                </a>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                Lien unique confidentiel non indexé par les moteurs de recherche.
              </p>
            </div>
          </div>

          {/* Options de confidentialité & destinataire */}
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}>
            {/* Toggle Statut Privé Exclusif */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPrivateOnly}
                onChange={(e) => setIsPrivateOnly(e.target.checked)}
                style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#d97706' }}
              />
              <div style={{ fontSize: '13px' }}>
                <strong style={{ color: '#111827' }}>Rendre l'article strictement privé</strong>
                <p style={{ margin: '2px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
                  L'article sera masqué de l'accueil et des rubriques publiques. Il sera accessible <em>uniquement</em> à toute personne détenant le lien et le code.
                </p>
              </div>
            </label>

            {/* Durée de validité */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '4px' }}>
                  Durée de validité du lien :
                </label>
                <select
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                  }}
                >
                  <option value={0}>Illimitée (aucun délai)</option>
                  <option value={1}>24 heures</option>
                  <option value={2}>48 heures</option>
                  <option value={7}>7 jours</option>
                  <option value={30}>30 jours</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '4px' }}>
                  Nom du destinataire (optionnel) :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sophie Martin"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '4px' }}>
                  Email du destinataire (optionnel) :
                </label>
                <input
                  type="email"
                  placeholder="Ex: sophie@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Aperçu du message à envoyer */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                <i className="fas fa-paper-plane" style={{ marginRight: '6px' }}></i>
                Message d'invitation prêt à envoyer :
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => copyToClipboard(invitationMessage, 'Le message complet')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  <i className="fas fa-copy" style={{ marginRight: '4px' }}></i> Copier le message
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(privateUrl, 'Le lien privé')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-link" style={{ marginRight: '4px' }}></i> Lien
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(accessCode, 'Le code')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fas fa-key" style={{ marginRight: '4px' }}></i> Code
                </button>
              </div>
            </div>

            <textarea
              readOnly
              rows={6}
              value={invitationMessage}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '12px',
                fontFamily: 'monospace, sans-serif',
                lineHeight: '1.5',
                color: '#374151',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                boxSizing: 'border-box',
                resize: 'none',
              }}
            />
          </div>

          {/* Envoi direct */}
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#25d366',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <i className="fab fa-whatsapp" style={{ fontSize: '16px' }}></i>
              Envoyer par WhatsApp
            </button>

            <button
              type="button"
              onClick={handleSendEmail}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <i className="fas fa-envelope" style={{ fontSize: '14px' }}></i>
              Envoyer par Email
            </button>
          </div>
        </div>

        {/* Pied de page & validation */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div>
            {isEnabled && (
              <button
                type="button"
                onClick={handleRevoke}
                disabled={isLoading}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="fas fa-trash-alt"></i>
                Désactiver l'accès privé
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(217, 119, 6, 0.2)',
              }}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Enregistrement...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i>
                  {isEnabled ? 'Mettre à jour le code et le lien' : 'Activer le lien privé'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
