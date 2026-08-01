'use client';

import { useState, useEffect, useRef } from 'react';

export default function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  // Track current highlighted element
  const currentHighlightedEl = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }
    return () => {
      stop();
    };
  }, []);

  const removeHighlight = () => {
    if (currentHighlightedEl.current) {
      currentHighlightedEl.current.classList.remove('tts-highlight');
      currentHighlightedEl.current = null;
    }
  };

  const createUtterance = (text, elementToHighlight = null) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    
    const voices = window.speechSynthesis.getVoices();
    const frVoices = voices.filter(v => v.lang.startsWith('fr'));
    if (frVoices.length > 0) {
      const premiumVoice = frVoices.find(v => v.name.includes('Premium') || v.name.includes('Google') || v.name.includes('Siri'));
      utterance.voice = premiumVoice || frVoices[0];
    }

    utterance.onstart = () => {
      removeHighlight();
      setIsSpeaking(true);
      setIsPaused(false);
      if (elementToHighlight) {
        elementToHighlight.classList.add('tts-highlight');
        currentHighlightedEl.current = elementToHighlight;
        
        // Scroll to the element smoothly, keeping it roughly in the middle
        const rect = elementToHighlight.getBoundingClientRect();
        const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!isInViewport) {
          elementToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    utterance.onend = () => {
      removeHighlight();
      // Si la file d'attente est vide, c'est la fin globale
      if (!window.speechSynthesis.pending && !window.speechSynthesis.speaking) {
        setIsSpeaking(false);
        setIsPaused(false);
      }
    };

    utterance.onerror = (e) => {
      removeHighlight();
      setIsSpeaking(false);
      setIsPaused(false);
    };

    return utterance;
  };

  const play = (title, rawContent) => {
    if (!isSupported) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    stop();

    // 1. Lire le titre
    if (title) {
      window.speechSynthesis.speak(createUtterance(title + "."));
    }

    // 2. Chercher le conteneur de contenu
    const contentContainer = document.getElementById('article-content');
    
    if (contentContainer) {
      // Si on a un conteneur, on lit par bloc (p, h1-h6, li, blockquote)
      const blocks = contentContainer.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote');
      
      if (blocks.length > 0) {
        blocks.forEach((block) => {
          const text = block.textContent.trim();
          if (text) {
            window.speechSynthesis.speak(createUtterance(text, block));
          }
        });
      } else {
        // Fallback si pas de balises structurantes
        const cleanText = contentContainer.textContent.trim();
        if (cleanText) {
          window.speechSynthesis.speak(createUtterance(cleanText, contentContainer));
        }
      }
    } else {
      // Fallback si pas d'ID trouvé
      const doc = new DOMParser().parseFromString(rawContent, 'text/html');
      const cleanText = doc.body.textContent || "";
      if (cleanText) {
        window.speechSynthesis.speak(createUtterance(cleanText));
      }
    }
    
    setIsSpeaking(true);
    setIsPaused(false);
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
    removeHighlight();
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
