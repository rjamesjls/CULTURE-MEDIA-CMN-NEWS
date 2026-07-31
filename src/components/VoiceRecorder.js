'use client';

import { useState, useRef } from 'react';

export default function VoiceRecorder({ onRecorded, style = {} }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setDuration(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Create a File object to pass back
        const file = new File([blob], `vocal_${Date.now()}.webm`, { type: 'audio/webm' });
        if (onRecorded) onRecorded(file, url);
        
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
        clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      alert("Impossible d'accéder au microphone. Vérifiez les permissions de votre navigateur.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setDuration(0);
    if (onRecorded) onRecorded(null, null);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', ...style }}>
      {!audioUrl ? (
        <>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            style={{
              background: isRecording ? '#ef4444' : '#f3f4f6',
              border: isRecording ? '2px solid #ef4444' : '2px solid #d1d5db',
              color: isRecording ? '#fff' : '#6b7280',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 0.2s',
              animation: isRecording ? 'pulse 1.5s infinite' : 'none',
              flexShrink: 0
            }}
            title={isRecording ? "Arrêter l'enregistrement" : "Enregistrer un message vocal"}
          >
            <i className={isRecording ? "fas fa-stop" : "fas fa-microphone"}></i>
          </button>
          {isRecording && (
            <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'blink 1s infinite' }}></span>
              {formatTime(duration)}
            </span>
          )}
          {!isRecording && (
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>Message vocal</span>
          )}
        </>
      ) : (
        <>
          <audio src={audioUrl} controls style={{ height: '36px', maxWidth: '250px' }} />
          <button
            type="button"
            onClick={deleteRecording}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px', padding: '4px' }}
            title="Supprimer l'enregistrement"
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        </>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
