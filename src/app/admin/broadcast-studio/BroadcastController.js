'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, Radio, MonitorPlay, CheckCircle2, AlertCircle, 
  Video, Eye, EyeOff, Layers, ArrowRightLeft, Circle, Settings, LogOut,
  Plus, Trash2, Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BroadcastController() {
  const router = useRouter();

  // Connexion
  const [obsConnected, setObsConnected] = useState(false);
  const [error, setError] = useState('');
  const [obsPassword, setObsPassword] = useState('');

  // Scènes et Sources
  const [scenes, setScenes] = useState([]);
  const [previewScene, setPreviewScene] = useState('');
  const [programScene, setProgramScene] = useState('');
  const [sceneItems, setSceneItems] = useState([]);
  
  // Nouveaux états pour la création
  const [newSceneName, setNewSceneName] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [showAddSource, setShowAddSource] = useState(false);

  // Statuts d'enregistrement / diffusion
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimecode, setRecordTimecode] = useState('00:00:00');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTimecode, setStreamTimecode] = useState('00:00:00');

  // Moniteurs Vidéos (Base64 data URIs)
  const [previewImage, setPreviewImage] = useState(null);
  const [programImage, setProgramImage] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [programError, setProgramError] = useState(null);

  const pollIntervalRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.cmnOS) {
      // Optionnel : Tentative de connexion automatique sans mdp
      // connectOBS(); 
    }
    return () => {
      stopPolling();
    };
  }, []);

  const connectOBS = async () => {
    if (!window.cmnOS) {
      setError("AFOLUKUTV OS Desktop App requise.");
      return;
    }
    const res = await window.cmnOS.obsConnect({ url: 'ws://localhost:4455', password: obsPassword });
    if (res.success) {
      setObsConnected(true);
      setError('');
      initializeDashboard();
    } else {
      setObsConnected(false);
      setError(res.error || "Connexion refusée. Mot de passe incorrect ?");
    }
  };

  const initializeDashboard = async () => {
    await loadScenes();
    await updateStatuses();
    startPolling();
  };

  const startPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(() => {
      updateStatuses();
      updateMonitors();
    }, 1000); // Polling toutes les secondes
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

  const loadScenes = async () => {
    const res = await window.cmnOS.obsGetScenes();
    if (res.success) {
      setScenes(res.scenes);
      // Par défaut, OBS v5 n'expose pas GetCurrentPreviewScene facilement dans GetSceneList,
      // on suppose que Program et Preview sont les mêmes au chargement, puis on mettra à jour.
      setProgramScene(res.currentScene);
      // On charge les sources de la scène Programme par défaut
      loadSceneItems(res.currentScene);
    }
  };

  const loadSceneItems = async (sceneName) => {
    const res = await window.cmnOS.obsGetSceneItems(sceneName);
    if (res.success) {
      setSceneItems(res.items);
    }
  };

  const updateStatuses = async () => {
    const recRes = await window.cmnOS.obsGetRecordStatus();
    if (recRes.success) {
      setIsRecording(recRes.outputActive);
      setRecordTimecode(recRes.outputTimecode || '00:00:00');
    }
    const strRes = await window.cmnOS.obsGetStreamStatus();
    if (strRes.success) {
      setIsStreaming(strRes.outputActive);
      setStreamTimecode(strRes.outputTimecode || '00:00:00');
    }
  };

  const updateMonitors = async () => {
    // Si on connait la scène en Program, on prend un screenshot
    if (programScene) {
      try {
        const pRes = await window.cmnOS.obsGetSourceScreenshot({ sourceName: programScene });
        if (pRes.success) {
          let img = pRes.imageData;
          if (!img.startsWith('data:')) img = 'data:image/jpeg;base64,' + img;
          setProgramImage(img);
          setProgramError(null);
        } else {
          setProgramError(pRes.error);
        }
      } catch (e) {
        setProgramError(e.message);
      }
    }
    if (previewScene) {
      try {
        const prRes = await window.cmnOS.obsGetSourceScreenshot({ sourceName: previewScene });
        if (prRes.success) {
          let img = prRes.imageData;
          if (!img.startsWith('data:')) img = 'data:image/jpeg;base64,' + img;
          setPreviewImage(img);
          setPreviewError(null);
        } else {
          setPreviewError(prRes.error);
        }
      } catch (e) {
        setPreviewError(e.message);
      }
    }
  };

  const changePreviewScene = async (sceneName) => {
    const res = await window.cmnOS.obsSetPreviewScene(sceneName);
    if (res.success) {
      setPreviewScene(sceneName);
      loadSceneItems(sceneName); // Affiche les sources de la prévisualisation
    } else {
      alert("Erreur changement scène (Le Mode Studio est-il activé dans OBS ?) : " + res.error);
    }
  };

  const triggerTransition = async () => {
    const res = await window.cmnOS.obsTriggerTransition();
    if (res.success) {
      // Après transition, le preview devient program, on intervertit
      setProgramScene(previewScene);
      setPreviewScene(programScene);
    } else {
      alert("Erreur Transition (Le Mode Studio est-il activé dans OBS ?) : " + res.error);
    }
  };

  const toggleSource = async (sceneItemId, currentStatus) => {
    // On modifie la source sur la scène actuellement sélectionnée (Preview ou Program selon ce qu'on regarde)
    const targetScene = previewScene || programScene;
    const res = await window.cmnOS.obsSetSceneItemEnabled({ 
      sceneName: targetScene, 
      sceneItemId, 
      sceneItemEnabled: !currentStatus 
    });
    if (res.success) {
      // Rafraîchir la liste
      loadSceneItems(targetScene);
    }
  };

  const toggleRecord = async () => {
    const res = await window.cmnOS.obsToggleRecord();
    if (!res.success) alert("Erreur Enregistrement : " + res.error);
    updateStatuses();
  };

  const toggleStream = async () => {
    const res = await window.cmnOS.obsToggleStream();
    if (!res.success) alert("Erreur Stream : " + res.error);
    updateStatuses();
  };

  const createScene = async () => {
    if (!newSceneName.trim()) return;
    const res = await window.cmnOS.obsCreateScene(newSceneName.trim());
    if (res.success) {
      setNewSceneName('');
      loadScenes();
    } else {
      alert("Erreur lors de la création de la scène: " + res.error);
    }
  };

  const removeScene = async (sceneName) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer la scène "${sceneName}" ?`)) return;
    const res = await window.cmnOS.obsRemoveScene(sceneName);
    if (res.success) {
      loadScenes();
    }
  };

  const addBrowserSource = async () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;
    const targetScene = previewScene || programScene;
    if (!targetScene) return;

    const res = await window.cmnOS.obsCreateBrowserInput({
      sceneName: targetScene,
      inputName: newSourceName.trim(),
      inputUrl: newSourceUrl.trim()
    });

    if (res.success) {
      setNewSourceName('');
      setNewSourceUrl('');
      setShowAddSource(false);
      loadSceneItems(targetScene);
    } else {
      alert("Erreur lors de l'ajout de la source: " + res.error);
    }
  };

  const removeSource = async (sceneItemId) => {
    const targetScene = previewScene || programScene;
    if (!window.confirm("Voulez-vous vraiment supprimer cette source ?")) return;
    const res = await window.cmnOS.obsRemoveSceneItem({ sceneName: targetScene, sceneItemId });
    if (res.success) {
      loadSceneItems(targetScene);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      
      {/* HEADER / TOOLBAR */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(20, 20, 25, 0.8)', backdropFilter: 'blur(20px)',
        borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '16px 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => router.push('/admin')} style={{
            background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <LogOut size={20} /> Quitter
          </button>
          
          <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '8px' }}>
              <Radio size={20} color="#8b5cf6" />
            </div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>OBS Studio Master</h1>
          </div>
        </div>

        {obsConnected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* STREAM BUTTON */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '12px', border: isStreaming ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.7rem', color: '#a1a1aa', textTransform: 'uppercase' }}>Live Stream</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: isStreaming ? '#ef4444' : '#fff' }}>{streamTimecode}</span>
              </div>
              <button onClick={toggleStream} style={{
                background: isStreaming ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center'
              }}>
                <Radio size={18} /> {isStreaming ? 'COUPER LE DIRECT' : 'LANCER LE DIRECT'}
              </button>
            </div>

            {/* RECORD BUTTON */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '12px', border: isRecording ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.7rem', color: '#a1a1aa', textTransform: 'uppercase' }}>Enregistrement</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: isRecording ? '#ef4444' : '#fff' }}>{recordTimecode}</span>
              </div>
              <button onClick={toggleRecord} style={{
                background: isRecording ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center'
              }}>
                <Circle size={18} fill={isRecording ? "#fff" : "none"} /> {isRecording ? 'STOP REC' : 'REC'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="password" placeholder="Mot de passe OBS" value={obsPassword} onChange={e => setObsPassword(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} />
            <button onClick={connectOBS} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Connecter OBS</button>
            {error && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{error}</span>}
          </div>
        )}
      </div>

      {/* MAIN WORKSPACE */}
      {obsConnected && (
        <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
          
          {/* LEFT: SCENES */}
          <div style={{ width: '280px', background: 'rgba(20,20,25,0.7)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Layers size={18} /> Scènes</h3>
            </div>
            
            {/* Ajout Scène */}
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Nouvelle scène..." 
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
              />
              <button 
                onClick={createScene}
                style={{ background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', width: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scenes.map(scene => {
                const isProgram = programScene === scene.sceneName;
                const isPreview = previewScene === scene.sceneName;
                return (
                  <div key={scene.sceneName} style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => changePreviewScene(scene.sceneName)}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                        border: isProgram ? '1px solid #ef4444' : (isPreview ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.05)'),
                        background: isProgram ? 'rgba(239, 68, 68, 0.1)' : (isPreview ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.3)'),
                        color: '#fff', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{scene.sceneName}</div>
                      <div style={{ fontSize: '0.65rem', color: isProgram ? '#ef4444' : (isPreview ? '#10b981' : '#a1a1aa'), marginTop: '2px', textTransform: 'uppercase' }}>
                        {isProgram ? 'EN DIRECT' : (isPreview ? 'PRÉVISUALISATION' : '')}
                      </div>
                    </button>
                    {!isProgram && !isPreview && (
                      <button onClick={() => removeScene(scene.sceneName)} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', width: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* CENTER: MONITORS */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
              {/* Preview Monitor */}
              <div style={{ flex: 1, background: '#000', borderRadius: '16px', border: '2px solid #10b981', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#10b981', color: '#000', padding: '4px 12px', fontWeight: 'bold', fontSize: '0.8rem', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, textAlign: 'center' }}>
                  PRÉVISUALISATION (PREVIEW)
                </div>
                {previewError ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                    Erreur: {previewError}
                  </div>
                ) : previewImage ? (
                  <div style={{ width: '100%', height: '100%', backgroundImage: `url(${previewImage})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: '14px' }}>
                    Aucun signal
                  </div>
                )}
              </div>

              {/* Program Monitor */}
              <div style={{ flex: 1, background: '#000', borderRadius: '16px', border: '2px solid #ef4444', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#ef4444', color: '#fff', padding: '4px 12px', fontWeight: 'bold', fontSize: '0.8rem', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, textAlign: 'center' }}>
                  PROGRAMME (DIRECT)
                </div>
                {programError ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                    Erreur: {programError}
                  </div>
                ) : programImage ? (
                  <div style={{ width: '100%', height: '100%', backgroundImage: `url(${programImage})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: '14px' }}>
                    Aucun signal
                  </div>
                )}
              </div>
            </div>

            {/* TRANSITION BUTTON */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={triggerTransition} style={{
                background: 'linear-gradient(90deg, #10b981 0%, #ef4444 100%)', border: 'none', borderRadius: '16px',
                padding: '16px 40px', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}>
                TRANSITION <ArrowRightLeft size={24} />
              </button>
            </div>
          </div>

          {/* RIGHT: SOURCES */}
          <div style={{ width: '280px', background: 'rgba(20,20,25,0.7)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Video size={18} /> Sources</h3>
              <button onClick={() => setShowAddSource(!showAddSource)} style={{ background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> Web
              </button>
            </div>

            {/* Ajout Source Web */}
            {showAddSource && (
              <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={14}/> Ajouter une URL (Browser)</div>
                <input 
                  type="text" 
                  placeholder="Nom de la source" 
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  style={{ padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
                <input 
                  type="text" 
                  placeholder="https://..." 
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  style={{ padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem' }}
                />
                <button onClick={addBrowserSource} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Valider</button>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sceneItems.length === 0 ? (
                <p style={{ color: '#a1a1aa', fontSize: '0.9rem', textAlign: 'center', marginTop: '40px' }}>Sélectionnez une scène pour voir ses sources</p>
              ) : (
                sceneItems.map(item => (
                  <div key={item.sceneItemId} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <span style={{ fontSize: '0.9rem', color: item.sceneItemEnabled ? '#fff' : '#666', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                      {item.sourceName}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => toggleSource(item.sceneItemId, item.sceneItemEnabled)}
                        style={{ background: 'transparent', border: 'none', color: item.sceneItemEnabled ? '#10b981' : '#666', cursor: 'pointer', padding: '4px' }}
                      >
                        {item.sceneItemEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button 
                        onClick={() => removeSource(item.sceneItemId)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', opacity: 0.7 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
