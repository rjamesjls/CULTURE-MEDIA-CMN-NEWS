'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    total_followers: '6000+ followers',
    profile_name: 'A FOLUKU TV',
    profile_username: '@afolukutv',
    profile_avatar_url: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*');

        if (error) throw error;
        
        if (data && data.length > 0) {
          const newSettings = { ...settings };
          data.forEach(item => {
            if (item.value) {
              newSettings[item.key] = item.value.replace(/^"|"$/g, '');
            }
          });
          setSettings(newSettings);
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
      const updates = Object.keys(settings).map(key => ({
        key,
        value: JSON.stringify(settings[key]),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('site_settings')
        .upsert(updates);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      if (publicUrlData) {
        setSettings({ ...settings, profile_avatar_url: publicUrlData.publicUrl });
        setMessage('Image téléchargée avec succès. N\'oubliez pas de sauvegarder.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('Erreur lors de l\'upload de l\'image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          <div className="form-group">
            <label>Photo de profil (URL ou Upload)</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  value={settings.profile_avatar_url}
                  onChange={(e) => setSettings({...settings, profile_avatar_url: e.target.value})}
                  className="form-control"
                  placeholder="Lien vers l'image..."
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button" 
                    className="admin-btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <i className="fas fa-upload"></i> {uploading ? 'Upload...' : 'Uploader une image'}
                  </button>
                  <small style={{ color: '#94a3b8' }}>Laissez vide pour afficher "AF"</small>
                </div>
              </div>
              {settings.profile_avatar_url && (
                <img 
                  src={settings.profile_avatar_url} 
                  alt="Avatar preview" 
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', background: '#334155' }}
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profileName">Nom du Média</label>
            <input
              type="text"
              id="profileName"
              value={settings.profile_name}
              onChange={(e) => setSettings({...settings, profile_name: e.target.value})}
              className="form-control"
              placeholder="Ex: A FOLUKU TV"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="profileUsername">Nom d'utilisateur (Pseudo)</label>
            <input
              type="text"
              id="profileUsername"
              value={settings.profile_username}
              onChange={(e) => setSettings({...settings, profile_username: e.target.value})}
              className="form-control"
              placeholder="Ex: @afolukutv"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="followerCount">Nombre total de followers</label>
            <input
              type="text"
              id="followerCount"
              value={settings.total_followers}
              onChange={(e) => setSettings({...settings, total_followers: e.target.value})}
              className="form-control"
              placeholder="Ex: 6000+ followers"
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
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
