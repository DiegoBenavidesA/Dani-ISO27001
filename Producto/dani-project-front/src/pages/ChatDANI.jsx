import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Maximize2, Minimize2, User } from 'lucide-react';
import { chatAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';

// ── Paleta Material 3 (DANI GRC) ──────────────────────────────
const C = {
  primary: '#004ac6',
  primaryDark: '#003ea8',
  accent: '#004ac6',         // "en línea", avatar del bot y énfasis (identidad azul NormIA)
  tertFixed: '#dbe6ff',      // chip/ícono del bot (azul claro)
  onTertFixed: '#004ac6',
  white: '#ffffff',          // surface-container-lowest
  surfaceLow: '#eff4ff',     // surface-container-low
  onSurface: '#0b1c30',
  onSurfaceVar: '#434655',
  outline: '#737686',
  border: 'rgba(11,28,48,0.10)',
};

export default function ChatDANI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: '¡Hola! Soy DANI, tu asistente de cumplimiento normativo (ISO 27001 y Ley 21.719). Puedo analizar tus documentos, revisar tu progreso en los controles y recomendarte medidas para tus brechas. ¿En qué te ayudo hoy?'
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Manejar el envío
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = { id: Date.now(), type: 'user', content: message };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const historyForAPI = messages.map(m => ({
        role: m.type === 'bot' ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await chatAPI.sendMessage(userMessage.content, 'es', null, null, historyForAPI);

      if (response.error) {
        throw new Error(response.error);
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        content: response.reply
      }]);
    } catch (error) {
      console.error("Error DANI Chat:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        content: `Lo siento, ocurrió un error: ${error.message || 'Error de conexión'}. Intenta de nuevo en unos segundos.`
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <>
      {/* ── Panel del chat ───────────────────────────────── */}
      {isOpen && (
        <aside
          style={{
            position: 'fixed',
            bottom: isExpanded ? '0' : '92px',
            right: isExpanded ? '0' : '24px',
            width: isExpanded ? '100vw' : '420px',
            maxWidth: 'calc(100vw - 2rem)',
            height: isExpanded ? '100vh' : '650px',
            maxHeight: isExpanded ? '100vh' : 'calc(100vh - 7rem)',
            background: C.white,
            borderRadius: isExpanded ? '0' : '24px',
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.22)',
            border: isExpanded ? 'none' : `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9999,
            color: C.onSurface,
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            background: C.white,
            borderBottom: `1px solid ${C.border}`,
            boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: C.tertFixed, color: C.onTertFixed,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 2px rgba(15,23,42,0.08)', flexShrink: 0
              }}>
                <Bot size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.01em', color: C.onSurface }}>
                  DANI AI
                  <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: C.tertFixed, color: C.onTertFixed }}>
                    GRC Copilot
                  </span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: C.accent }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: C.accent }} />
                  En línea • ISO 27001 &amp; Ley 21.719
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: C.onSurfaceVar }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Reducir' : 'Expandir pantalla'}
                style={iconBtn}
                onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceLow}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar asistente"
                style={iconBtn}
                onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceLow}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: 'rgba(239,244,255,0.5)'
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                  gap: '10px',
                  alignItems: 'flex-start',
                  maxWidth: '95%',
                  alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, marginTop: '4px',
                  background: msg.type === 'user' ? C.primary : C.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(15,23,42,0.1)'
                }}>
                  {msg.type === 'user' ? <User size={16} color="#fff" /> : <Bot size={16} color="#fff" />}
                </div>

                <div style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: msg.type === 'user' ? C.primary : C.white,
                  color: msg.type === 'user' ? '#fff' : C.onSurface,
                  border: msg.type === 'user' ? 'none' : `1px solid ${C.border}`,
                  boxShadow: msg.type === 'user' ? 'none' : '0 1px 2px rgba(15,23,42,0.05)',
                  borderTopRightRadius: msg.type === 'user' ? '4px' : '16px',
                  borderTopLeftRadius: msg.type === 'bot' ? '4px' : '16px',
                  fontSize: '13.5px',
                  lineHeight: 1.55,
                  wordBreak: 'break-word'
                }}>
                  {msg.type === 'user' ? (
                    msg.content
                  ) : (
                    <>
                      <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: C.primary }}>
                        Asistente Normativo
                      </p>
                      <div style={{ overflowX: 'auto' }}>
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }) => <p style={{ margin: '0 0 8px 0' }} {...props} />,
                            a: ({ node, ...props }) => <a style={{ color: C.primary, textDecoration: 'none' }} {...props} />,
                            strong: ({ node, ...props }) => <strong style={{ color: C.accent }} {...props} />,
                            ul: ({ node, ...props }) => <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }} {...props} />,
                            ol: ({ node, ...props }) => <ol style={{ margin: '0 0 8px 0', paddingLeft: '20px' }} {...props} />,
                            li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                            table: ({ node, ...props }) => <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }} {...props} />,
                            th: ({ node, ...props }) => <th style={{ border: `1px solid ${C.border}`, padding: '6px', background: C.surfaceLow, textAlign: 'left' }} {...props} />,
                            td: ({ node, ...props }) => <td style={{ border: `1px solid ${C.border}`, padding: '6px' }} {...props} />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                  <Bot size={16} color="#fff" />
                </div>
                <div style={{ padding: '14px 16px', borderRadius: '16px', borderTopLeftRadius: '4px', background: C.white, border: `1px solid ${C.border}`, display: 'flex', gap: '4px' }}>
                  <span className="dot-pulse">.</span><span className="dot-pulse delay-1">.</span><span className="dot-pulse delay-2">.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px', background: C.white, borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <form onSubmit={handleSend} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pregúntale a DANI sobre tu progreso..."
                disabled={isLoading}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 48px 12px 16px',
                  borderRadius: '9999px',
                  border: `1px solid ${C.border}`,
                  background: C.surfaceLow,
                  color: C.onSurface,
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = C.primary}
                onBlur={(e) => e.target.style.borderColor = C.border}
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                aria-label="Enviar mensaje a DANI"
                style={{
                  position: 'absolute',
                  right: '6px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: message.trim() ? C.primary : C.surfaceLow,
                  color: message.trim() ? '#fff' : C.outline,
                  border: 'none',
                  cursor: message.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: message.trim() ? '0 1px 3px rgba(0,74,198,0.3)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </aside>
      )}

      {/* ── FAB (siempre visible) ────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Cerrar Asistente Dani AI' : 'Abrir Asistente Dani AI'}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.primary,
          color: '#fff',
          border: `1px solid rgba(0,74,198,0.2)`,
          borderRadius: '50%',
          boxShadow: '0 8px 24px rgba(0,74,198,0.35)',
          cursor: 'pointer',
          zIndex: 9998,
          transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isOpen ? <X size={26} /> : <Bot size={26} />}
          {!isOpen && (
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', borderRadius: '50%', background: '#ffffff', boxShadow: `0 0 0 2px ${C.primary}` }} />
          )}
        </span>
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        .dot-pulse { animation: pulse 1.4s infinite ease-in-out both; font-size: 18px; line-height: 10px; color: ${C.outline}; }
        .delay-1 { animation-delay: 0.2s; }
        .delay-2 { animation-delay: 0.4s; }
      `}} />
    </>
  );
}

const iconBtn = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s'
};
