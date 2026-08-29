'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const [followerCount, setFollowerCount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('key', 'total_followers')
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setFollowerCount(data.value.replace(/"/g, ''));
        } else {
          setFollowerCount('6000+ followers');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [supabase]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'total_followers', 
          value: JSON.stringify(followerCount),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setMessage('Paramètres mis à jour avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-page"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Paramètres Globaux</h1>
      </div>

      <div className="admin-card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group">
            <label htmlFor="followerCount">Nombre total de followers (affiché sur le magazine)</label>
            <input
              type="text"
              id="followerCount"
              value={followerCount}
              onChange={(e) => setFollowerCount(e.target.value)}
              className="form-control"
              placeholder="Ex: 6000+ followers"
              required
            />
            <small style={{ color: '#94a3b8', marginTop: '5px', display: 'block' }}>
              Ce texte apparaîtra dans la bannière sociale en haut des magazines.
            </small>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              type="submit" 
              className="admin-btn-primary"
              disabled={saving}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            {message && (
              <span style={{ color: message.includes('Erreur') ? '#ef4444' : '#10b981' }}>
                {message}
              </span>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
