'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInterviewCampaign, generateInterviewQuestions } from '../actions';
import SpeechButton from '@/components/SpeechButton';

const SECTION_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function NewInterviewClient() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState([
    { section: 'Parcours personnel', questions: [''] }
  ]);

  // AI states
  const [aiBrief, setAiBrief] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- Section management ---
  const addSection = () => {
    setSections([...sections, { section: '', questions: [''] }]);
  };

  const removeSection = (sIdx) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== sIdx));
  };

  const updateSectionName = (sIdx, name) => {
    const updated = [...sections];
    updated[sIdx] = { ...updated[sIdx], section: name };
    setSections(updated);
  };

  // --- Question management ---
  const addQuestion = (sIdx) => {
    const updated = [...sections];
    updated[sIdx] = { ...updated[sIdx], questions: [...updated[sIdx].questions, ''] };
    setSections(updated);
  };

  const removeQuestion = (sIdx, qIdx) => {
    const updated = [...sections];
    const qs = updated[sIdx].questions.filter((_, i) => i !== qIdx);
    updated[sIdx] = { ...updated[sIdx], questions: qs.length > 0 ? qs : [''] };
    setSections(updated);
  };

  const updateQuestion = (sIdx, qIdx, value) => {
    const updated = [...sections];
    const qs = [...updated[sIdx].questions];
    qs[qIdx] = value;
    updated[sIdx] = { ...updated[sIdx], questions: qs };
    setSections(updated);
  };

  // --- AI Generation ---
  const handleGenerateAI = async () => {
    if (!aiBrief.trim()) {
      setAiError("Décrivez le profil de la personne et ce que vous souhaitez savoir.");
      return;
    }

    if (sections.some(s => s.questions.some(q => q.trim()))) {
      if (!window.confirm("L'IA va remplacer toutes les sections et questions existantes. Continuer ?")) return;
    }

    setIsGenerating(true);
    setAiError('');

    try {
      const result = await generateInterviewQuestions(aiBrief);
      if (result.success && result.data) {
        setSections(result.data);
      } else {
        setAiError(result.error || "Erreur lors de la génération.");
      }
    } catch (err) {
      setAiError("Une erreur inattendue est survenue.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Submit ---
  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMsg("Le titre de l'interview est requis.");
      return;
    }

    // Clean up empty questions
    const cleanSections = sections
      .filter(s => s.section.trim())
      .map(s => ({
        ...s,
        questions: s.questions.filter(q => q.trim())
      }))
      .filter(s => s.questions.length > 0);

    if (cleanSections.length === 0) {
      setErrorMsg("Ajoutez au moins une section avec une question.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await createInterviewCampaign({ title, description, sections: cleanSections });

    if (res.success) {
      router.push('/admin/interviews');
    } else {
      setErrorMsg(res.error);
      setIsSubmitting(false);
    }
  };

  // --- Count totals ---
  const totalQuestions = sections.reduce((acc, s) => acc + s.questions.filter(q => q.trim()).length, 0);

  return (
    <div className="admin-content-card">
      <div className="admin-header">
        <h1 className="admin-title"><i className="fas fa-microphone-alt" style={{ color: 'var(--color-primary)' }}></i> Créer une Interview</h1>
      </div>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: '20px' }}>

        {/* === LEFT: Builder === */}
        <div style={{ flex: '1 1 500px', minWidth: 0 }}>

          {/* AI Block */}
          <div style={{ marginBottom: '25px', backgroundColor: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#a21caf', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-magic"></i> Assistant IA — Génération des questions
            </h3>
            {aiError && (
              <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '12px', fontSize: '13px' }}>
                {aiError}
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <textarea
                className="admin-form-control"
                value={aiBrief}
                onChange={(e) => setAiBrief(e.target.value)}
                rows="4"
                placeholder="Décrivez le profil de la personne et ce que vous souhaitez savoir. Ex: « Interview d'un chef d'entreprise dans le secteur tech en Martinique. Je veux connaître son parcours, sa vision du marché local, ses projets futurs et un message pour la jeunesse. »"
                style={{ borderColor: '#e879f9', paddingRight: '50px' }}
              />
              <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                <SpeechButton onTranscript={(text) => setAiBrief(prev => prev ? prev + ' ' + text : text)} />
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="admin-btn"
              style={{ backgroundColor: '#a21caf', color: '#fff', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: isGenerating ? 0.7 : 1 }}
            >
              {isGenerating ? (
                <><i className="fas fa-spinner fa-spin"></i> Génération en cours...</>
              ) : (
                <><i className="fas fa-magic"></i> Générer les sections & questions</>
              )}
            </button>
          </div>

          {/* Title & Description */}
          <div className="admin-form-group">
            <label className="admin-form-label">Titre de l'interview *</label>
            <input type="text" className="admin-form-control" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Interview Exclusive de M. le Maire" />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Message d'accueil (affiché à l'invité)</label>
            <textarea className="admin-form-control" value={description} onChange={(e) => setDescription(e.target.value)} rows="2" placeholder="Texte chaleureux pour accueillir votre invité..." />
          </div>

          {/* Sections Builder */}
          <div style={{ marginTop: '25px' }}>
            <h3 style={{ fontSize: '16px', color: '#111827', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><i className="fas fa-layer-group"></i> Sections thématiques ({sections.length})</span>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{totalQuestions} question{totalQuestions > 1 ? 's' : ''}</span>
            </h3>

            {sections.map((sec, sIdx) => (
              <div key={sIdx} style={{
                marginBottom: '20px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                overflow: 'hidden',
                borderLeft: `4px solid ${SECTION_COLORS[sIdx % SECTION_COLORS.length]}`
              }}>
                {/* Section header */}
                <div style={{ backgroundColor: '#f9fafb', padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: SECTION_COLORS[sIdx % SECTION_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>
                    {sIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={sec.section}
                    onChange={(e) => updateSectionName(sIdx, e.target.value)}
                    placeholder="Nom de la thématique (ex: Parcours personnel)"
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '15px', fontWeight: '600' }}
                  />
                  {sections.length > 1 && (
                    <button onClick={() => removeSection(sIdx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', padding: '5px' }} title="Supprimer cette section">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  )}
                </div>

                {/* Questions */}
                <div style={{ padding: '15px' }}>
                  {sec.questions.map((q, qIdx) => (
                    <div key={qIdx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '13px', marginTop: '10px', flexShrink: 0, width: '30px', textAlign: 'right' }}>Q{qIdx + 1}</span>
                      <textarea
                        value={q}
                        onChange={(e) => updateQuestion(sIdx, qIdx, e.target.value)}
                        placeholder="Votre question ici..."
                        rows="2"
                        style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                      />
                      <button onClick={() => removeQuestion(sIdx, qIdx)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: '14px', marginTop: '8px' }} title="Supprimer">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                  <button onClick={() => addQuestion(sIdx)} style={{ background: 'none', border: '1px dashed #d1d5db', borderRadius: '6px', padding: '8px 15px', color: '#6b7280', cursor: 'pointer', fontSize: '13px', width: '100%', marginTop: '5px' }}>
                    <i className="fas fa-plus"></i> Ajouter une question
                  </button>
                </div>
              </div>
            ))}

            <button onClick={addSection} style={{ border: '2px dashed #d1d5db', borderRadius: '10px', padding: '15px', color: '#6b7280', cursor: 'pointer', fontSize: '14px', width: '100%', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <i className="fas fa-plus-circle"></i> Ajouter une section thématique
            </button>
          </div>

          {/* Submit */}
          {errorMsg && (
            <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginTop: '20px', fontSize: '14px' }}>
              {errorMsg}
            </div>
          )}
          <div style={{ display: 'flex', gap: '15px', marginTop: '25px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="admin-btn admin-btn-primary"
              style={{ flex: 1 }}
            >
              {isSubmitting ? <><i className="fas fa-spinner fa-spin"></i> Création...</> : <><i className="fas fa-check"></i> Créer la campagne et générer le lien</>}
            </button>
            <button onClick={() => router.push('/admin/interviews')} className="admin-btn" style={{ backgroundColor: '#e5e7eb', color: '#374151' }}>
              Annuler
            </button>
          </div>
        </div>

        {/* === RIGHT: Live Preview === */}
        <div style={{ flex: '1 1 400px', position: 'sticky', top: '20px', minWidth: 0 }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '15px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-eye"></i> Aperçu en temps réel (Vue invité)
          </h3>

          <div style={{ backgroundColor: '#f3f4f6', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            {/* Header preview */}
            <div style={{ backgroundColor: 'var(--color-primary, #b91c1c)', color: '#fff', padding: '30px 20px', textAlign: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontFamily: 'var(--font-heading, serif)' }}>
                {title || "Titre de l'interview..."}
              </h2>
              {description && (
                <p style={{ marginTop: '10px', fontSize: '14px', opacity: 0.9 }}>{description}</p>
              )}
            </div>

            <div style={{ padding: '20px', backgroundColor: '#fff' }}>
              {/* Info fields preview */}
              <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Informations personnelles</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ height: '36px', backgroundColor: '#f3f4f6', borderRadius: '4px', border: '1px solid #e5e7eb' }}></div>
                  <div style={{ height: '36px', backgroundColor: '#f3f4f6', borderRadius: '4px', border: '1px solid #e5e7eb' }}></div>
                </div>
              </div>

              {/* Sections preview */}
              {sections.filter(s => s.section.trim() || s.questions.some(q => q.trim())).map((sec, sIdx) => (
                <div key={sIdx} style={{ marginBottom: '20px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
                    padding: '8px 12px', backgroundColor: `${SECTION_COLORS[sIdx % SECTION_COLORS.length]}10`,
                    borderRadius: '6px', borderLeft: `3px solid ${SECTION_COLORS[sIdx % SECTION_COLORS.length]}`
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: SECTION_COLORS[sIdx % SECTION_COLORS.length] }}>
                      {sec.section || `Section ${sIdx + 1}`}
                    </span>
                  </div>

                  {sec.questions.filter(q => q.trim()).map((q, qIdx) => (
                    <div key={qIdx} style={{ marginBottom: '12px', paddingLeft: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                        <span style={{ color: SECTION_COLORS[sIdx % SECTION_COLORS.length], marginRight: '6px' }}>Q{qIdx + 1}.</span>
                        {q}
                      </div>
                      <div style={{ height: '50px', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}></div>
                    </div>
                  ))}
                </div>
              ))}

              {totalQuestions === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: '14px' }}>
                  <i className="fas fa-pen-alt" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                  <div>Ajoutez des questions pour voir l'aperçu</div>
                </div>
              )}

              {/* Fake submit button */}
              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <div style={{ display: 'inline-block', padding: '10px 30px', backgroundColor: 'var(--color-primary, #b91c1c)', color: '#fff', borderRadius: '20px', fontSize: '14px', opacity: 0.5 }}>
                  <i className="fas fa-paper-plane"></i> Soumettre mes réponses
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
