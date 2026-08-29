'use client';

import { useState } from 'react';
import Link from 'next/link';
import ArticleList from './ArticleList';

export default function NewsroomClient({ articles, categories, ideas, profile }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard or articles
  const [filterMode, setFilterMode] = useState(null);

  // Computations
  const urgences = articles.filter(a => a.is_urgent);
  const brouillons = articles.filter(a => a.status === 'draft');
  const publications = articles.filter(a => a.status === 'published');
  const validations = articles.filter(a => a.status === 'pending');
  const activeIdeas = ideas.filter(i => i.status !== 'published');

  const aiJournalists = [
    { name: "Traducteur Bushinengué", role: "Traduction", icon: "fa-language", color: "#8b5cf6", bgColor: "#f3e8ff", link: "/admin/articles" },
    { name: "Social Media Manager", role: "Création de posts", icon: "fa-hashtag", color: "#ec4899", bgColor: "#fdf2f8", link: "/admin/articles" },
    { name: "Générateur Audio/Vidéo", role: "Scripts & Podcasts", icon: "fa-microphone-alt", color: "#10b981", bgColor: "#ecfdf5", link: "/admin/ai-studio" }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 5px 0', fontSize: '28px', color: '#111827' }}>
            <i className="fas fa-newspaper" style={{ color: '#8b5cf6', marginRight: '10px' }}></i>
            Newsroom
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>
            La salle de rédaction centrale de A FOLUKU TV.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="admin-btn"
            style={{ 
              backgroundColor: activeTab === 'dashboard' ? '#111827' : '#f3f4f6', 
              color: activeTab === 'dashboard' ? '#fff' : '#374151',
              border: 'none',
              fontWeight: '500'
            }}
          >
            <i className="fas fa-th-large"></i> Vue Globale
          </button>
          <button 
            onClick={() => { setActiveTab('articles'); setFilterMode(null); }}
            className="admin-btn"
            style={{ 
              backgroundColor: activeTab === 'articles' ? '#111827' : '#f3f4f6', 
              color: activeTab === 'articles' ? '#fff' : '#374151',
              border: 'none',
              fontWeight: '500'
            }}
          >
            <i className="fas fa-list"></i> Tous les articles
          </button>
          <Link href="/admin/articles/new" className="admin-btn admin-btn-primary">
            <i className="fas fa-plus"></i> Nouvel Article
          </Link>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* STATS RAPIDES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setActiveTab('articles'); setFilterMode('urgent'); }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', marginBottom: '5px' }}>Urgences</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{urgences.length}</div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <i className="fas fa-siren-on"></i>
              </div>
            </div>
            
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', borderLeft: '4px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setActiveTab('articles'); setFilterMode('draft'); }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', marginBottom: '5px' }}>Brouillons</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{brouillons.length}</div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <i className="fas fa-pencil-ruler"></i>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', borderLeft: '4px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setActiveTab('articles'); setFilterMode('pending'); }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', marginBottom: '5px' }}>À Valider</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{validations.length}</div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <i className="fas fa-clipboard-check"></i>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', borderLeft: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => { setActiveTab('articles'); setFilterMode('published'); }}>
              <div>
                <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500', marginBottom: '5px' }}>Publications</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{publications.length}</div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <i className="fas fa-check-circle"></i>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {/* WIDGET SUJETS */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-lightbulb" style={{ color: '#f59e0b' }}></i> Sujets du moment
                </h3>
                <Link href="/admin/ideas" style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                  Voir tous
                </Link>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeIdeas.slice(0, 5).map(idea => (
                  <div key={idea.id} style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#111827', fontSize: '14px', marginBottom: '3px' }}>{idea.title}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        <span style={{ backgroundColor: '#e5e7eb', padding: '2px 6px', borderRadius: '4px', marginRight: '6px', fontSize: '10px', textTransform: 'uppercase' }}>{idea.category}</span>
                        Soumis par {idea.submitted_by}
                      </div>
                    </div>
                    <Link href={`/admin/ideas`} className="btn-icon" style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', textDecoration: 'none' }}>
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                ))}
                {activeIdeas.length === 0 && (
                  <div style={{ color: '#9ca3af', fontSize: '14px', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                    Aucun sujet en cours.
                  </div>
                )}
              </div>
            </div>

            {/* WIDGET JOURNALISTES IA */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-robot" style={{ color: '#8b5cf6' }}></i> Journalistes IA
                </h3>
                <Link href="/admin/ai-studio" style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>
                  AI Studio
                </Link>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {aiJournalists.map((bot, idx) => (
                  <Link key={idx} href={bot.link} style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none', padding: '10px', borderRadius: '8px', transition: 'background-color 0.2s', backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: bot.bgColor, color: bot.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      <i className={`fas ${bot.icon}`}></i>
                    </div>
                    <div>
                      <div style={{ color: '#111827', fontWeight: '600', fontSize: '14px' }}>{bot.name}</div>
                      <div style={{ color: '#6b7280', fontSize: '12px' }}>{bot.role}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', color: '#10b981', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', textTransform: 'uppercase' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                      Actif
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* DERNIERS BROUILLONS & URGENCES */}
          <div>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-clock" style={{ color: '#6b7280' }}></i> Activité récente (Urgences & Brouillons)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {[...urgences, ...brouillons, ...validations].slice(0, 4).map((article, idx) => (
                <div key={`${article.id}-${idx}`} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '120px', backgroundColor: '#f3f4f6', backgroundImage: article.image_url ? `url(${article.image_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    {article.is_urgent && (
                      <span className="admin-badge badge-red" style={{ position: 'absolute', top: '8px', left: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <i className="fas fa-siren-on" style={{ marginRight: '4px' }}></i> Urgent
                      </span>
                    )}
                    {!article.is_urgent && (
                      <span className={`admin-badge ${article.status === 'draft' ? 'badge-yellow' : 'badge-orange'}`} style={{ position: 'absolute', top: '8px', left: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {article.status === 'draft' ? 'Brouillon' : 'En attente'}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', lineHeight: '1.4', color: '#111827' }}>{article.title}</h4>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        <i className="fas fa-user" style={{ marginRight: '4px' }}></i> {article.author}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/fr/article/${article.slug}`} target="_blank" className="admin-btn" style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#e0e7ff', color: '#4f46e5', textDecoration: 'none' }}>
                          <i className="fas fa-eye"></i>
                        </Link>
                        <Link href={`/admin/articles/edit/${article.id}`} className="admin-btn" style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#374151', textDecoration: 'none' }}>
                          Reprendre <i className="fas fa-arrow-right" style={{ marginLeft: '4px' }}></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {[...urgences, ...brouillons, ...validations].length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', border: '1px dashed #d1d5db', borderRadius: '8px' }}>
                  Aucune activité récente.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'articles' && (
        <div style={{ marginTop: '20px' }}>
          {filterMode && (
            <div style={{ marginBottom: '15px', padding: '10px 15px', backgroundColor: '#eef2ff', borderRadius: '8px', color: '#4f46e5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-filter"></i> Vue filtrée : 
              <strong>
                {filterMode === 'urgent' && 'Urgences'}
                {filterMode === 'draft' && 'Brouillons'}
                {filterMode === 'pending' && 'À Valider'}
                {filterMode === 'published' && 'Publications'}
              </strong>
              <button onClick={() => setFilterMode(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>Effacer le filtre</button>
            </div>
          )}
          <ArticleList 
            initialArticles={(filterMode ? articles.filter(a => {
              if (filterMode === 'urgent') return a.is_urgent;
              return a.status === filterMode;
            }) : articles) || []} 
            categories={categories || []} 
          />
        </div>
      )}
    </div>
  );
}
