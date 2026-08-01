'use client';

import { useState, useEffect, useRef } from 'react';

export default function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    // Cancel any ongoing speech when component unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const stripHtml = (html) => {
    if (typeof window === 'undefined') return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const play = (title, htmlContent) => {
    if (!isSupported) return;

    // If already paused, just resume
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    // Clean previous
    window.speechSynthesis.cancel();

    // Prepare text
    const cleanContent = stripHtml(htmlContent);
    const fullText = `${title}. \n\n ${cleanContent}`;

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'fr-FR'; // Default to French
    
    // Attempt to find a natural-sounding French voice if available
    const voices = window.speechSynthesis.getVoices();
    const frVoices = voices.filter(v => v.lang.startsWith('fr'));
    if (frVoices.length > 0) {
      // Prefer Google or Apple premium voices if available
      const premiumVoice = frVoices.find(v => v.name.includes('Premium') || v.name.includes('Google') || v.name.includes('Siri'));
      utterance.voice = premiumVoice || frVoices[0];
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error('TTS Error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsSpeaking(false);
  };

  const stop = () => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return {
    isSpeaking,
    isPaused,
    isSupported,
    play,
    pause,
    stop
  };
}
