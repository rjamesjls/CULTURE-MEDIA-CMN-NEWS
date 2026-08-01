'use client';

import { useState, useEffect } from 'react';
import { generateArticleDraft, adjustArticleDraft, suggestTitles } from './actions';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AIGeneratorClient({ articles = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Etape 1: Brief
  const [subject, setSubject] = useState('');
  const [context, setContext] = useState('');
  const [referenceArticleId, setReferenceArticleId] = useState('');

  useEffect(() => {
    const prefillSubject = searchParams.get('subject');
    if (prefillSubject) {
      setSubject(prefillSubject);
    }
    
    const ideaId = searchParams.get('idea_id');
    if (ideaId) {
      import('../ideas/actions').then(({ getIdeaById }) => {
        getIdeaById(ideaId).then(idea => {
          if (idea) {
            setSubject(idea.title);
            setContext(idea.description || '');
          }
        });
      });
    }
  }, [searchParams]);
  
  // Etat de génération
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Résultat
  const [draft, setDraft] = useState(null); // { title, description, content }
  
  // Ajustement
  const [instruction, setInstruction] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  // Titres alternatifs
  const [suggestedTitles, setSuggestedTitles] = useState([]);
  const [isSuggestingTitles, setIsSuggestingTitles] = useState(false);

  // Publication / Save
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setIsGenerating(true);
    setErrorMsg('');
    
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      if (context) formData.append('context', context);
      if (referenceArticleId) formData.append('referenceArticleId', referenceArticleId);

      const res = await generateArticleDraft(formData);
      if (res.success) {
        setDraft(res.data);
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
    
    setIsGenerating(false);
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!instruction.trim() || !draft) return;

    setIsAdjusting(true);
    setErrorMsg('');

    try {
      const res = await adjustArticleDraft(draft, instruction);
      if (res.success) {
        setDraft(res.data);
        setInstruction(''); // reset
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }

    setIsAdjusting(false);
  };

  const handleSuggestTitles = async () => {
    if (!draft) return;
    setIsSuggestingTitles(true);
    setErrorMsg('');

    try {
      const res = await suggestTitles(draft.content);
      if (res.success) {
        setSuggestedTitles(res.data);
      } else {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err.message);
    }

    setIsSuggestingTitles(false);
  };

  const handleSaveToEditor = () => {
    // On pourrait utiliser un state global ou localStorage pour passer les données à /admin/articles/new
    // Le plus simple: on enregistre les données dans sessionStorage et on redirige
    sessionStorage.setItem('ai_draft', JSON.stringify(draft));
    router.push('/admin/articles/new?from_ai=true');
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      // Import dynamic de saveArticle pour éviter les dépendances circulaires ou server/client issues
      const { saveArticle } = await import('../../actions');
      const formData = new FormData();
      formData.append('title', draft.title);
      formData.append('description', draft.description);
      formData.append('content', draft.content);
      formData.append('status', 'draft');
      formData.append('author', 'IA Assistant');
      
      const res = await saveArticle(formData);
      if (res.success) {
        router.push('/admin/articles');
      }
    } catch (err) {
      setErrorMsg(err.message);
      setIsSaving(false);
    }
  };

  return (
    <div>
      {errorMsg && (
        <div style={{ padding: '15px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '20px' }}>
          {errorMsg}
        </div>
      )}

      {!draft && (
        <form onSubmit={handleGenerate} style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div className="admin-form-group">
            <label className="admin-form-label">Sujet de l'article *</label>
            <input 
              type="text" 
              className="admin-form-control" 
              placeholder="Ex: Le bilan carbone des Jeux Olympiques 2024"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              required
            />
          </div>
          
          <div className="admin-form-group">
            <label className="admin-form-label">Contexte supplémentaire, ton ou informations spécifiques (Optionnel)</label>
            <textarea 
              className="admin-form-control" 
              rows="3"
              placeholder="Ex: Ton formel. Mentionner que l'étude de l'ADEME est sortie la veille. Inclure un appel à l'action à la fin."
              value={context}
              onChange={e => setContext(e.target.value)}
            ></textarea>
          </div>

          {articles && articles.length > 0 && (
            <div className="admin-form-group">
              <label className="admin-form-label">S'inspirer d'un article existant (Optionnel)</label>
              <select 
                className="admin-form-control" 
                value={referenceArticleId}
                onChange={e => setReferenceArticleId(e.target.value)}
              >
                <option value="">-- Aucun article de référence --</option>
                {articles.map(article => (
                  <option key={article.id} value={article.id}>
                    {article.title} {article.status === 'draft' ? '(Brouillon)' : ''}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                L'IA lira le contenu de cet article et s'en servira de base ou de contexte pour rédiger le nouveau.
              </p>
            </div>
          )}

          <button 
            type="submit" 
            className="admin-btn admin-btn-primary"
            disabled={isGenerating}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}
          >
            {isGenerating ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Génération en cours (cela peut prendre jusqu'à 30 secondes)...
              </>
            ) : (
              <>
                <i className="fas fa-magic"></i> Rédiger l'article avec Gemini
              </>
            )}
          </button>
        </form>
      )}

      {draft && (
        <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
          
          {/* Actions Bar */}
          <div style={{ display: 'flex', gap: '10px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <button 
              onClick={handleSaveToEditor}
              className="admin-btn admin-btn-primary"
            >
              <i className="fas fa-edit"></i> Modifier dans l'éditeur
            </button>
            <button 
              onClick={handleSaveDraft}
              className="admin-btn"
              style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
              disabled={isSaving}
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder le brouillon'}
            </button>
            <button 
              onClick={() => setDraft(null)}
              className="admin-btn"
              style={{ marginLeft: 'auto', backgroundColor: '#f3f4f6', color: '#374151' }}
            >
              Recommencer
            </button>
          </div>

          {/* Ajustement Form */}
          <form onSubmit={handleAdjust} style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <label className="admin-form-label" style={{ color: '#1e40af' }}>
              <i className="fas fa-robot"></i> Demander à l'IA d'ajuster ce brouillon
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="admin-form-control" 
                style={{ flex: 1, margin: 0 }}
                placeholder="Ex: Rends l'introduction plus percutante, ou développe la conclusion..."
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                required
              />
              <button 
                type="submit" 
                className="admin-btn admin-btn-primary"
                disabled={isAdjusting}
              >
                {isAdjusting ? <i className="fas fa-spinner fa-spin"></i> : 'Ajuster'}
              </button>
            </div>
            <div style={{ marginTop: '15px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: 'bold' }}>⚡ Actions rapides :</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="admin-btn" 
                  style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '15px' }}
                  onClick={() => setInstruction("Raccourcis cet article pour le rendre plus direct et concis (environ moitié moins long).")}
                >
                  <i className="fas fa-compress-alt"></i> Plus court
                </button>
                <button 
                  type="button" 
                  className="admin-btn" 
                  style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '15px' }}
                  onClick={() => setInstruction("Développe cet article en ajoutant plus de détails, de contexte et d'exemples approfondis.")}
                >
                  <i className="fas fa-expand-alt"></i> Plus long
                </button>
                <button 
                  type="button" 
                  className="admin-btn" 
                  style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '15px' }}
                  onClick={() => setInstruction("Génère un résumé très concis de 3 ou 4 phrases et insère-le tout en haut de l'article (avec la balise <strong>Résumé :</strong>), mais CONSERVE absolument l'intégralité de la version complète de l'article juste en dessous.")}
                >
                  <i className="fas fa-align-left"></i> Résumer
                </button>
                <button 
                  type="button" 
                  className="admin-btn" 
                  style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '15px' }}
                  onClick={() => setInstruction("Ajoute un encadré 'En Bref' avec 3 puces récapitulatives au tout début de l'article.")}
                >
                  <i className="fas fa-list-ul"></i> Ajouter 'En Bref'
                </button>
                <button 
                  type="button" 
                  className="admin-btn" 
                  style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '15px' }}
                  onClick={() => setInstruction("Rends le ton de cet article plus accrocheur, journalistique et percutant.")}
                >
                  <i className="fas fa-bolt"></i> Ton accrocheur
                </button>
                <button 
                  type="button" 
                  className="admin-btn" 
                  style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '15px' }}
                  onClick={() => setInstruction("Réécris l'article avec un ton beaucoup plus formel, neutre et très professionnel (type AFP).")}
                >
                  <i className="fas fa-user-tie"></i> Ton formel
                </button>
                <button 
                  type="button" 
                  className="admin-btn" 
                  style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '15px' }}
                  onClick={() => setInstruction("Améliore la qualité de rédaction, corrige les éventuelles fautes et fluidifie la lecture sans changer le sens.")}
                >
                  <i className="fas fa-spell-check"></i> Parfaire la rédaction
                </button>
              </div>
            </div>
          </form>

          {/* Preview */}
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', padding: '30px' }}>
            <span style={{ display: 'inline-block', backgroundColor: '#10b981', color: 'white', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', marginBottom: '15px' }}>
              Brouillon IA
            </span>
            
            {/* Editable Title Section */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <input 
                  type="text" 
                  value={draft.title} 
                  onChange={(e) => setDraft({...draft, title: e.target.value})}
                  style={{ 
                    fontFamily: 'var(--font-heading)', 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    border: '1px dashed #d1d5db', 
                    borderRadius: '4px',
                    padding: '5px 10px',
                    width: '100%',
                    marginRight: '15px',
                    backgroundColor: '#f9fafb'
                  }}
                  title="Vous pouvez modifier ce titre librement"
                />
                <button 
                  onClick={handleSuggestTitles}
                  disabled={isSuggestingTitles}
                  className="admin-btn"
                  style={{ backgroundColor: '#10b981', color: 'white', whiteSpace: 'nowrap' }}
                >
                  {isSuggestingTitles ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-lightbulb"></i>} Suggérer des titres
                </button>
              </div>
              
              {/* Suggestions de titres */}
              {suggestedTitles.length > 0 && (
                <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '20px' }}>
                  <p style={{ fontSize: '14px', color: '#166534', marginBottom: '10px', fontWeight: 'bold' }}>
                    💡 Cliquez sur un titre pour le sélectionner :
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {suggestedTitles.map((t, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          setDraft({...draft, title: t});
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          backgroundColor: 'white',
                          border: '1px solid #d1fae5',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '15px',
                          color: '#065f46',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#d1fae5'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <p style={{ fontSize: '18px', color: '#4b5563', fontStyle: 'italic', borderLeft: '4px solid #e5e7eb', paddingLeft: '15px', marginBottom: '30px' }}>
              {draft.description}
            </p>

            <div 
              style={{ fontSize: '16px', lineHeight: '1.7', color: '#111827' }}
              dangerouslySetInnerHTML={{ __html: draft.content }}
            />
          </div>
          
        </div>
      )}
    </div>
  );
}
