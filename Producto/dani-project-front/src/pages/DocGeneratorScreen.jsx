/* eslint-disable */
import React, { useState, useContext, useEffect } from 'react';
import { 
  Download, Building2, Users, Target, HelpCircle, Zap, Search, RefreshCw,
  Wand2, GitBranch, Edit2, Eye, UserCheck, CheckCircle, Send, 
  ArrowLeftRight, Edit3, Tag, History, Sparkles, FileText, Loader2
} from 'lucide-react';
import { ThemeContext } from '../contexts/ThemeContext';
import { documentsAPI } from '../services/api';

// NUEVO: Importamos la librería para crear PDFs profesionales
import html2pdf from 'html2pdf.js';
import { useAuth } from '../contexts/AuthContext';

const DocGeneratorScreen = ({ navParams }) => {
  const { theme: t, darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  
  const canApprove = user && ['admin', 'manager', 'auditor'].includes(user?.role);

  const [selectedChapter, setSelectedChapter] = useState(null);
  const [generatedContent, setGeneratedContent] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentContent, setDocumentContent] = useState({});
  const [documentStatus, setDocumentStatus] = useState({});
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [targetControl, setTargetControl] = useState(null);
  const [targetControlTitle, setTargetControlTitle] = useState(null);

  useEffect(() => {
    if (selectedChapter) {
      const loadDocument = async () => {
        setIsLoadingDoc(true);
        try {
          const res = await documentsAPI.getDocument(`chapter_${selectedChapter.id}`);
          if (res && res.content) {
            setGeneratedContent(prev => ({ ...prev, [selectedChapter.id]: res.content }));
            setDocumentContent(prev => ({ ...prev, [selectedChapter.id]: res.content }));
            setDocumentStatus(prev => ({ ...prev, [selectedChapter.id]: res.status }));
          }
        } catch (error) {
          console.log("No existing document found or error fetching", error);
        } finally {
          setIsLoadingDoc(false);
        }
      };
      loadDocument();
    }
  }, [selectedChapter]);

  const chapters = [
    // --- ISO 27001 ---
    { id: 4, number: '4', title: 'Contexto de la Organización', sections: '4 sections', icon: Building2, color: '#3b82f6' },
    { id: 5, number: '5', title: 'Liderazgo', sections: '3 sections', icon: Users, color: '#f59e0b' },
    { id: 6, number: '6', title: 'Planificación', sections: '2 sections', icon: Target, color: '#10b981' },
    { id: 7, number: '7', title: 'Apoyo', sections: '5 sections', icon: HelpCircle, color: '#8b5cf6' },
    { id: 8, number: '8', title: 'Operación', sections: '3 sections', icon: Zap, color: '#ec4899' },
    { id: 9, number: '9', title: 'Evaluación del Desempeño', sections: '3 sections', icon: Search, color: '#0ea5e9' },
    { id: 10, number: '10', title: 'Mejora', sections: '2 sections', icon: RefreshCw, color: '#ef4444' },
    
    // --- LEY N° 21.719 ---
    { id: 'ley_pol', number: 'Ley 21.719', title: 'Política de Tratamiento de Datos', sections: 'Obligaciones O1, O2, O3', icon: FileText, color: '#8b5cf6' },
    { id: 'ley_bre', number: 'Ley 21.719', title: 'Protocolo de Gestión de Brechas', sections: 'Obligación O4', icon: AlertTriangle, color: '#ef4444' }
  ];

  const totalGenerated = Object.keys(generatedContent).length;
  const progressPercent = Math.round((totalGenerated / chapters.length) * 100);

  // NUEVO: Escuchar navParams para auto-seleccionar capítulo
  useEffect(() => {
    if (navParams && navParams.targetChapterNumber) {
      const targetStr = String(navParams.targetChapterNumber);
      const targetChapter = chapters.find(c => c.number === targetStr);
      if (targetChapter) {
        setSelectedChapter(targetChapter);
        if (navParams.targetControlId) {
          setTargetControl(navParams.targetControlId);
          setTargetControlTitle(navParams.targetControlTitle || null);
        } else {
          setTargetControl(null);
          setTargetControlTitle(null);
        }
      }
    }
  }, [navParams]);

  const handleGenerate = async () => {
    if (!selectedChapter) return;
    setIsGenerating(true);
    
    try {
      const promptData = { 
        title: selectedChapter.title,
        chapter_number: selectedChapter.number,
        target_control: targetControl || null,
        target_control_title: targetControlTitle || null
      };
      
      const response = await documentsAPI.generate(`chapter_${selectedChapter.id}`, promptData);
      const text = response.content || response.text || response.generated_text;
      
      if (!text) throw new Error("La API no devolvió contenido de texto.");

      setGeneratedContent(prev => ({ ...prev, [selectedChapter.id]: text }));
      setDocumentContent(prev => ({ ...prev, [selectedChapter.id]: text }));

      try {
        await documentsAPI.saveDocument(`chapter_${selectedChapter.id}`, selectedChapter.title, text);
        setDocumentStatus(prev => ({ ...prev, [selectedChapter.id]: 'draft' }));
      } catch (saveError) {
        console.error("Error saving to DB:", saveError);
      }

    } catch (error) {
      console.error("Error conectando con la API de IA:", error);
      const fallbackText = `# ${selectedChapter.number}. ${selectedChapter.title}\n\n## 1. Objetivo\n\nEstablece los lineamientos para el cumplimiento del capítulo ${selectedChapter.number} de la norma ISO 27001:2022, asegurando la confidencialidad, integridad y disponibilidad de la información de la organización.\n\n## 2. Alcance\n\nAplica a todos los procesos, sistemas y personal de la organización que interactúan con activos de información.\n\n## 3. Responsabilidades\n\n### 3.1 Alta Dirección\nProveer los recursos necesarios y demostrar liderazgo en el sistema de gestión de seguridad de la información (SGSI).\n\n### 3.2 Responsable de Seguridad (CISO)\nDefinir, implementar y mantener los controles asociados a este capítulo.\n\n### 3.3 Todo el Personal\nConocer y cumplir las disposiciones establecidas en este documento.\n\n## 4. Procedimiento\n\nLa organización debe revisar y actualizar periódicamente los controles establecidos en este capítulo, documentando los resultados y evidencias correspondientes conforme a los requisitos de la norma ISO 27001:2022.\n\n## 5. Registros\n\nSe mantendrán registros de todas las actividades realizadas en el marco de este capítulo, con una retención mínima de 3 años.\n\n## 6. Referencias\n\n- ISO/IEC 27001:2022 — Cláusula ${selectedChapter.number}\n- ISO/IEC 27002:2022 — Guía de implementación\n\n---\n*[MODO DEMO — Documento generado sin conexión a la API]*`;

      setGeneratedContent(prev => ({ ...prev, [selectedChapter.id]: fallbackText }));
      setDocumentContent(prev => ({ ...prev, [selectedChapter.id]: fallbackText }));
    } finally {
      setIsGenerating(false);
    }
  };

  // ==========================================
  // NUEVO: EXPORTACIÓN A PDF CON HTML2PDF
  // ==========================================
  const handleExportDocument = () => {
    const contentToExport = documentContent[selectedChapter?.id];
    
    if (!contentToExport) {
      alert("⚠️ Primero debes generar o escribir el borrador de un capítulo para poder exportarlo.");
      return;
    }

    // 1. Inyectamos el logo (texto), la fecha y el título del documento
    const today = new Date().toLocaleDateString();
    let htmlContent = `
      <div style="font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #333; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between;">
          <strong style="font-size: 24px; color: #10b981;">DANI GR&C</strong>
          <span style="color: #666;">ISO 27001 - ${today}</span>
        </div>
    `;

    // Parseamos el Markdown a HTML estructurado y bonito
    htmlContent += contentToExport.split('\n').map(line => {
      if (line.startsWith('# ')) return `<h1 style="color: #1e293b; font-size: 24px; margin-bottom: 20px;">${line.substring(2)}</h1>`;
      if (line.startsWith('## ')) return `<h2 style="color: #3b82f6; font-size: 18px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">${line.substring(3)}</h2>`;
      if (line.startsWith('### ')) return `<h3 style="color: #0f172a; font-size: 15px; margin-top: 16px; margin-bottom: 8px;">${line.substring(4)}</h3>`;
      if (line.trim() === '') return `<br/>`;
      return `<p style="line-height: 1.6; font-size: 14px; margin-bottom: 10px; text-align: justify;">${line}</p>`;
    }).join('');

    htmlContent += `</div>`;
    // 2. Configuramos las opciones del PDF (tamaño carta, márgenes, etc.)
    const options = {
      margin:       0.5, // Media pulgada de margen
      filename:     `ISO_27001_Capitulo_${selectedChapter.number}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' }, // Mayor escala = Mayor resolución
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // 3. Pasamos el HTML directamente como string (evita problemas de elementos invisibles o coords negativas)
    html2pdf().set(options).from(htmlContent).save().catch(err => {
      console.error("Error generando PDF:", err);
    });
  };

  const renderMarkdown = (text, activeColor) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('# ')) return <h1 key={idx} style={{ fontSize: '24px', fontWeight: 700, color: activeColor, marginBottom: '24px' }}>{line.substring(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={idx} style={{ fontSize: '18px', fontWeight: 700, color: t.text, marginTop: '24px', marginBottom: '12px' }}>{line.substring(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={idx} style={{ fontSize: '15px', fontWeight: 600, color: t.text, marginTop: '16px', marginBottom: '8px' }}>{line.substring(4)}</h3>;
      if (line.trim() === '') return <div key={idx} style={{ height: '12px' }} />;
      return <p key={idx} style={{ color: t.textDim, lineHeight: '1.6', fontSize: '14px' }}>{line}</p>;
    });
  };

  const advanceWorkflow = async () => {
    if (!selectedChapter) return;
    const currentStatus = documentStatus[selectedChapter.id] || 'draft';
    
    if ((currentStatus === 'review' || currentStatus === 'approved') && !canApprove) {
      alert("No tienes permisos suficientes para aprobar o publicar documentos.");
      return;
    }
    
    let nextStatus = 'review';
    if (currentStatus === 'review') nextStatus = 'approved';
    if (currentStatus === 'approved') nextStatus = 'published';
    if (currentStatus === 'published') return;
    
    try {
      await documentsAPI.updateStatus(`chapter_${selectedChapter.id}`, nextStatus);
      setDocumentStatus(prev => ({ ...prev, [selectedChapter.id]: nextStatus }));
      alert(`El documento ha avanzado al estado: ${nextStatus.toUpperCase()}`);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error al actualizar el estado del documento.");
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* ENCABEZADO Y BARRA DE PROGRESO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: t.text, marginBottom: '8px' }}>Generador de Documentos ISO 27001</h1>
          <p style={{ color: t.textDim, fontSize: '15px' }}>Genera documentación compatible con asistencia de IA</p>
        </div>
        <button 
          onClick={handleExportDocument}
          style={{ padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
        >
          <Download size={16} /> Descargar PDF
        </button>
      </div>

      <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '16px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: t.textDim, marginBottom: '12px' }}>
          <span>Progreso Total</span>
          <span style={{ color: '#10b981', fontWeight: 700 }}>{totalGenerated}/7 Capítulos</span>
        </div>
        <div style={{ height: '8px', background: t.inputBg, borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* PANEL IZQUIERDO: LISTA DE CAPÍTULOS */}
        <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, color: t.textDim, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>CAPÍTULOS</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {chapters.map((chapter) => {
              const isSelected = selectedChapter?.id === chapter.id;
              const Icon = chapter.icon;

              return (
                <button 
                  key={chapter.id} 
                  onClick={() => { setSelectedChapter(chapter); setTargetControl(null); setTargetControlTitle(null); }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', 
                    background: isSelected ? `${chapter.color}15` : 'transparent', 
                    border: `1px solid ${isSelected ? chapter.color : 'transparent'}`, 
                    borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' 
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isSelected ? `${chapter.color}20` : t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={isSelected ? chapter.color : t.textDim} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? t.text : t.textDim, lineHeight: '1.4' }}>
                      {chapter.number}. {chapter.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PANEL DERECHO: ÁREA DE TRABAJO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: 0 }}>
          
          {/* ESTADO 1: Nada seleccionado */}
          {!selectedChapter && (
            <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: t.textDim }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: t.text, marginBottom: '8px' }}>Selecciona un capítulo para comenzar</h2>
              <p style={{ fontSize: '14px' }}>Elige un capítulo del panel izquierdo para comenzar</p>
            </div>
          )}

          {/* ESTADO 2: Capítulo seleccionado, pero NO generado */}
          {selectedChapter && !generatedContent[selectedChapter.id] && (
            <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${selectedChapter.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <selectedChapter.icon size={24} color={selectedChapter.color} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: t.text }}>{selectedChapter.number}. {selectedChapter.title}</h2>
                    <p style={{ fontSize: '13px', color: t.textDim }}>{selectedChapter.sections}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {documentStatus[selectedChapter.id] === 'published' ? (
                    <div style={{ padding: '10px 20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10b981', fontWeight: 500, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} /> Documento Publicado (Bloqueado)
                    </div>
                  ) : (
                    <button 
                      onClick={handleGenerate} 
                      disabled={isGenerating}
                      style={{ padding: '10px 20px', background: isGenerating ? 'rgba(139,92,246,0.3)' : '#8b5cf6', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 600, fontSize: '13px', cursor: isGenerating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                    >
                      {isGenerating ? <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                      {isGenerating ? 'Generando Borrador...' : (generatedContent[selectedChapter.id] ? 'Regenerar con IA' : 'Generar Borrador')}
                    </button>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: `${selectedChapter.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  {isGenerating ? <Loader2 size={36} color={selectedChapter.color} className="animate-spin" /> : <Wand2 size={36} color={selectedChapter.color} />}
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: t.text, marginBottom: '12px' }}>Generar Borrador {selectedChapter.number}</h2>
                <p style={{ fontSize: '15px', color: t.textDim, maxWidth: '400px', lineHeight: '1.5', marginBottom: '32px' }}>
                  La IA generará un borrador en el panel izquierdo que podrás editar en el derecho.
                </p>
                <button onClick={handleGenerate} disabled={isGenerating} style={{ padding: '14px 32px', background: selectedChapter.color, border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', opacity: isGenerating ? 0.7 : 1 }}>
                  {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />} 
                  {isGenerating ? 'Conectando con IA...' : 'Generar Borrador'}
                </button>
              </div>
            </div>
          )}

          {/* ESTADO 3: Vista Dividida (Split View) */}
          {selectedChapter && generatedContent[selectedChapter.id] && (
            <>
              <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <GitBranch size={18} color={t.textDim} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: t.text }}>Flujo de Aprobación</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {(() => {
                    const currentStatus = documentStatus[selectedChapter.id] || 'draft';
                    const isReview = currentStatus === 'review' || currentStatus === 'approved' || currentStatus === 'published';
                    const isApproved = currentStatus === 'approved' || currentStatus === 'published';
                    
                    return (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#3b82f6', border: `2px solid #3b82f6`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={16} color="white" /></div>
                          <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>Borrador</span>
                        </div>
                        <div style={{ width: '40px', height: '2px', background: isReview ? '#f59e0b' : t.border, margin: '0 10px', alignSelf: 'flex-start', marginTop: '18px', transition: 'all 0.3s ease' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: isReview ? 1 : 0.4, transition: 'all 0.3s ease' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isReview ? '#f59e0b' : 'transparent', border: `2px solid ${isReview ? '#f59e0b' : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={16} color={isReview ? 'white' : t.textDim} /></div>
                          <span style={{ fontSize: '11px', color: isReview ? '#f59e0b' : t.textDim, fontWeight: isReview ? 600 : 500 }}>Revisión</span>
                        </div>
                        <div style={{ width: '40px', height: '2px', background: isApproved ? '#10b981' : t.border, margin: '0 10px', alignSelf: 'flex-start', marginTop: '18px', opacity: isReview ? 1 : 0.4, transition: 'all 0.3s ease' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: isApproved ? 1 : 0.4, transition: 'all 0.3s ease' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isApproved ? '#10b981' : 'transparent', border: `2px solid ${isApproved ? '#10b981' : t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCheck size={16} color={isApproved ? 'white' : t.textDim} /></div>
                          <span style={{ fontSize: '11px', color: isApproved ? '#10b981' : t.textDim, fontWeight: isApproved ? 600 : 500 }}>Aprobado</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {(() => {
                  const currentStatus = documentStatus[selectedChapter.id] || 'draft';
                  const isDraft = currentStatus === 'draft';
                  const isReview = currentStatus === 'review';
                  const isApproved = currentStatus === 'approved';
                  const isPublished = currentStatus === 'published';
                  
                  let btnText = 'Enviar a Revisión';
                  let isDisabled = isPublished;
                  let btnBg = isPublished ? t.hoverBg : '#10b981';
                  let btnColor = isPublished ? t.textDim : 'white';
                  
                  if (isReview) {
                    if (canApprove) {
                      btnText = 'Aprobar Documento';
                    } else {
                      btnText = 'Esperando Aprobación';
                      isDisabled = true;
                      btnBg = t.hoverBg;
                      btnColor = t.textDim;
                    }
                  } else if (isApproved) {
                    if (canApprove) {
                      btnText = 'Publicar';
                    } else {
                      btnText = 'Esperando Publicación';
                      isDisabled = true;
                      btnBg = t.hoverBg;
                      btnColor = t.textDim;
                    }
                  } else if (isPublished) {
                    btnText = 'Publicado';
                  }

                  return (
                    <button onClick={advanceWorkflow} disabled={isDisabled} style={{ padding: '10px 20px', background: btnBg, border: 'none', borderRadius: '8px', color: btnColor, fontWeight: 600, cursor: isDisabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', transition: 'all 0.2s ease' }}>
                      <Send size={16} /> {btnText}
                    </button>
                  );
                })()}
              </div>

              <div style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.border}`, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${selectedChapter.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <selectedChapter.icon size={22} color={selectedChapter.color} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 700, color: t.text }}>{selectedChapter.number}. {selectedChapter.title}</h2>
                      <p style={{ fontSize: '12px', color: t.textDim }}>{selectedChapter.sections}</p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: '8px', color: t.textDim, fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={14} /> Etiquetado
                    </button>
                    <button onClick={handleGenerate} disabled={isGenerating} style={{ padding: '8px 16px', background: selectedChapter.color, border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: isGenerating ? 0.7 : 1 }}>
                      {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} 
                      {isGenerating ? 'Generando...' : 'Regenerar'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, minHeight: 0 }}>
                  <div style={{ borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 24px', background: `${selectedChapter.color}10`, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color={selectedChapter.color} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: selectedChapter.color }}>Borrador IA</span>
                    </div>
                    <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                      {renderMarkdown(generatedContent[selectedChapter.id], selectedChapter.color)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '12px 24px', background: 'rgba(16, 185, 129, 0.05)', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Edit3 size={16} color="#10b981" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>Tu Documento</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <textarea
                        value={documentContent[selectedChapter.id]}
                        onChange={(e) => setDocumentContent({...documentContent, [selectedChapter.id]: e.target.value})}
                        style={{
                          width: '100%', height: '100%', padding: '32px', background: 'transparent',
                          border: 'none', outline: 'none', color: t.text, fontFamily: 'monospace',
                          fontSize: '14px', lineHeight: '1.8', resize: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocGeneratorScreen;