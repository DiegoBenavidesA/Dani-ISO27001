// src/pages/DocumentsScreen.jsx
import React, { useState, useContext } from 'react';
import { 
  FileText, Plus, Search, Sparkles, Send, MessageSquare, 
  HelpCircle, ChevronRight, ChevronDown, ArrowRight 
} from 'lucide-react';
import { ThemeContext, useTranslation } from '../contexts/ThemeContext';

const chatLabels = {
  en: { 
    title: 'Chat with Documents', subtitle: 'Ask questions about your compliance documents', 
    placeholder: 'Ask about your documents...', searching: 'Searching documents...', 
    sources: 'Sources', askAnything: 'Ask anything about your documents', 
    faqTitle: 'Frequently Asked Questions', faqSubtitle: 'Quick answers from your documents', 
    chat: 'Chat', faq: 'FAQ' 
  },
  es: { 
    title: 'Chat con Documentos', subtitle: 'Haz preguntas sobre tus documentos de cumplimiento', 
    placeholder: 'Pregunta sobre tus documentos...', searching: 'Buscando en documentos...', 
    sources: 'Fuentes', askAnything: 'Pregunta sobre tus documentos', 
    faqTitle: 'Preguntas Frecuentes', faqSubtitle: 'Respuestas rápidas de tus documentos', 
    chat: 'Chat', faq: 'FAQ' 
  },
  pt: { 
    title: 'Chat com Documentos', subtitle: 'Faça perguntas sobre seus documentos de conformidade', 
    placeholder: 'Pergunte sobre seus documentos...', searching: 'Pesquisando documentos...', 
    sources: 'Fontes', askAnything: 'Pergunte sobre seus documentos', 
    faqTitle: 'Perguntas Frequentes', faqSubtitle: 'Respostas rápidas dos seus documentos', 
    chat: 'Chat', faq: 'FAQ' 
  }
};

const suggestedQuestions = {
  en: [
    "What are the password requirements in our security policy?",
    "Who needs to approve access control changes?",
    "What's the incident response escalation process?",
    "When was the BCP last updated?"
  ],
  es: [
    "¿Cuáles son los requisitos de contraseña en nuestra política?",
    "¿Quién debe aprobar los cambios de control de acceso?",
    "¿Cuál es el proceso de escalación de incidentes?",
    "¿Cuándo se actualizó el BCP por última vez?"
  ],
  pt: [
    "Quais são os requisitos de senha na nossa política?",
    "Quem precisa aprovar mudanças de controle de acesso?",
    "Qual é o processo de escalação de incidentes?",
    "Quando o BCP foi atualizado pela última vez?"
  ]
};

const faqData = {
  en: [
    { id: 1, question: "What are the minimum password requirements?", answer: "Passwords must be at least 12 characters long, contain uppercase and lowercase letters, numbers, and special characters.", source: "Information Security Policy", section: "Section 4.2.1" },
    { id: 2, question: "How do I request access to a new system?", answer: "Access requests must be submitted through the IT Service Portal. Your manager must approve the request.", source: "Access Control Policy", section: "Section 3.1" },
    { id: 3, question: "What should I do if I suspect a security incident?", answer: "Immediately report the incident to security@company.com or call the 24/7 hotline.", source: "Incident Response Procedure", section: "Section 2.1" },
    { id: 4, question: "How often are backups performed?", answer: "Critical systems are backed up daily with 30-day retention. Full backups occur weekly.", source: "Business Continuity Plan", section: "Section 4.5" }
  ],
  es: [
    { id: 1, question: "¿Cuáles son los requisitos mínimos de contraseña?", answer: "Las contraseñas deben tener al menos 12 caracteres, mayúsculas, minúsculas, números y caracteres especiales.", source: "Política de Seguridad", section: "Sección 4.2.1" },
    { id: 2, question: "¿Cómo solicito acceso a un nuevo sistema?", answer: "Las solicitudes deben enviarse a través del Portal de Servicios de TI con aprobación del gerente.", source: "Política de Control de Acceso", section: "Sección 3.1" },
    { id: 3, question: "¿Qué debo hacer si sospecho un incidente?", answer: "Informe inmediatamente a security@company.com o llame a la línea directa 24/7.", source: "Procedimiento de Incidentes", section: "Sección 2.1" },
    { id: 4, question: "¿Con qué frecuencia se realizan backups?", answer: "Sistemas críticos: diario con 30 días de retención. Backups completos: semanales.", source: "Plan de Continuidad", section: "Sección 4.5" }
  ],
  pt: [
    { id: 1, question: "Quais são os requisitos mínimos de senha?", answer: "Senhas devem ter pelo menos 12 caracteres, maiúsculas, minúsculas, números e caracteres especiais.", source: "Política de Segurança", section: "Seção 4.2.1" },
    { id: 2, question: "Como solicito acesso a um novo sistema?", answer: "Solicitações devem ser enviadas pelo Portal de Serviços de TI com aprovação do gerente.", source: "Política de Controle de Acesso", section: "Seção 3.1" },
    { id: 3, question: "O que fazer se suspeitar de um incidente?", answer: "Informe imediatamente security@company.com ou ligue para a linha direta 24/7.", source: "Procedimento de Incidentes", section: "Seção 2.1" },
    { id: 4, question: "Com que frequência os backups são feitos?", answer: "Sistemas críticos: diário com 30 dias. Backups completos: semanais.", source: "Plano de Continuidade", section: "Seção 4.5" }
  ]
};

