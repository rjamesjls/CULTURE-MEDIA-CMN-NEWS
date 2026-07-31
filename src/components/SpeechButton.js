'use client';

import { useState, useRef, useEffect } from 'react';

export default function SpeechButton({ onTranscript, style = {} }) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome ou Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript && onTranscript) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={isListening ? "Arrêter la dictée" : "Dicter avec le micro"}
      style={{
        background: isListening ? '#ef4444' : '#f3f4f6',
        border: isListening ? '1px solid #ef4444' : '1px solid #d1d5db',
        color: isListening ? '#fff' : '#6b7280',
        borderRadius: '6px',
        padding: '8px 10px',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
        animation: isListening ? 'pulse 1.5s infinite' : 'none',
        ...style
      }}
    >
      <i className={isListening ? "fas fa-stop" : "fas fa-microphone"}></i>
      {isListening && <span style={{ fontSize: '12px' }}>Écoute...</span>}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </button>
  );
}
