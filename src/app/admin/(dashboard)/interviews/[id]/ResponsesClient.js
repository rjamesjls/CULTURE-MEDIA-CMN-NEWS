'use client';

import { useRouter } from 'next/navigation';

const SECTION_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function ResponsesClient({ campaign, responses }) {
  const router = useRouter();

  // Normalize: support both old flat and new sections format
  const rawQuestions = campaign.questions || [];
  const isNewFormat = rawQuestions.length > 0 && typeof rawQuestions[0] === 'object' && rawQuestions[0].section;
  
  const sections = isNewFormat
    ? rawQuestions
    : [{ section: "Questions", questions: rawQuestions }];

  // Build a flat list of all questions for index mapping
  const flatQuestions = [];
  sections.forEach(sec => {
    sec.questions.forEach(q => {
      flatQuestions.push({ section: sec.section, question: q });
    });
  });

  const handleGenerateArticle = (response) => {
    let context = `Voici une interview de ${response.interviewee_name} intitulée "${campaign.title}". Utilise ces réponses pour rédiger un article captivant, structuré par thématiques.\n\n`;
    
    flatQuestions.forEach((item, idx) => {
      const answer = response.answers[idx];
      if (answer) {
        context += `[${item.section}]\nQuestion : ${item.question}\nRéponse : ${answer}\n\n`;
      }
    });

    const aiDraft = {
      title: `Interview : ${response.interviewee_name}`,
      description: `Découvrez notre interview exclusive avec ${response.interviewee_name}.`,
      aiContext: context
    };
    
    sessionStorage.setItem('ai_draft', JSON.stringify(aiDraft));
    router.push('/admin/articles/new');
  };

  if (responses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
        <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '15px' }}></i>
        <h3 style={{ margin: 0, color: '#374151', fontSize: '18px' }}>Aucune réponse pour le moment</h3>
        <p style={{ color: '#6b7280', marginTop: '10px' }}>Partagez le lien de cette campagne pour commencer à recevoir des réponses.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {responses.map((resp) => {
        let globalIdx = 0;

        return (
          <div key={resp.id} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            {/* Header */}
            <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {resp.photo_url ? (
                  <img src={resp.photo_url} alt={resp.interviewee_name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                    {resp.interviewee_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>{resp.interviewee_name}</h3>
                  <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                    {resp.interviewee_email && <span style={{ marginRight: '10px' }}><i className="fas fa-envelope"></i> {resp.interviewee_email}</span>}
                    <span><i className="far fa-clock"></i> {new Date(resp.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => handleGenerateArticle(resp)}
                className="admin-btn"
                style={{ backgroundColor: '#a21caf', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <i className="fas fa-magic"></i> Rédiger un article (IA)
              </button>
            </div>
            
            {/* Answers by section */}
            <div style={{ padding: '20px' }}>
              {sections.map((sec, sIdx) => {
                const sectionColor = SECTION_COLORS[sIdx % SECTION_COLORS.length];
                const sectionQuestions = sec.questions;

                return (
                  <div key={sIdx} style={{ marginBottom: '25px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 14px', marginBottom: '15px',
                      backgroundColor: `${sectionColor}08`,
                      borderRadius: '6px',
                      borderLeft: `3px solid ${sectionColor}`
                    }}>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: sectionColor }}>
                        {sec.section}
                      </span>
                    </div>

                    {sectionQuestions.map((q, qIdx) => {
                      const currentGlobalIdx = globalIdx++;
                      const answerText = resp.answers && resp.answers[currentGlobalIdx];
                      const voiceUrl = resp.voice_urls && resp.voice_urls[currentGlobalIdx];
                      const files = resp.file_urls && resp.file_urls[currentGlobalIdx];

                      if (!answerText && !voiceUrl && (!files || files.length === 0)) { return null; }

                      return (
                        <div key={qIdx} style={{ marginBottom: '15px' }}>
                          <div style={{ fontWeight: '600', color: '#374151', marginBottom: '8px', fontSize: '14px' }}>
                            <span style={{ color: sectionColor, marginRight: '8px' }}>Q{qIdx + 1}.</span> {q}
                          </div>
                          <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', fontSize: '14px' }}>
                            {answerText && (
                              <div style={{ color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: voiceUrl || (files && files.length > 0) ? '15px' : '0' }}>
                                {answerText}
                              </div>
                            )}
                            
                            {voiceUrl && (
                              <div style={{ marginBottom: files && files.length > 0 ? '12px' : '0' }}>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}><i className="fas fa-microphone"></i> Message vocal</div>
                                <audio src={voiceUrl} controls style={{ height: '36px', maxWidth: '100%' }} />
                              </div>
                            )}

                            {files && files.length > 0 && (
                              <div>
                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}><i className="fas fa-paperclip"></i> Pièces jointes</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {files.map((file, fIdx) => (
                                    <a key={fIdx} href={file.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff', color: '#1e40af', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', border: '1px solid #d1d5db', textDecoration: 'none', transition: 'background 0.2s' }}>
                                      <i className={file.type.includes('pdf') ? 'fas fa-file-pdf' : file.type.includes('image') ? 'fas fa-image' : 'fas fa-file'}></i>
                                      <span style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
