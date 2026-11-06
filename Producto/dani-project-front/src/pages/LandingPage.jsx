import React, { useState } from 'react';
import { ShieldCheck, LockKeyhole, BarChart3, Scale, ArrowRight, Menu } from 'lucide-react';

const LandingPage = () => {
  const [activeSolution, setActiveSolution] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [activeNormative, setActiveNormative] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const solutions = [
    {
      title: 'Gestión de riesgos', subtitle: 'Identifica, evalúa y prioriza', icon: <ShieldCheck size={24} />,
      description: 'Centraliza los riesgos de la organización, analiza su impacto y facilita el seguimiento de las medidas necesarias para reducirlos.',
      points: ['Identificación de riesgos', 'Evaluación y priorización', 'Seguimiento de acciones', 'Visión centralizada']
    },
    {
      title: 'Análisis GAP', subtitle: 'Detecta las brechas de cumplimiento', icon: <BarChart3 size={24} />,
      description: 'Compara la situación actual de la organización con los requisitos establecidos e identifica qué elementos se encuentran cumplidos, parciales o pendientes.',
      points: ['Evaluación del estado actual', 'Identificación de brechas', 'Priorización de mejoras', 'Seguimiento del avance']
    },
    {
      title: 'Cumplimiento', subtitle: 'Organiza requisitos y controles', icon: <Scale size={24} />,
      description: 'Gestiona requisitos, controles y obligaciones dentro de una estructura centralizada para facilitar su revisión y seguimiento.',
      points: ['Requisitos centralizados', 'Controles asociados', 'Estado de cumplimiento', 'Trazabilidad']
    },
    {
      title: 'Privacidad', subtitle: 'Protección de datos personales', icon: <LockKeyhole size={24} />,
      description: 'Apoya la gestión de información relacionada con privacidad, tratamiento de datos personales y obligaciones de protección de datos.',
      points: ['Tratamiento de datos', 'Protección de información', 'Seguimiento de obligaciones', 'Gestión organizada']
    },
    {
      title: 'Evidencias', subtitle: 'Respalda el cumplimiento', icon: <ShieldCheck size={24} />,
      description: 'Mantén organizada la documentación y los respaldos asociados a controles, requisitos y acciones realizadas dentro de la organización.',
      points: ['Documentos centralizados', 'Respaldo de controles', 'Organización de evidencias', 'Mayor trazabilidad']
    }
  ];

  const steps = [
    { number: '01', title: 'Evalúa', description: 'La organización registra y revisa su situación actual para conocer el punto de partida de su gestión de cumplimiento.' },
    { number: '02', title: 'Detecta', description: 'NormIA permite identificar requisitos pendientes, brechas y elementos que requieren mayor atención.' },
    { number: '03', title: 'Prioriza', description: 'Los riesgos y brechas detectados pueden organizarse para determinar qué acciones deben abordarse primero.' },
    { number: '04', title: 'Gestiona', description: 'Se realiza seguimiento de acciones, evidencias y avances para mantener una visión actualizada del cumplimiento.' }
  ];

  const normatives = [
    {
      short: 'ISO 27001', title: 'ISO/IEC 27001', tag: 'SEGURIDAD DE LA INFORMACIÓN', icon: <ShieldCheck size={36} />,
      description: 'NormIA apoya la gestión de aspectos relacionados con seguridad de la información, permitiendo organizar requisitos, controles, evidencias y brechas.',
      items: ['Controles de seguridad', 'Evaluación de cumplimiento', 'Gestión de evidencias', 'Identificación de brechas']
    },
    {
      short: 'Ley 21.719', title: 'Ley N.º 21.719', tag: 'PROTECCIÓN DE DATOS PERSONALES', icon: <LockKeyhole size={36} />,
      description: 'Incorpora elementos relacionados con la protección y tratamiento de datos personales para apoyar el seguimiento de las obligaciones de la organización.',
      items: ['Protección de datos', 'Tratamiento de información', 'Seguimiento de obligaciones', 'Privacidad']
    },
    {
      short: 'GRC', title: 'Gobernanza, Riesgo y Cumplimiento', tag: 'GESTIÓN INTEGRADA', icon: <Scale size={36} />,
      description: 'Integra gobernanza, gestión de riesgos y cumplimiento para entregar una visión centralizada de los procesos relevantes de la organización.',
      items: ['Gobernanza', 'Gestión de riesgos', 'Cumplimiento', 'Seguimiento']
    }
  ];

  return (
    <div className="landing-wrapper" style={{ minHeight: '100vh', background: '#ffffff', color: '#1e293b', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* HEADER TIPO NAVBAR FIJO */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f1f5f9', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bae6fd' }}>
            <ShieldCheck size={20} color="#0ea5e9" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Norm<span style={{ color: '#0ea5e9' }}>IA</span></span>
        </a>
        
        {/* NAVEGACIÓN DESKTOP */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a href="#quienes-somos" style={{ textDecoration: 'none', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Quiénes somos</a>
          <a href="#soluciones" style={{ textDecoration: 'none', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Soluciones</a>
          <a href="#como-funciona" style={{ textDecoration: 'none', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Cómo funciona</a>
          <a href="#normativas" style={{ textDecoration: 'none', color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Normativas</a>
          <a href="/login" style={{ padding: '8px 16px', background: '#0ea5e9', color: 'white', textDecoration: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, boxShadow: '0 2px 4px rgba(14,165,233,0.2)' }}>
            Iniciar sesión
          </a>
        </nav>

        {/* BOTONES MÓVIL */}
        <div className="mobile-nav-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a href="/login" style={{ padding: '8px 12px', background: '#0ea5e9', color: 'white', textDecoration: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
            Ingresar
          </a>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'transparent', border: 'none', color: '#64748b', padding: '4px', cursor: 'pointer' }}>
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* MENÚ MÓVIL DESPLEGABLE */}
      {isMobileMenuOpen && (
        <div className="mobile-menu" style={{ position: 'fixed', top: '57px', left: 0, right: 0, background: 'white', borderBottom: '1px solid #f1f5f9', zIndex: 49, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <a href="#quienes-somos" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#475569', fontSize: '14px', fontWeight: 600 }}>Quiénes somos</a>
          <a href="#soluciones" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#475569', fontSize: '14px', fontWeight: 600 }}>Soluciones</a>
          <a href="#como-funciona" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#475569', fontSize: '14px', fontWeight: 600 }}>Cómo funciona</a>
          <a href="#normativas" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#475569', fontSize: '14px', fontWeight: 600 }}>Normativas</a>
        </div>
      )}

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', overflow: 'hidden' }}>
        
        {/* HERO SECTION */}
        <section id="inicio" className="hero-section" style={{ paddingTop: '40px', paddingBottom: '48px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '40px' }}>
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#f1f5f9', borderRadius: '999px', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '16px' }}>
              <span>Gobernanza</span> <span style={{ color: '#cbd5e1' }}>•</span> <span>Riesgo</span> <span style={{ color: '#cbd5e1' }}>•</span> <span>Cumplimiento</span> <span style={{ color: '#cbd5e1' }}>•</span> <span style={{ color: '#0ea5e9' }}>IA</span>
            </div>
            
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, color: '#0f172a', marginBottom: '16px', letterSpacing: '-1px' }}>
              Gestiona tu cumplimiento <span style={{ color: '#0ea5e9', display: 'block' }}>de forma más simple e inteligente.</span>
            </h1>
            
            <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#475569', marginBottom: '24px', maxWidth: '540px' }}>
              NormIA centraliza la gestión de riesgos, seguridad de la información, protección de datos y cumplimiento normativo en una plataforma clara, moderna y fácil de utilizar.
            </p>

            <div className="hero-buttons" style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
              <a href="/login" style={{ padding: '12px 24px', background: '#0ea5e9', color: 'white', textDecoration: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(14,165,233,0.25)', flex: 1, whiteSpace: 'nowrap' }}>
                Comenzar ahora <ArrowRight size={16} />
              </a>
              <a href="#quienes-somos" style={{ padding: '12px 24px', background: 'white', color: '#334155', textDecoration: 'none', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 1, whiteSpace: 'nowrap' }}>
                Conocer NormIA
              </a>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              {['Información centralizada', 'Seguimiento continuo', 'Apoyo con IA'].map(txt => (
                <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                  <ShieldCheck size={14} color="#0ea5e9" /> {txt}
                </div>
              ))}
            </div>
          </div>

          {/* TARJETA INTERACTIVA PREVIEW */}
          <div className="hero-preview" style={{ flex: '1 1 400px', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', padding: '24px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}><ShieldCheck size={20} /></div>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NormIA Hub</span>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Gestión centralizada</h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>ISO</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>27001</span>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>Ley</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>21.719</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Gestión de cumplimiento</span>
                <span style={{ color: '#0ea5e9' }}>Centralizada</span>
              </div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '75%', background: 'linear-gradient(90deg, #38bdf8, #0284c7)' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Detecta brechas oportunamente', 'Gestiona evidencias auditables', 'Apoyo inteligente contextual'].map(txt => (
                <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>✓</div>
                  {txt}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* QUIENES SOMOS */}
        <section id="quienes-somos" style={{ paddingTop: '64px', paddingBottom: '64px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px' }}>Quiénes somos</span>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#0f172a', margin: '8px 0', lineHeight: 1.2 }}>Tecnología creada para simplificar el cumplimiento</h2>
            <p style={{ fontSize: '14px', color: '#475569', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>NormIA es una plataforma orientada a facilitar la gestión de gobernanza, riesgos y cumplimiento dentro de las organizaciones.</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center' }}>
            <div style={{ flex: '1 1 300px', padding: '24px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '40px', fontWeight: 900, color: '#0ea5e9', marginBottom: '8px' }}>GRC</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Gobernanza, riesgo y cumplimiento integrado</span>
            </div>
            <div style={{ flex: '1 1 300px', padding: '24px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '40px', fontWeight: 900, color: '#0ea5e9', marginBottom: '8px' }}>360°</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Visión centralizada en tiempo real</span>
            </div>
          </div>
        </section>

        {/* SOLUCIONES (TABS) */}
        <section id="soluciones" style={{ paddingTop: '64px', paddingBottom: '64px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ marginBottom: '32px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px' }}>Soluciones</span>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', margin: '8px 0', lineHeight: 1.2 }}>Herramientas que trabajan en conjunto</h2>
            <p style={{ fontSize: '14px', color: '#475569', maxWidth: '600px', lineHeight: 1.6 }}>Explora las principales capacidades de NormIA y descubre cómo cada módulo aporta una gestión más clara.</p>
          </div>

          {/* TABS SCROLLABLES EN MÓVIL */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px' }}>
            {solutions.map((sol, idx) => (
              <button key={idx} onClick={() => setActiveSolution(idx)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, border: `1px solid ${activeSolution === idx ? '#bae6fd' : '#f1f5f9'}`, background: activeSolution === idx ? '#f0f9ff' : '#f8fafc', color: activeSolution === idx ? '#0369a1' : '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>
                {React.cloneElement(sol.icon, { size: 16 })} {sol.title}
              </button>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Solución NormIA</span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>{solutions[activeSolution].title}</h3>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0ea5e9', margin: '0 0 16px' }}>{solutions[activeSolution].subtitle}</p>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>{solutions[activeSolution].description}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {solutions[activeSolution].points.map(pt => (
                <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                  <span style={{ color: '#0ea5e9', fontWeight: 800 }}>✓</span> {pt}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA (STEPS) */}
        <section id="como-funciona" style={{ paddingTop: '64px', paddingBottom: '64px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px' }}>Cómo funciona</span>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', margin: '8px 0', lineHeight: 1.2 }}>Del diagnóstico al seguimiento</h2>
          </div>

          <div className="steps-container" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
            {steps.map((step, idx) => (
              <button key={idx} onClick={() => setActiveStep(idx)} style={{ flex: '1 0 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: activeStep === idx ? '#0ea5e9' : 'white', border: `2px solid ${activeStep === idx ? '#0ea5e9' : '#cbd5e1'}`, color: activeStep === idx ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, transition: 'all 0.2s', boxShadow: activeStep === idx ? '0 4px 12px rgba(14,165,233,0.3)' : 'none' }}>
                  {step.number}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: activeStep === idx ? '#0369a1' : '#64748b' }}>{step.title}</span>
              </button>
            ))}
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, flexShrink: 0 }}>
              {steps[activeStep].number}
            </div>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Etapa del proceso</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '4px 0 8px' }}>{steps[activeStep].title}</h3>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{steps[activeStep].description}</p>
            </div>
          </div>
        </section>

        {/* INTELIGENCIA ARTIFICIAL */}
        <section style={{ margin: '32px 0', padding: '40px 24px', background: '#0f172a', borderRadius: '24px', color: 'white' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#1e293b', borderRadius: '999px', fontSize: '10px', fontWeight: 700, color: '#38bdf8', marginBottom: '16px', border: '1px solid #334155' }}>
            <ShieldCheck size={14} /> INTELIGENCIA ARTIFICIAL
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.2 }}>Tecnología que apoya tus procesos de cumplimiento</h2>
          <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '24px', maxWidth: '600px' }}>
            NormIA incorpora herramientas de IA para apoyar el análisis de información, facilitar la interpretación de resultados y entregar una experiencia más ágil.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Apoyo en análisis de información', 'Mayor claridad en los resultados', 'Procesos más ágiles'].map(txt => (
              <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: '#e2e8f0' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>✓</div>
                {txt}
              </div>
            ))}
          </div>
        </section>

        {/* NORMATIVAS */}
        <section id="normativas" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
          <div style={{ marginBottom: '32px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px' }}>Normativas y Marcos</span>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, color: '#0f172a', margin: '8px 0', lineHeight: 1.2 }}>Cumplimiento adaptado a los desafíos actuales</h2>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {normatives.map((norm, idx) => (
              <button key={idx} onClick={() => setActiveNormative(idx)} style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', background: activeNormative === idx ? '#0ea5e9' : '#f1f5f9', color: activeNormative === idx ? 'white' : '#475569', cursor: 'pointer', transition: 'all 0.2s' }}>
                {norm.short}
              </button>
            ))}
          </div>

          <div style={{ background: '#f0f9ff', border: '1px solid #e0f2fe', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'white', border: '1px solid #bae6fd', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                {React.cloneElement(normatives[activeNormative].icon, { size: 28 })}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{normatives[activeNormative].tag}</span>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 12px' }}>{normatives[activeNormative].title}</h3>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{normatives[activeNormative].description}</p>
            </div>
            
            <div style={{ background: 'white', borderRadius: '16px', padding: '16px', border: '1px solid #e0f2fe' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '12px' }}>Áreas relacionadas</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                {normatives[activeNormative].items.map((item, idx) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                    <span style={{ color: '#0ea5e9', fontWeight: 800 }}>0{idx+1}</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ margin: '40px 0', padding: '48px 24px', background: 'linear-gradient(135deg, #f0f9ff, #f8fafc)', borderRadius: '24px', border: '1px solid #e0f2fe', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>Gestiona • Analiza • Mejora</span>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.2 }}>Convierte el cumplimiento en un proceso más claro y controlable</h2>
          <p style={{ fontSize: '14px', color: '#475569', margin: '0 auto 24px', maxWidth: '600px', lineHeight: 1.6 }}>Centraliza la información de tu organización, identifica brechas y realiza seguimiento de tus avances con NormIA.</p>
          <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: '#0ea5e9', color: 'white', textDecoration: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 12px rgba(14,165,233,0.25)' }}>
            Ingresar a NormIA <ArrowRight size={16} />
          </a>
        </section>

      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #f1f5f9', padding: '32px 16px', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#e0f2fe', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={14} /></div>
              <strong style={{ fontSize: '16px', color: '#0f172a' }}>NormIA</strong>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, maxWidth: '300px' }}>Gobernanza, riesgo, cumplimiento y protección de datos en una plataforma centralizada.</p>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            Seguridad • Cumplimiento • Confianza
          </div>
        </div>
      </footer>

      {/* ESTILOS GLOBALES INYECTADOS */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .mobile-nav-buttons { display: flex; }
        .desktop-nav { display: none !important; }

        @media (min-width: 768px) {
          .mobile-nav-buttons { display: none !important; }
          .desktop-nav { display: flex !important; }
          .hero-section { flex-wrap: nowrap !important; }
          .hero-buttons a { flex: 0 1 auto !important; }
        }
      `}} />
    </div>
  );
};

export default LandingPage;