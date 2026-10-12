import React, { useState, useRef, useEffect, useContext } from 'react';
import { Bot, X, Send, Maximize2, Minimize2, Settings, User } from 'lucide-react';
import { chatAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { ThemeContext } from '../contexts/ThemeContext';

export default function ChatDANI() {
  const { theme, darkMode } = useContext(ThemeContext);
  
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

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Extraemos el historial formateado para la IA (rol 'user' o 'assistant')
      const historyForAPI = messages.map(m => ({
        role: m.type === 'bot' ? 'assistant' : 'user',
        content: m.content
      }));

      // Llamada real al backend en chat.py
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
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Botón flotante cerrado
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Bot size={28} />
      </button>
    );
  }

  // Estilos base de la ventana
  const windowStyle = {
    position: 'fixed',
    bottom: isExpanded ? '0' : '24px',
    right: isExpanded ? '0' : '24px',
    width: isExpanded ? '100vw' : '380px',
    height: isExpanded ? '100vh' : '600px',
    maxHeight: isExpanded ? '100vh' : 'calc(100vh - 48px)',
    background: theme.cardBg,
    borderRadius: isExpanded ? '0' : '20px',
    boxShadow: isExpanded ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.3)',
    border: isExpanded ? 'none' : `1px solid ${theme.border}`,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  return (
    <div style={windowStyle}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bot size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>DANI AI</h3>
            <span style={{ fontSize: '12px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a7f3d0' }}></span>
              En línea
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, padding: '4px' }}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(false)} // ESTA LÍNEA PERMITE CERRAR EL BOT
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: theme.bg
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
              gap: '12px',
              alignItems: 'flex-end'
            }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: msg.type === 'user' ? '#3b82f6' : '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {msg.type === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="white" />}
            </div>

            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: '16px',
              background: msg.type === 'user' ? '#3b82f6' : theme.inputBg,
              color: msg.type === 'user' ? 'white' : theme.text,
              border: msg.type === 'user' ? 'none' : `1px solid ${theme.border}`,
              borderBottomRightRadius: msg.type === 'user' ? '4px' : '16px',
              borderBottomLeftRadius: msg.type === 'bot' ? '4px' : '16px',
              fontSize: '14px',
              lineHeight: 1.5,
              wordBreak: 'break-word'
            }}>
              {msg.type === 'user' ? (
                 msg.content
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <ReactMarkdown
                    components={{
                       p: ({node, ...props}) => <p style={{margin: '0 0 8px 0'}} {...props} />,
                       a: ({node, ...props}) => <a style={{color: '#10b981', textDecoration: 'none'}} {...props} />,
                       strong: ({node, ...props}) => <strong style={{color: darkMode ? '#a7f3d0' : '#065f46'}} {...props} />,
                       ul: ({node, ...props}) => <ul style={{margin: '0 0 8px 0', paddingLeft: '20px'}} {...props} />,
                       ol: ({node, ...props}) => <ol style={{margin: '0 0 8px 0', paddingLeft: '20px'}} {...props} />,
                       li: ({node, ...props}) => <li style={{marginBottom: '4px'}} {...props} />,
                       table: ({node, ...props}) => <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '8px'}} {...props} />,
                       th: ({node, ...props}) => <th style={{border: `1px solid ${theme.border}`, padding: '6px', background: theme.hoverBg, textAlign: 'left'}} {...props} />,
                       td: ({node, ...props}) => <td style={{border: `1px solid ${theme.border}`, padding: '6px'}} {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} color="white" />
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '16px', background: theme.inputBg, border: `1px solid ${theme.border}`, display: 'flex', gap: '4px' }}>
              <span className="dot-pulse">.</span><span className="dot-pulse delay-1">.</span><span className="dot-pulse delay-2">.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px',
        background: theme.cardBg,
        borderTop: `1px solid ${theme.border}`
      }}>
        <form onSubmit={handleSend} style={{ position: 'relative' }}>
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
              padding: '14px 48px 14px 16px',
              borderRadius: '24px',
              border: `1px solid ${theme.border}`,
              background: theme.inputBg,
              color: theme.text,
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = theme.border}
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            style={{
              position: 'absolute',
              right: '6px',
              top: '6px',
              width: '36px',
              height: '36px',
              borderRadius: '18px',
              background: message.trim() ? '#10b981' : 'transparent',
              color: message.trim() ? 'white' : theme.textMuted,
              border: 'none',
              cursor: message.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} />
          </button>
        </form>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
          .dot-pulse { animation: pulse 1.4s infinite ease-in-out both; font-size: 18px; line-height: 10px;}
          .delay-1 { animation-delay: 0.2s; }
          .delay-2 { animation-delay: 0.4s; }
        `}} />
      </div>
    </div>
  );
}