'use client';

import { useState, useRef, useEffect } from 'react';
import { generateOmniArticle } from './omniActions';
import { sendChatToAssistant } from './chatActions';
import { generateSpinoff } from '../articles/[id]/spinoffs/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OmniGeneratorClient() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Quel sujet souhaitez-vous aborder aujourd\'hui ? Je peux vous aider à brainstormer et affiner votre idée avant de lancer la génération globale.' }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [generatedArticleId, setGeneratedArticleId] = useState(null);
  
  // Listening states
  const [isDictating, setIsDictating] = useState(false);
  const [isConversing, setIsConversing] = useState(false);
  
  const chatEndRef = useRef(null);
  const pendingVoiceResponse = useRef(false);
  const recognitionRef = useRef(null);
  const router = useRouter();

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const tasks = [
    { id: 'article', label: 'Article Souche (FR & Bushinengué)', format: null },
    { id: 'flash_info', label: 'Flash Info', format: 'flash_info' },
    { id: 'reel', label: 'Reel', format: 'reel_script' },
    { id: 'tiktok', label: 'TikTok', format: 'tiktok_script' },
    { id: 'story', label: 'Story Instagram', format: 'instagram_caption' },
    { id: 'podcast', label: 'Podcast', format: 'podcast' },
    { id: 'script_jt', label: 'Script JT', format: 'radio_script' },
    { id: 'miniature', label: 'Miniature (Prompt Image)', format: 'thumbnail_prompt' },
    { id: 'seo', label: 'SEO (Mots-clés & Meta)', format: 'seo' },
    { id: 'facebook', label: 'Publication Facebook', format: 'facebook' },
    { id: 'linkedin', label: 'Publication LinkedIn', format: 'linkedin' },
    { id: 'instagram', label: 'Publication Instagram', format: 'instagram_post' },
  ];

  const tools = [
    {
      title: "Assistant Linguistique",
      description: "Traduction intelligente des articles (Français ➔ Bushinengué).",
      icon: "fas fa-language",
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)",
      link: "/admin/articles",
      actionText: "Aller dans la Newsroom",
    },
    {
      title: "Générateur Instagram",
      description: "Créez des posts captivants à partir de vos articles avec hashtags.",
      icon: "fab fa-instagram",
      color: "#c026d3",
      bgColor: "rgba(192, 38, 211, 0.1)",
      link: "/admin/articles",
      actionText: "Choisir un article",
    },
    {
      title: "Flash Info Express",
      description: "Générez des brèves d'actualité percutantes en quelques secondes.",
      icon: "fas fa-bolt",
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)",
      link: "#",
      actionText: "Bientôt disponible",
      disabled: true,
    },
    {
      title: "Video & Podcast",
      description: "Scripts automatisés pour vos présentateurs et podcasts.",
      icon: "fas fa-microphone-alt",
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)",
      link: "#",
      actionText: "Bientôt disponible",
      disabled: true,
    }
  ];

  const initRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = true;
    return recognition;
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsDictating(false);
    setIsConversing(false);
  };

  const startDictation = () => {
    if (isDictating || isConversing) {
      stopRecognition();
      return;
    }
    
    const recognition = initRecognition();
    if (!recognition) return;

    recognition.onstart = () => setIsDictating(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');
      setCurrentInput(transcript);
    };
    recognition.onerror = (event) => {
      console.error('Speech error', event.error);
      setIsDictating(false);
    };
    recognition.onend = () => setIsDictating(false);
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const startConversation = () => {
    if (isDictating || isConversing) {
      stopRecognition();
      return;
    }

    const recognition = initRecognition();
    if (!recognition) return;

    let finalTranscript = '';

    recognition.onstart = () => setIsConversing(true);
    recognition.onresult = (event) => {
      finalTranscript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');
      setCurrentInput(finalTranscript);
    };
    recognition.onerror = (event) => {
      console.error('Speech error', event.error);
      setIsConversing(false);
    };
    recognition.onend = () => {
      setIsConversing(false);
      if (finalTranscript.trim()) {
        // Auto-send and request voice response
        pendingVoiceResponse.current = true;
        // We must call a separate function to ensure we use the latest transcript state directly
        triggerSendMessage(finalTranscript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const triggerSendMessage = async (text) => {
    if (!text.trim() || isTyping || isGenerating) return;

    const userMessage = text.trim();
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setCurrentInput('');
    setIsTyping(true);

    try {
      const res = await sendChatToAssistant(newMessages);
      if (res.success) {
        setMessages([...newMessages, { role: 'assistant', content: res.text }]);
        
        // Speak if it was triggered via voice conversation
        if (pendingVoiceResponse.current && window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(res.text);
          utterance.lang = 'fr-FR';
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      } else {
        setError(res.error || "Erreur de communication avec l'assistant.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTyping(false);
      pendingVoiceResponse.current = false;
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    pendingVoiceResponse.current = false; // Manual typed submit = NO voice response
    triggerSendMessage(currentInput);
  };

  const deleteMessage = (indexToDelete) => {
    setMessages(messages.filter((_, idx) => idx !== indexToDelete));
  };

  const handleGenerate = async () => {
    if (messages.length < 2) {
       setError("Veuillez d'abord discuter avec l'IA pour définir un sujet.");
       return;
    }
    
    setIsGenerating(true);
    setError(null);
    setCurrentTaskIndex(0);
    setGeneratedArticleId(null);

    const conversationHistoryStr = messages.map(m => `${m.role === 'user' ? 'Journaliste' : 'Rédacteur en chef'}: ${m.content}`).join('\n\n');
    let articleId = null;

    try {
      const articleRes = await generateOmniArticle(conversationHistoryStr);
      if (!articleRes.success) throw new Error(articleRes.error || "Erreur lors de la création de l'article.");
      articleId = articleRes.articleId;
      setGeneratedArticleId(articleId);
    } catch (err) {
      setError(err.message);
      setIsGenerating(false);
      return;
    }

    for (let i = 1; i < tasks.length; i++) {
      setCurrentTaskIndex(i);
      const task = tasks[i];
      try {
        const spinoffRes = await generateSpinoff(articleId, task.format);
        if (!spinoffRes.success) {
          console.warn(`Spinoff failed for ${task.format}:`, spinoffRes.error);
          if (spinoffRes.error && spinoffRes.error.includes('429')) {
             throw new Error("Limite de requêtes atteinte par Google Gemini (Erreur 429). Processus arrêté.");
          }
        }
      } catch (err) {
        setError(err.message);
        setIsGenerating(false);
        return;
      }
    }

    setCurrentTaskIndex(tasks.length); // All done
    setIsGenerating(false);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '60px', 
          height: '60px', 
          borderRadius: '16px', 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
          marginBottom: '20px',
          color: '#fff',
          fontSize: '24px'
        }}>
          <i className="fas fa-brain"></i>
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 10px 0', fontSize: '36px', fontWeight: '800', background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Studio
        </h1>
        <p style={{ margin: 0, color: '#a1a1aa', fontSize: '16px', maxWidth: '500px', marginInline: 'auto' }}>
          Le cerveau central de AFOLUKUTV OS. Discutez de vos idées avec l'IA et lancez la génération de tout votre écosystème de communication.
        </p>
      </div>

      {/* CHAT INTERFACE - GLASSMORPHISM */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.03)', 
        backdropFilter: 'blur(16px)', 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderRadius: '24px', 
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        marginBottom: '50px',
        overflow: 'hidden'
      }}>
        
        {/* Messages Area */}
        <div style={{ 
          padding: '30px', 
          height: '400px', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              position: 'relative',
              group: 'msg-bubble' // for hover state in modern CSS (requires class usually, we'll use a wrapper)
            }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div style={{ 
                  maxWidth: '100%', 
                  padding: '15px 20px', 
                  borderRadius: '18px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '18px',
                  borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '18px',
                  fontSize: '15px',
                  lineHeight: '1.5',
                  boxShadow: msg.role === 'user' ? '0 4px 15px rgba(139, 92, 246, 0.3)' : 'none',
                  wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>
                
                {/* Delete Button */}
                {idx !== 0 && (
                  <button
                    onClick={() => deleteMessage(idx)}
                    title="Supprimer ce message"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      color: '#ef4444',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.7,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                  >
                    <i className="fas fa-trash-alt" style={{ fontSize: '12px' }}></i>
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ 
                padding: '15px 20px', 
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#a1a1aa',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderBottomLeftRadius: '4px',
                display: 'flex',
                gap: '5px'
              }}>
                <i className="fas fa-circle" style={{ fontSize: '8px', animation: 'pulse 1s infinite' }}></i>
                <i className="fas fa-circle" style={{ fontSize: '8px', animation: 'pulse 1s infinite 0.2s' }}></i>
                <i className="fas fa-circle" style={{ fontSize: '8px', animation: 'pulse 1s infinite 0.4s' }}></i>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Action Button */}
        {messages.length > 1 && !isGenerating && currentTaskIndex < 0 && (
          <div style={{ padding: '0 30px', marginBottom: '15px' }}>
            <button 
              onClick={handleGenerate}
              style={{ 
                width: '100%', 
                padding: '16px', 
                fontSize: '16px', 
                fontWeight: '600',
                borderRadius: '16px',
                border: 'none',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
            >
              <i className="fas fa-magic"></i> Sujet validé ? Déclencher l'Omni-Génération
            </button>
          </div>
        )}

        {/* Input Area */}
        {!isGenerating && currentTaskIndex < 0 && (
          <div style={{ padding: '20px 30px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.3)' }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', position: 'relative' }}>
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                disabled={isTyping}
                placeholder="Ex: Écris un article sur la fête de la musique à Saint-Laurent..."
                style={{ 
                  flex: 1,
                  fontSize: '16px', 
                  padding: '16px 20px',
                  paddingRight: '120px', // Space for both mic buttons
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  color: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
              
              <div style={{ position: 'absolute', right: '75px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '5px' }}>
                {/* Dictation Button (Text Only) */}
                <button
                  type="button"
                  onClick={startDictation}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: isDictating ? '#eab308' : 'transparent',
                    color: isDictating ? '#fff' : '#a1a1aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  title="Dicter (Réponse Texte)"
                >
                  <i className="fas fa-keyboard" style={{ animation: isDictating ? 'pulse 1.5s infinite' : 'none' }}></i>
                </button>
                
                {/* Voice Conversation Button (Voice Auto-reply) */}
                <button
                  type="button"
                  onClick={startConversation}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: isConversing ? '#ef4444' : 'transparent',
                    color: isConversing ? '#fff' : '#a1a1aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  title="Parler (Réponse Vocale)"
                >
                  <i className="fas fa-microphone" style={{ animation: isConversing ? 'pulse 1.5s infinite' : 'none' }}></i>
                </button>
              </div>

              {/* Send Text Button */}
              <button 
                type="submit"
                disabled={!currentInput.trim() || isTyping}
                style={{ 
                  width: '56px',
                  borderRadius: '16px',
                  border: 'none',
                  background: currentInput.trim() ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
                  color: currentInput.trim() ? '#fff' : '#71717a',
                  cursor: currentInput.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  transition: 'all 0.2s'
                }}
                title="Envoyer (Réponse Texte)"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ padding: '15px', margin: '0 30px 20px', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#f87171', borderRadius: '12px', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i> {error}
          </div>
        )}

        {/* Generation Progress */}
        {currentTaskIndex >= 0 && (
          <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.4)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-network-wired" style={{ color: '#8b5cf6' }}></i> 
                Synchronisation des branches
              </h3>
              <span style={{ fontSize: '14px', color: '#8b5cf6', fontWeight: '600' }}>
                {Math.min(currentTaskIndex + 1, tasks.length)} / {tasks.length}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {tasks.map((task, idx) => {
                let statusIcon = <i className="far fa-circle" style={{ color: '#52525b' }}></i>;
                let textColor = '#71717a';
                let borderColor = 'rgba(255,255,255,0.05)';
                let bgColor = 'rgba(255,255,255,0.02)';
                
                if (idx < currentTaskIndex) {
                  statusIcon = <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>;
                  textColor = '#e4e4e7';
                  borderColor = 'rgba(16, 185, 129, 0.2)';
                  bgColor = 'rgba(16, 185, 129, 0.05)';
                } else if (idx === currentTaskIndex && isGenerating) {
                  statusIcon = <i className="fas fa-circle-notch fa-spin" style={{ color: '#8b5cf6' }}></i>;
                  textColor = '#fff';
                  borderColor = 'rgba(139, 92, 246, 0.4)';
                  bgColor = 'rgba(139, 92, 246, 0.1)';
                } else if (idx === currentTaskIndex && !isGenerating && currentTaskIndex === tasks.length) {
                  statusIcon = <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>;
                  textColor = '#e4e4e7';
                  borderColor = 'rgba(16, 185, 129, 0.2)';
                  bgColor = 'rgba(16, 185, 129, 0.05)';
                }

                return (
                  <div key={task.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    padding: '12px 15px', 
                    backgroundColor: bgColor, 
                    borderRadius: '10px', 
                    border: `1px solid ${borderColor}`,
                    transition: 'all 0.3s'
                  }}>
                    {statusIcon}
                    <span style={{ fontWeight: '500', color: textColor, fontSize: '13px' }}>
                      {task.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {currentTaskIndex >= tasks.length && !error && generatedArticleId && (
              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '15px' }}>
                  <i className="fas fa-check"></i>
                </div>
                <p style={{ color: '#e4e4e7', fontSize: '18px', fontWeight: '500', margin: '0 0 20px 0' }}>
                  Génération globale terminée !
                </p>
                <button 
                  onClick={() => router.push(`/admin/articles/${generatedArticleId}/spinoffs`)}
                  style={{ 
                    padding: '12px 25px', 
                    fontSize: '15px', 
                    fontWeight: '600',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
                  }}
                >
                  Découvrir la Campagne
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BRANCHES (RACCOURCIS) */}
      <div>
        <h3 style={{ color: '#a1a1aa', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.1))' }}></div>
          Outils Spécifiques
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, rgba(255,255,255,0), rgba(255,255,255,0.1))' }}></div>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {tools.map((tool, idx) => (
            <div 
              key={idx}
              style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                borderRadius: '16px', 
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                opacity: tool.disabled ? 0.5 : 1,
                transition: 'transform 0.2s, background 0.2s',
                cursor: tool.disabled ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!tool.disabled) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!tool.disabled) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={{ 
                  width: '45px', 
                  height: '45px', 
                  borderRadius: '12px', 
                  backgroundColor: tool.bgColor, 
                  color: tool.color,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  <i className={tool.icon}></i>
                </div>
                <h4 style={{ margin: 0, fontSize: '16px', color: '#e4e4e7', fontWeight: '600' }}>
                  {tool.title}
                </h4>
              </div>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5', flex: 1 }}>
                {tool.description}
              </p>
              
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '15px', marginTop: 'auto' }}>
                {tool.disabled ? (
                  <span style={{ fontSize: '13px', color: '#71717a', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fas fa-lock"></i> {tool.actionText}
                  </span>
                ) : (
                  <Link href={tool.link} style={{ 
                    fontSize: '13px', 
                    color: tool.color, 
                    fontWeight: '600', 
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    {tool.actionText}
                    <i className="fas fa-arrow-right"></i>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