function DocumentsScreen({ setActiveScreen }) {
  const { darkMode, theme: t, language } = useContext(ThemeContext);
  const tr = useTranslation();
  const [chatQuery, setChatQuery] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const labels = chatLabels[language] || chatLabels.en;
  const questions = suggestedQuestions[language] || suggestedQuestions.en;
  const faqs = faqData[language] || faqData.en;

  // Cargar documentos desde backend
  React.useEffect(() => {
    const fetchDocs = async () => {
      try {
        const { documentsAPI } = await import('../services/api');
        const res = await documentsAPI.getAll();
        if (res.documents) setDocuments(res.documents);
      } catch (err) {
        console.error("Error cargando documentos", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleUpdateStatus = async (docId, newStatus) => {
    try {
      const { documentsAPI } = await import('../services/api');
      await documentsAPI.updateStatus(docId, newStatus);
      setDocuments(prev => prev.map(d => d.chapter_id === docId ? { ...d, status: newStatus } : d));
    } catch (err) {
      alert("Error actualizando estado. Recuerda que necesitas ser Administrador.");
    }
  };

  const handleSendMessage = (message) => {
    if (!message.trim()) return;
    const userMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setChatQuery('');
    setIsTyping(true);

    import('../services/api').then(({ chatAPI }) => {
      chatAPI.sendMessage(message).then(res => {
        setIsTyping(false);
        if (res.error) {
          const aiResponse = {
            role: 'assistant',
            content: language === 'es'
              ? `Lo siento, ocurrió un error al consultar a Dani: ${res.error}`
              : `Sorry, an error occurred while consulting Dani: ${res.error}`,
            sources: []
          };
          setChatMessages(prev => [...prev, aiResponse]);
        } else {
          const replyText = res.reply || res.message || "";
          const aiResponse = {
            role: 'assistant',
            content: replyText,
            sources: ['Information Security Policy', 'Access Control Policy']
          };
          setChatMessages(prev => [...prev, aiResponse]);
        }
      }).catch(err => {
        setIsTyping(false);
        const aiResponse = {
          role: 'assistant',
          content: `Error: ${err.message}`,
          sources: []
        };
        setChatMessages(prev => [...prev, aiResponse]);
      });
    });
  };

  const getStatusColor = (s) => (s === 'approved' || s === 'published') ? '#004ac6' : s === 'review' ? '#f59e0b' : '#64748b';

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Gestor Documental</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>Políticas y Documentación del SGSI</p>
        </div>
        <button 
          onClick={() => setActiveScreen && setActiveScreen('doc-generator')}
          style={{ padding: '10px 20px', background: '#004ac6', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
        >
          <Plus size={16} />Crear Documento
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Documents List */}
        <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 0.8fr 1fr 1fr', padding: '14px 24px', background: t.hoverBg, borderBottom: `1px solid ${t.border}`, fontSize: '11px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span>Documento</span><span>Estado</span><span>Versión</span><span>Actualizado</span><span>Firmas</span>
          </div>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: t.textDim }}>Cargando documentos...</div>
          ) : documents.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: t.textDim }}>No hay documentos. Usa el botón superior para generar uno.</div>
          ) : documents.map((doc) => (
            <div key={doc.id || doc.chapter_id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 0.8fr 1fr 1fr', padding: '16px 24px', borderBottom: `1px solid ${t.border}`, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} color="#3b82f6" /></div>
                <span style={{ fontWeight: 500, fontSize: '14px' }}>{doc.name}</span>
              </div>
              <select 
                value={doc.status} 
                onChange={(e) => handleUpdateStatus(doc.chapter_id, e.target.value)}
                style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: `${getStatusColor(doc.status)}22`, color: getStatusColor(doc.status), textTransform: 'capitalize', width: 'fit-content', border: 'none', cursor: 'pointer', outline: 'none' }}
              >
                <option value="draft">Borrador</option>
                <option value="review">Revisión</option>
                <option value="approved">Aprobado</option>
                <option value="published">Publicado</option>
              </select>
              <span style={{ color: t.textMuted, fontSize: '13px' }}>v{doc.version}</span>
              <span style={{ color: t.textDim, fontSize: '13px' }}>{doc.updated}</span>
              <span style={{ fontSize: '13px' }}>{doc.signatures}</span>
            </div>
          ))}
        </div>

        {/* Document Chat & FAQ Panel */}
        <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', height: '580px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}` }}>
            <button onClick={() => setActiveTab('chat')} style={{ flex: 1, padding: '16px', background: activeTab === 'chat' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)' : 'transparent', border: 'none', borderBottom: activeTab === 'chat' ? '2px solid #8b5cf6' : '2px solid transparent', color: activeTab === 'chat' ? '#8b5cf6' : t.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
              <MessageSquare size={16} /> {labels.chat}
            </button>
            <button onClick={() => setActiveTab('faq')} style={{ flex: 1, padding: '16px', background: activeTab === 'faq' ? 'linear-gradient(135deg, rgba(0, 74, 198, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)' : 'transparent', border: 'none', borderBottom: activeTab === 'faq' ? '2px solid #004ac6' : '2px solid transparent', color: activeTab === 'faq' ? '#004ac6' : t.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
              <HelpCircle size={16} /> {labels.faq}
            </button>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '16px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                      <Search size={24} color="#8b5cf6" />
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: t.text }}>{labels.askAnything}</h4>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {questions.slice(0, 3).map((question, idx) => (
                        <button key={idx} onClick={() => handleSendMessage(question)} style={{ width: '100%', padding: '10px 12px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '8px', color: t.text, fontSize: '11px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sparkles size={12} color="#8b5cf6" />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{question}</span>
                          <ChevronRight size={12} color={t.textDim} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', background: msg.role === 'user' ? 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' : t.inputBg, color: msg.role === 'user' ? 'white' : t.text, fontSize: '12px', lineHeight: '1.5' }}>
                          {msg.content}
                        </div>
                        {msg.sources && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '9px', color: t.textDim, textTransform: 'uppercase' }}>{labels.sources}:</span>
                            {msg.sources.map((s, i) => <span key={i} style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', borderRadius: '4px' }}>{s}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                    {isTyping && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: t.inputBg, borderRadius: '12px', maxWidth: '85%' }}>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8b5cf6', animation: 'bounce 1s infinite' }} />
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8b5cf6', animation: 'bounce 1s infinite 0.2s' }} />
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#8b5cf6', animation: 'bounce 1s infinite 0.4s' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: t.textDim }}>{labels.searching}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', gap: '8px', background: t.inputBg, borderRadius: '10px', padding: '6px 10px', border: `1px solid ${t.border}` }}>
                  <input type="text" value={chatQuery} onChange={(e) => setChatQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(chatQuery)} placeholder={labels.placeholder} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.text, fontSize: '13px' }} />
                  <button onClick={() => handleSendMessage(chatQuery)} disabled={!chatQuery.trim()} style={{ width: '32px', height: '32px', borderRadius: '8px', background: chatQuery.trim() ? 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)' : t.hoverBg, border: 'none', cursor: chatQuery.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={14} color={chatQuery.trim() ? 'white' : t.textDim} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {faqs.map((faq) => (
                  <div key={faq.id} style={{ background: expandedFaq === faq.id ? (darkMode ? 'rgba(0, 74, 198, 0.08)' : 'rgba(0, 74, 198, 0.05)') : t.inputBg, border: `1px solid ${expandedFaq === faq.id ? 'rgba(0, 74, 198, 0.3)' : t.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                    <button onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)} style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px', textAlign: 'left' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: expandedFaq === faq.id ? 'rgba(0, 74, 198, 0.2)' : t.hoverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ChevronDown size={14} color={expandedFaq === faq.id ? '#004ac6' : t.textDim} style={{ transform: expandedFaq === faq.id ? 'rotate(180deg)' : 'rotate(0)' }} />
                      </div>
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: expandedFaq === faq.id ? '#004ac6' : t.text, lineHeight: '1.4' }}>{faq.question}</span>
                    </button>
                    {expandedFaq === faq.id && (
                      <div style={{ padding: '0 16px 16px 52px' }}>
                        <p style={{ fontSize: '12px', color: t.textMuted, lineHeight: '1.6', marginBottom: '12px' }}>{faq.answer}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', borderRadius: '4px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={10} /> {faq.source}</span>
                          <span style={{ fontSize: '10px', padding: '4px 8px', background: t.hoverBg, color: t.textDim, borderRadius: '4px' }}>{faq.section}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: t.textDim }}>{language === 'es' ? '¿No encuentras lo que buscas?' : language === 'pt' ? 'Não encontrou o que procura?' : "Can't find what you're looking for?"}</span>
                <button onClick={() => setActiveTab('chat')} style={{ background: 'transparent', border: 'none', color: '#8b5cf6', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>{language === 'es' ? 'Pregunta a Dani' : language === 'pt' ? 'Pergunte ao Dani' : 'Ask Dani'} <ArrowRight size={12} /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentsScreen;