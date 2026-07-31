'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toggleCampaignStatus, deleteCampaign } from './actions';

export default function InterviewsClient({ initialCampaigns }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);

  const handleToggle = async (id, currentStatus) => {
    const res = await toggleCampaignStatus(id, currentStatus);
    if (res.success) {
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
    } else {
      alert("Erreur: " + res.error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette campagne et toutes ses réponses ?")) return;
    const res = await deleteCampaign(id);
    if (res.success) {
      setCampaigns(campaigns.filter(c => c.id !== id));
    } else {
      alert("Erreur: " + res.error);
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/interview/${token}`;
    navigator.clipboard.writeText(url);
    alert('Lien copié dans le presse-papier !');
  };

  // Count total questions across sections
  const countQuestions = (questions) => {
    if (!questions || !Array.isArray(questions)) return 0;
    // New format: array of { section, questions }
    if (questions[0] && typeof questions[0] === 'object' && questions[0].questions) {
      return questions.reduce((acc, s) => acc + (s.questions?.length || 0), 0);
    }
    // Old format: flat array of strings
    return questions.length;
  };

  const countSections = (questions) => {
    if (!questions || !Array.isArray(questions)) return 0;
    if (questions[0] && typeof questions[0] === 'object' && questions[0].section) {
      return questions.length;
    }
    return 1; // old format = 1 implicit section
  };

  return (
    <div className="admin-content-card">
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="admin-title"><i className="fas fa-microphone-alt" style={{ color: 'var(--color-primary)' }}></i> Campagnes d'Interviews</h1>
        <Link href="/admin/interviews/new" className="admin-btn admin-btn-primary">
          <i className="fas fa-plus"></i> Nouvelle Campagne
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
          <i className="fas fa-microphone-alt" style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '15px' }}></i>
          <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>Aucune campagne d'interview</h3>
          <p>Créez votre première campagne pour commencer à interviewer !</p>
          <Link href="/admin/interviews/new" className="admin-btn admin-btn-primary" style={{ marginTop: '15px', display: 'inline-flex' }}>
            <i className="fas fa-plus"></i> Créer ma première campagne
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {campaigns.map((camp) => (
            <div key={camp.id} style={{ 
              backgroundColor: '#fff', 
              borderRadius: '10px', 
              border: '1px solid #e5e7eb',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'box-shadow 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>{camp.title}</h3>
                <span className={`admin-badge ${camp.is_active ? 'admin-badge-success' : 'admin-badge-warning'}`}>
                  {camp.is_active ? 'Active' : 'Fermée'}
                </span>
              </div>
              
              <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '15px', flexGrow: 1 }}>
                {camp.description?.substring(0, 100) || 'Aucune description'}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: '#6b7280', fontSize: '13px', flexWrap: 'wrap' }}>
                <span><i className="fas fa-layer-group"></i> {countSections(camp.questions)} section{countSections(camp.questions) > 1 ? 's' : ''}</span>
                <span>•</span>
                <span><i className="fas fa-list-ol"></i> {countQuestions(camp.questions)} question{countQuestions(camp.questions) > 1 ? 's' : ''}</span>
                <span>•</span>
                <span><i className="fas fa-reply"></i> {camp.interview_responses?.[0]?.count || 0} réponse{(camp.interview_responses?.[0]?.count || 0) > 1 ? 's' : ''}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link href={`/admin/interviews/${camp.id}`} className="admin-btn admin-btn-primary" style={{ flexGrow: 1, textAlign: 'center' }}>
                  <i className="fas fa-eye"></i> Voir réponses
                </Link>
                <button onClick={() => copyLink(camp.token)} className="admin-btn" style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }} title="Copier le lien public">
                  <i className="fas fa-link"></i>
                </button>
                <button onClick={() => handleToggle(camp.id, camp.is_active)} className="admin-btn" style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }} title={camp.is_active ? "Fermer" : "Ouvrir"}>
                  <i className={camp.is_active ? "fas fa-lock" : "fas fa-lock-open"}></i>
                </button>
                <button onClick={() => handleDelete(camp.id)} className="admin-btn" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }} title="Supprimer">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
