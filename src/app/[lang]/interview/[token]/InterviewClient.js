'use client';

import { useState, useRef } from 'react';
import { submitInterviewResponse } from '../actions';
import Link from 'next/link';
import VoiceRecorder from '@/components/VoiceRecorder';

const SECTION_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function InterviewClient({ campaign }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Voice recordings & file attachments keyed by global question index
  const [voiceFiles, setVoiceFiles] = useState({});
  const [attachedFiles, setAttachedFiles] = useState({});

  // Normalize data
  const rawQuestions = campaign.questions || [];
  const isNewFormat = rawQuestions.length > 0 && typeof rawQuestions[0] === 'object' && rawQuestions[0].section;
  const sections = isNewFormat
    ? rawQuestions
    : [{ section: "Questions", questions: rawQuestions }];

  const handleVoiceRecorded = (globalIdx, file) => {
    setVoiceFiles(prev => {
      const updated = { ...prev };
      if (file) { updated[globalIdx] = file; }
      else { delete updated[globalIdx]; }
      return updated;
    });
  };

  const handleFileAttach = (globalIdx, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setAttachedFiles(prev => ({
        ...prev,
        [globalIdx]: [...(prev[globalIdx] || []), ...files]
      }));
    }
  };

  const removeAttachedFile = (globalIdx, fileIdx) => {
    setAttachedFiles(prev => {
      const updated = { ...prev };
      updated[globalIdx] = updated[globalIdx].filter((_, i) => i !== fileIdx);
      if (updated[globalIdx].length === 0) delete updated[globalIdx];
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const formData = new FormData(e.target);
    formData.append('campaignId', campaign.id);

    // Append voice files
    Object.entries(voiceFiles).forEach(([idx, file]) => {
      formData.append(`voice_${idx}`, file);
    });

    // Append attached files
    Object.entries(attachedFiles).forEach(([idx, files]) => {
      files.forEach(file => {
        formData.append(`file_${idx}`, file);
      });
    });

    const result = await submitInterviewResponse(formData);
    
    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
    } else {
      setErrorMsg(result.error || "Une erreur est survenue lors de l'envoi de vos réponses.");
    }
  };

  if (isSuccess) {
    return (
      <div style={{ maxWidth: '600px', margin: '100px auto', padding: '40px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
        <i className="fas fa-check-circle" style={{ fontSize: '64px', color: '#10b981', marginBottom: '20px' }}></i>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-dark)', marginBottom: '15px' }}>Merci pour vos réponses !</h1>
        <p style={{ color: '#4b5563', fontSize: '1.1rem', marginBottom: '30px' }}>
          Vos réponses ont bien été transmises à la rédaction de A FOLUKU TV.
        </p>
        <Link href="/" className="btn btn-primary">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  let globalQIdx = 0;

  return (
    <div style={{ maxWidth: '800px', margin: '80px auto', padding: '20px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ backgroundColor: 'var(--color-primary)', color: '#fff', padding: '40px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '2.5rem' }}>{campaign.title}</h1>
          {campaign.description && (
            <p style={{ marginTop: '15px', fontSize: '1.1rem', opacity: 0.9 }}>{campaign.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '40px' }}>
          {errorMsg && (
            <div style={{ padding: '15px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '30px' }}>
              <i className="fas fa-exclamation-triangle"></i> {errorMsg}
            </div>
          )}

          <div style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-dark)', marginBottom: '20px' }}>Informations personnelles</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Votre nom complet *</label>
                <input type="text" name="name" required style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Adresse email</label>
                <input type="email" name="email" style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem' }} />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Photo de vous (Optionnel)</label>
              <input type="file" name="photo" accept="image/*" style={{ width: '100%', padding: '10px', border: '1px dashed #d1d5db', borderRadius: '6px', backgroundColor: '#f9fafb' }} />
            </div>
          </div>

          {/* Info bar */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', padding: '12px 16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#1e40af', flexWrap: 'wrap' }}>
            <span><i className="fas fa-info-circle"></i> Pour chaque question, vous pouvez :</span>
            <span><i className="fas fa-keyboard"></i> Écrire votre réponse</span>
            <span><i className="fas fa-microphone"></i> Enregistrer un vocal</span>
            <span><i className="fas fa-paperclip"></i> Joindre un fichier</span>
          </div>

          {/* Sections */}
          {sections.map((sec, sIdx) => {
            const sectionColor = SECTION_COLORS[sIdx % SECTION_COLORS.length];
            
            return (
              <div key={sIdx} style={{ marginBottom: '35px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', marginBottom: '20px',
                  backgroundColor: `${sectionColor}08`,
                  borderRadius: '8px',
                  borderLeft: `4px solid ${sectionColor}`
                }}>
                  <span style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: sectionColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>
                    {sIdx + 1}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#111827', fontFamily: 'var(--font-heading)' }}>{sec.section}</h3>
                </div>

                {sec.questions.map((question, qIdx) => {
                  const currentGlobalIdx = globalQIdx++;
                  return (
                    <div key={qIdx} style={{ marginBottom: '25px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', borderLeft: `3px solid ${sectionColor}40` }}>
                      <label style={{ display: 'block', marginBottom: '15px', fontWeight: '600', color: '#111827', fontSize: '1.05rem' }}>
                        <span style={{ color: sectionColor, marginRight: '10px' }}>Q{qIdx + 1}.</span>
                        {question}
                      </label>
                      
                      {/* Text answer */}
                      <textarea 
                        name={`question_${currentGlobalIdx}`}
                        rows="4"
                        placeholder="Votre réponse écrite ici..."
                        style={{ width: '100%', padding: '15px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem', resize: 'vertical', marginBottom: '12px' }}
                      ></textarea>

                      {/* Voice + File row */}
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Voice recorder */}
                        <VoiceRecorder 
                          onRecorded={(file) => handleVoiceRecorded(currentGlobalIdx, file)}
                        />

                        <div style={{ width: '1px', height: '28px', backgroundColor: '#d1d5db' }}></div>

                        {/* File attachment */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#6b7280', padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff' }}>
                          <i className="fas fa-paperclip"></i> Joindre un fichier
                          <input 
                            type="file"
                            multiple
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileAttach(currentGlobalIdx, e)}
                          />
                        </label>
                      </div>

                      {/* Attached files list */}
                      {attachedFiles[currentGlobalIdx] && attachedFiles[currentGlobalIdx].length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {attachedFiles[currentGlobalIdx].map((file, fIdx) => (
                            <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#eff6ff', color: '#1e40af', padding: '4px 10px', borderRadius: '15px', fontSize: '12px', border: '1px solid #bfdbfe' }}>
                              <i className={file.type.includes('pdf') ? 'fas fa-file-pdf' : file.type.includes('image') ? 'fas fa-image' : 'fas fa-file'}></i>
                              <span style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                              <i className="fas fa-times" style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => removeAttachedFile(currentGlobalIdx, fIdx)}></i>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '15px 40px', fontSize: '1.1rem', borderRadius: '30px', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin"></i> Envoi en cours...</>
              ) : (
                <><i className="fas fa-paper-plane"></i> Soumettre mes réponses</>
              )}
            </button>
            <p style={{ marginTop: '15px', fontSize: '0.9rem', color: '#6b7280' }}>
              En soumettant ce formulaire, vous autorisez A FOLUKU TV à utiliser vos réponses pour la rédaction d'un article.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
