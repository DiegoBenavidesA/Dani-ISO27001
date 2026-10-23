import React, { useState } from 'react';

import {
  ShieldCheck,
  LockKeyhole,
  BarChart3,
  Scale,
  ArrowRight
} from 'lucide-react';

const benefitBase = {
  position: 'absolute',
  width: '245px',
  minHeight: '125px',
  background: '#FFFFFF',
  borderRadius: '20px',
  padding: '22px',
  boxShadow: '0 12px 35px rgba(22,50,79,.08)',
  border: '1px solid #E4EDF3',
  zIndex: 2
};

const LandingPage = () => {
  const [activeSolution, setActiveSolution] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [activeNormative, setActiveNormative] = useState(0);

  const solutions = [
    {
      title: 'Gestión de riesgos',
      subtitle: 'Identifica, evalúa y prioriza',
      icon: <ShieldCheck size={27} />,
      description:
        'Centraliza los riesgos de la organización, analiza su impacto y facilita el seguimiento de las medidas necesarias para reducirlos.',
      points: [
        'Identificación de riesgos',
        'Evaluación y priorización',
        'Seguimiento de acciones',
        'Visión centralizada'
      ]
    },
    {
      title: 'Análisis GAP',
      subtitle: 'Detecta las brechas de cumplimiento',
      icon: <BarChart3 size={27} />,
      description:
        'Compara la situación actual de la organización con los requisitos establecidos e identifica qué elementos se encuentran cumplidos, parciales o pendientes.',
      points: [
        'Evaluación del estado actual',
        'Identificación de brechas',
        'Priorización de mejoras',
        'Seguimiento del avance'
      ]
    },
    {
      title: 'Cumplimiento',
      subtitle: 'Organiza requisitos y controles',
      icon: <Scale size={27} />,
      description:
        'Gestiona requisitos, controles y obligaciones dentro de una estructura centralizada para facilitar su revisión y seguimiento.',
      points: [
        'Requisitos centralizados',
        'Controles asociados',
        'Estado de cumplimiento',
        'Trazabilidad'
      ]
    },
    {
      title: 'Privacidad',
      subtitle: 'Protección de datos personales',
      icon: <LockKeyhole size={27} />,
      description:
        'Apoya la gestión de información relacionada con privacidad, tratamiento de datos personales y obligaciones de protección de datos.',
      points: [
        'Tratamiento de datos',
        'Protección de información',
        'Seguimiento de obligaciones',
        'Gestión organizada'
      ]
    },
    {
      title: 'Evidencias',
      subtitle: 'Respalda el cumplimiento',
      icon: <ShieldCheck size={27} />,
      description:
        'Mantén organizada la documentación y los respaldos asociados a controles, requisitos y acciones realizadas dentro de la organización.',
      points: [
        'Documentos centralizados',
        'Respaldo de controles',
        'Organización de evidencias',
        'Mayor trazabilidad'
      ]
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Evalúa',
      description:
        'La organización registra y revisa su situación actual para conocer el punto de partida de su gestión de cumplimiento.'
    },
    {
      number: '02',
      title: 'Detecta',
      description:
        'NormIA permite identificar requisitos pendientes, brechas y elementos que requieren mayor atención.'
    },
    {
      number: '03',
      title: 'Prioriza',
      description:
        'Los riesgos y brechas detectados pueden organizarse para determinar qué acciones deben abordarse primero.'
    },
    {
      number: '04',
      title: 'Gestiona',
      description:
        'Se realiza seguimiento de acciones, evidencias y avances para mantener una visión actualizada del cumplimiento.'
    }
  ];

  const normatives = [
    {
      short: 'ISO 27001',
      title: 'ISO/IEC 27001',
      tag: 'SEGURIDAD DE LA INFORMACIÓN',
      icon: <ShieldCheck size={42} />,
      description:
        'NormIA apoya la gestión de aspectos relacionados con seguridad de la información, permitiendo organizar requisitos, controles, evidencias y brechas.',
      items: [
        'Controles de seguridad',
        'Evaluación de cumplimiento',
        'Gestión de evidencias',
        'Identificación de brechas'
      ]
    },
    {
      short: 'Ley 21.719',
      title: 'Ley N.º 21.719',
      tag: 'PROTECCIÓN DE DATOS PERSONALES',
      icon: <LockKeyhole size={42} />,
      description:
        'Incorpora elementos relacionados con la protección y tratamiento de datos personales para apoyar el seguimiento de las obligaciones de la organización.',
      items: [
        'Protección de datos',
        'Tratamiento de información',
        'Seguimiento de obligaciones',
        'Privacidad'
      ]
    },
    {
      short: 'GRC',
      title: 'Gobernanza, Riesgo y Cumplimiento',
      tag: 'GESTIÓN INTEGRADA',
      icon: <Scale size={42} />,
      description:
        'Integra gobernanza, gestión de riesgos y cumplimiento para entregar una visión centralizada de los procesos relevantes de la organización.',
      items: [
        'Gobernanza',
        'Gestión de riesgos',
        'Cumplimiento',
        'Seguimiento'
      ]
    }
  ];

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.brand}>       
          <img
            src="/LogoNormia.png"
            alt="Logo NormIA"
            style={{
              width: '44px',
              height: '44px',
              objectFit: 'contain'
            }}
          />
          <span style={styles.logoText}>NormIA</span>
        </div>

        <nav style={styles.nav}>
          <a href="#inicio" style={styles.navLink}>Inicio</a>
          <a href="#quienes-somos" style={styles.navLink}>Quiénes somos</a>
          <a href="#soluciones" style={styles.navLink}>Soluciones</a>
          <a href="#como-funciona" style={styles.navLink}>Cómo funciona</a>
          <a href="#normativas" style={styles.navLink}>Normativas</a>

          <a href="/login" style={styles.loginButton}>
            Iniciar sesión
          </a>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section id="inicio" style={styles.hero}>
          <div style={styles.heroContent}>
            <span style={styles.badge}>
              Gobernanza · Riesgo · Cumplimiento · Inteligencia Artificial
            </span>

            <h1 style={styles.title}>
              Gestiona tu cumplimiento
              <span style={styles.titleAccent}>
                {' '}de forma más simple e inteligente.
              </span>
            </h1>

            <p style={styles.description}>
              NormIA centraliza la gestión de riesgos, seguridad de la información,
              protección de datos y cumplimiento normativo en una plataforma clara,
              moderna y fácil de utilizar.
            </p>

            <div style={styles.buttons}>
              <a href="/login" style={styles.primaryButton}>
                Comenzar ahora
                <ArrowRight size={18} />
              </a>

              <a href="#quienes-somos" style={styles.secondaryButton}>
                Conocer NormIA
              </a>
            </div>

            <div style={styles.heroChecks}>
              <span style={styles.heroCheck}>
                <ShieldCheck size={18} />
                Información centralizada
              </span>

              <span style={styles.heroCheck}>
                <ShieldCheck size={18} />
                Seguimiento continuo
              </span>

              <span style={styles.heroCheck}>
                <ShieldCheck size={18} />
                Apoyo con IA
              </span>
            </div>
          </div>

          <div style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <div style={styles.previewIcon}>
                <ShieldCheck size={32} />
              </div>

              <div>
                <span style={styles.smallText}>NormIA</span>
                <h3 style={styles.previewTitle}>Gestión centralizada</h3>
              </div>
            </div>

            <div style={styles.previewGrid}>
              <div style={styles.previewItem}>
                <span style={styles.previewNumber}>ISO</span>
                <span style={styles.previewLabel}>27001</span>
              </div>

              <div style={styles.previewItem}>
                <span style={styles.previewNumber}>Ley</span>
                <span style={styles.previewLabel}>21.719</span>
              </div>
            </div>

            <div style={styles.progressBox}>
              <div style={styles.progressText}>
                <span>Gestión de cumplimiento</span>
                <strong>Centralizada</strong>
              </div>

              <div style={styles.progressBar}>
                <div style={styles.progressFill}></div>
              </div>
            </div>

            <div style={styles.previewInfo}>
              <div style={styles.previewInfoItem}>
                <ShieldCheck size={18} />
                <span>Detecta brechas</span>
              </div>

              <div style={styles.previewInfoItem}>
                <BarChart3 size={18} />
                <span>Gestiona evidencias</span>
              </div>

              <div style={styles.previewInfoItem}>
                <Scale size={18} />
                <span>Apoyo inteligente</span>
              </div>
            </div>
          </div>
        </section>

        {/* QUIENES SOMOS */}
        <section id="quienes-somos" style={styles.aboutModernSection}>
          <div style={styles.aboutModernText}>
            <span style={styles.sectionTag}>QUIÉNES SOMOS</span>

            <h2 style={styles.sectionTitleLarge}>
              Tecnología creada para simplificar el cumplimiento
            </h2>

            <p style={styles.aboutParagraph}>
              NormIA es una plataforma orientada a facilitar la gestión de
              gobernanza, riesgos y cumplimiento dentro de las organizaciones.
            </p>

            <p style={styles.aboutParagraph}>
              Nuestra propuesta busca transformar procesos que suelen ser complejos,
              manuales y dispersos en una experiencia más clara, organizada y accesible.
            </p>

            <p style={styles.aboutParagraph}>
              Integramos seguridad de la información, protección de datos,
              seguimiento y apoyo mediante inteligencia artificial en un mismo entorno.
            </p>

            <div style={styles.aboutStats}>
              <div>
                <strong style={styles.aboutStatNumber}>GRC</strong>
                <span style={styles.aboutStatLabel}>
                  Gobernanza, riesgo y cumplimiento
                </span>
              </div>

              <div>
                <strong style={styles.aboutStatNumber}>360°</strong>
                <span style={styles.aboutStatLabel}>
                  Visión centralizada
                </span>
              </div>
            </div>
          </div>

          <div style={styles.aboutVisual}>
            <div style={styles.aboutCircleLarge}>
              <ShieldCheck size={55} />
              <strong style={styles.aboutCircleTitle}>NormIA</strong>
              <span style={styles.aboutCircleText}>
                Cumplimiento inteligente
              </span>
            </div>

            <div style={styles.floatingLabelOne}>ISO 27001</div>
            <div style={styles.floatingLabelTwo}>Ley 21.719</div>
            <div style={styles.floatingLabelThree}>Gestión de riesgos</div>
          </div>
        </section>

        {/* SOLUCIONES */}
        <section id="soluciones" style={styles.solutions}>
          <div style={styles.solutionHeader}>
            <div>
              <span style={styles.sectionTag}>SOLUCIONES</span>

              <h2 style={styles.sectionTitle}>
                Herramientas que trabajan en conjunto
              </h2>
            </div>

            <p style={styles.solutionHeaderText}>
              Explora las principales capacidades de NormIA y descubre cómo
              cada módulo aporta a una gestión más clara y organizada.
            </p>
          </div>

          <div style={styles.solutionTabs}>
            {solutions.map((solution, index) => (
              <button
                key={solution.title}
                onClick={() => setActiveSolution(index)}
                style={
                  activeSolution === index
                    ? styles.solutionTabActive
                    : styles.solutionTab
                }
              >
                <span
                  style={
                    activeSolution === index
                      ? styles.solutionTabIconActive
                      : styles.solutionTabIcon
                  }
                >
                  {solution.icon}
                </span>

                <span style={styles.solutionTabTitle}>
                  {solution.title}
                </span>
              </button>
            ))}
          </div>

          <div style={styles.solutionShowcase}>
            <div style={styles.solutionShowcaseContent}>
              <span style={styles.solutionShowcaseTag}>
                SOLUCIÓN NORMIA
              </span>

              <h3 style={styles.solutionShowcaseTitle}>
                {solutions[activeSolution].title}
              </h3>

              <p style={styles.solutionShowcaseSubtitle}>
                {solutions[activeSolution].subtitle}
              </p>

              <p style={styles.solutionShowcaseDescription}>
                {solutions[activeSolution].description}
              </p>

              <div style={styles.solutionPoints}>
                {solutions[activeSolution].points.map((point) => (
                  <div key={point} style={styles.solutionPoint}>
                    <span style={styles.solutionCheck}>✓</span>
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.solutionVisualArea}>
              <div style={styles.solutionVisualOuter}>
                <div style={styles.solutionVisualMiddle}>
                  <div style={styles.solutionVisualCenter}>
                    {solutions[activeSolution].icon}
                  </div>
                </div>
              </div>

              <div style={styles.solutionVisualLabelTop}>
                Análisis
              </div>

              <div style={styles.solutionVisualLabelRight}>
                Seguimiento
              </div>

              <div style={styles.solutionVisualLabelBottom}>
                Mejora continua
              </div>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" style={styles.howSection}>
          <div style={styles.centerHeading}>
            <span style={styles.sectionTag}>CÓMO FUNCIONA</span>

            <h2 style={styles.sectionTitleLarge}>
              Del diagnóstico al seguimiento
            </h2>

            <p style={styles.centerDescription}>
              Selecciona cada etapa para conocer cómo NormIA acompaña el proceso.
            </p>
          </div>

          <div style={styles.timeline}>
            <div style={styles.timelineLine}></div>

            {steps.map((step, index) => (
              <button
                key={step.number}
                onClick={() => setActiveStep(index)}
                style={styles.timelineButton}
              >
                <div
                  style={
                    activeStep === index
                      ? styles.timelineCircleActive
                      : styles.timelineCircle
                  }
                >
                  {step.number}
                </div>

                <h3
                  style={
                    activeStep === index
                      ? styles.timelineTitleActive
                      : styles.timelineTitle
                  }
                >
                  {step.title}
                </h3>
              </button>
            ))}
          </div>

          <div style={styles.stepDetail}>
            <div style={styles.stepDetailNumber}>
              {steps[activeStep].number}
            </div>

            <div>
              <span style={styles.sectionTag}>ETAPA DEL PROCESO</span>

              <h3 style={styles.stepDetailTitle}>
                {steps[activeStep].title}
              </h3>

              <p style={styles.stepDetailText}>
                {steps[activeStep].description}
              </p>
            </div>
          </div>
        </section>

        {/* IA */}
        <section style={styles.aiSection}>
          <div style={styles.aiContent}>
            <span style={styles.aiTag}>
              <ShieldCheck size={16} />
              INTELIGENCIA ARTIFICIAL
            </span>

            <h2 style={styles.aiTitle}>
              Tecnología que apoya tus procesos de cumplimiento
            </h2>

            <p style={styles.aiDescription}>
              NormIA incorpora herramientas de Inteligencia Artificial para apoyar
              el análisis de información, facilitar la interpretación de resultados
              y entregar una experiencia más ágil durante la gestión del cumplimiento.
            </p>

            <div style={styles.aiBenefits}>
              <span style={styles.aiBenefit}>
                <ShieldCheck size={18} />
                Apoyo en análisis de información
              </span>

              <span style={styles.aiBenefit}>
                <ShieldCheck size={18} />
                Mayor claridad en los resultados
              </span>

              <span style={styles.aiBenefit}>
                <ShieldCheck size={18} />
                Procesos más ágiles
              </span>
            </div>
          </div>

          <div style={styles.aiVisual}>
            <Scale size={90} />
            <span style={styles.aiVisualTitle}>NormIA</span>
            <span style={styles.aiVisualText}>
              Normativa + Inteligencia Artificial
            </span>
          </div>
        </section>

        {/* BENEFICIOS */}
        <section style={styles.benefitsSection}>
          <div style={styles.centerHeading}>
            <span style={styles.sectionTag}>BENEFICIOS</span>

            <h2 style={styles.sectionTitleLarge}>
              Todo conectado en una misma plataforma
            </h2>

            <p style={styles.centerDescription}>
              NormIA conecta información, procesos y seguimiento para entregar
              una visión más clara del cumplimiento de la organización.
            </p>
          </div>

          <div style={styles.benefitsEcosystem}>
            <div style={styles.benefitConnectorHorizontal}></div>
            <div style={styles.benefitConnectorVertical}></div>

            <div style={styles.benefitBubbleTop}>
              <span style={styles.benefitBubbleNumber}>01</span>
              <strong>Centralización</strong>
              <p style={styles.benefitBubbleText}>
                Información relevante disponible desde un mismo lugar.
              </p>
            </div>

            <div style={styles.benefitBubbleLeft}>
              <span style={styles.benefitBubbleNumber}>02</span>
              <strong>Visibilidad</strong>
              <p style={styles.benefitBubbleText}>
                Una visión clara del estado actual de la organización.
              </p>
            </div>

            <div style={styles.benefitCenter}>
              <div style={styles.benefitCenterIcon}>
                <ShieldCheck size={48} />
              </div>

              <strong style={styles.benefitCenterTitle}>
                NormIA
              </strong>

              <span style={styles.benefitCenterText}>
                Gestión conectada
              </span>
            </div>

            <div style={styles.benefitBubbleRight}>
              <span style={styles.benefitBubbleNumber}>03</span>
              <strong>Trazabilidad</strong>
              <p style={styles.benefitBubbleText}>
                Registro y seguimiento de actividades y avances.
              </p>
            </div>

            <div style={styles.benefitBubbleBottomLeft}>
              <span style={styles.benefitBubbleNumber}>04</span>
              <strong>Priorización</strong>
              <p style={styles.benefitBubbleText}>
                Identifica riesgos y brechas que necesitan atención.
              </p>
            </div>

            <div style={styles.benefitBubbleBottomRight}>
              <span style={styles.benefitBubbleNumber}>05</span>
              <strong>Mejora continua</strong>
              <p style={styles.benefitBubbleText}>
                Evalúa, gestiona y mejora los procesos en el tiempo.
              </p>
            </div>
          </div>
        </section>

        {/* NORMATIVAS */}
        <section id="normativas" style={styles.normativas}>
          <div style={styles.normativeHeader}>
            <span style={styles.sectionTag}>NORMATIVAS Y MARCOS</span>

            <h2 style={styles.sectionTitleLarge}>
              Cumplimiento adaptado a los desafíos actuales
            </h2>

            <p style={styles.centerDescription}>
              Selecciona una normativa o marco para conocer cómo se relaciona
              con NormIA.
            </p>
          </div>

          <div style={styles.normativeButtons}>
            {normatives.map((normative, index) => (
              <button
                key={normative.short}
                onClick={() => setActiveNormative(index)}
                style={
                  activeNormative === index
                    ? styles.normativeButtonActive
                    : styles.normativeButton
                }
              >
                {normative.short}
              </button>
            ))}
          </div>

          <div style={styles.normativeInteractivePanel}>
            <div style={styles.normativeInfo}>
              <div style={styles.normativeBigIcon}>
                {normatives[activeNormative].icon}
              </div>

              <span style={styles.sectionTag}>
                {normatives[activeNormative].tag}
              </span>

              <h3 style={styles.normativeInteractiveTitle}>
                {normatives[activeNormative].title}
              </h3>

              <p style={styles.normativeInteractiveText}>
                {normatives[activeNormative].description}
              </p>
            </div>

            <div style={styles.normativePoints}>
              <span style={styles.normativePointsTitle}>
                Áreas relacionadas
              </span>

              {normatives[activeNormative].items.map((item, index) => (
                <div key={item} style={styles.normativePoint}>
                  <span style={styles.normativePointNumber}>
                    0{index + 1}
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={styles.ctaSection}>
          <div style={styles.ctaContent}>
            <span style={styles.ctaSmall}>
              GESTIONA · ANALIZA · MEJORA
            </span>

            <h2 style={styles.ctaTitle}>
              Convierte el cumplimiento en un proceso más claro y controlable
            </h2>

            <p style={styles.ctaText}>
              Centraliza la información de tu organización, identifica brechas
              y realiza seguimiento de tus avances con NormIA.
            </p>

            <a href="/login" style={styles.ctaButton}>
              Ingresar a NormIA
              <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div>
          <div style={styles.brand}>
            <div style={styles.logoIconSmall}>✓</div>
            <strong>NormIA</strong>
          </div>

          <p style={styles.footerDescription}>
            Gobernanza, riesgo, cumplimiento y protección de datos en una
            plataforma centralizada.
          </p>
        </div>

      
        <span style={styles.footerText}>
          Seguridad · Cumplimiento · Confianza
        </span>
      </footer>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F8FBFD',
    color: '#16324F',
    fontFamily: 'Inter, Arial, sans-serif'
  },

  header: {
    minHeight: '76px',
    padding: '0 7%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#FFFFFF',
    borderBottom: '1px solid #E5EDF3',
    position: 'sticky',
    top: 0,
    zIndex: 20
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },

  logoIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #2698EA, #35C9BB)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '23px'
  },

  logoIconSmall: {
    width: '30px',
    height: '30px',
    borderRadius: '9px',
    background: 'linear-gradient(135deg, #2698EA, #35C9BB)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  logoText: {
    fontSize: '23px',
    fontWeight: '800',
    letterSpacing: '1px'
  },

  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '22px',
    flexWrap: 'wrap'
  },

  navLink: {
    textDecoration: 'none',
    color: '#617487',
    fontSize: '14px',
    fontWeight: '600'
  },

  loginButton: {
    textDecoration: 'none',
    color: '#FFFFFF',
    background: '#2698EA',
    padding: '11px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700'
  },

  hero: {
    padding: '55px 7% 70px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    alignItems: 'center',
    gap: '70px'
  },

  heroContent: {
    maxWidth: '720px'
  },

  badge: {
    display: 'inline-block',
    padding: '8px 15px',
    background: '#EAF9F6',
    color: '#15998C',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: '700',
    marginBottom: '22px'
  },

  title: {
    fontSize: 'clamp(40px, 5vw, 58px)',
    lineHeight: '1.08',
    margin: '0 0 24px',
    fontWeight: '800'
  },

  titleAccent: {
    color: '#2698EA'
  },

  description: {
    color: '#64788B',
    fontSize: '18px',
    lineHeight: '1.7',
    maxWidth: '650px',
    marginBottom: '32px'
  },

  buttons: {
    display: 'flex',
    gap: '14px',
    marginBottom: '27px',
    flexWrap: 'wrap'
  },

  primaryButton: {
    textDecoration: 'none',
    background: '#2698EA',
    color: '#FFFFFF',
    padding: '14px 22px',
    borderRadius: '11px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  secondaryButton: {
    textDecoration: 'none',
    background: '#FFFFFF',
    color: '#16324F',
    padding: '14px 22px',
    borderRadius: '11px',
    border: '1px solid #DCE7EE',
    fontWeight: '700'
  },

  heroChecks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '18px'
  },

  heroCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    color: '#667B8D',
    fontSize: '13px',
    fontWeight: '600'
  },

  previewCard: {
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '32px',
    border: '1px solid #E4EDF3',
    boxShadow: '0 24px 60px rgba(38,80,110,.12)'
  },

  previewHeader: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    marginBottom: '28px'
  },

  previewIcon: {
    width: '58px',
    height: '58px',
    borderRadius: '16px',
    background: '#EAF6FF',
    color: '#2698EA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  previewTitle: {
    margin: '3px 0 0',
    fontSize: '20px'
  },

  smallText: {
    fontSize: '12px',
    color: '#8A9BAA',
    fontWeight: '700'
  },

  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    marginBottom: '18px'
  },

  previewItem: {
    padding: '22px',
    borderRadius: '15px',
    background: '#F5FAFD',
    textAlign: 'center'
  },

  previewNumber: {
    display: 'block',
    fontSize: '22px',
    fontWeight: '800'
  },

  previewLabel: {
    color: '#718599',
    fontSize: '14px'
  },

  progressBox: {
    padding: '18px',
    background: '#F8FBFD',
    borderRadius: '14px',
    marginBottom: '18px'
  },

  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '12px'
  },

  progressBar: {
    height: '8px',
    borderRadius: '10px',
    background: '#E3EEF4',
    overflow: 'hidden'
  },

  progressFill: {
    width: '76%',
    height: '100%',
    background: 'linear-gradient(90deg,#2698EA,#35C9BB)'
  },

  previewInfo: {
    display: 'grid',
    gap: '9px'
  },

  previewInfoItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    color: '#617487',
    fontSize: '13px',
    fontWeight: '600'
  },

  sectionTag: {
    color: '#17A999',
    fontWeight: '800',
    fontSize: '12px',
    letterSpacing: '1.5px'
  },

  sectionTitle: {
    fontSize: 'clamp(30px,4vw,38px)',
    margin: '10px 0 14px'
  },

  sectionTitleLarge: {
    fontSize: 'clamp(32px,4vw,42px)',
    lineHeight: '1.2',
    margin: '12px 0 18px'
  },

  centerDescription: {
    color: '#6B7F91',
    lineHeight: '1.75',
    fontSize: '17px'
  },

  centerHeading: {
    maxWidth: '820px',
    margin: '0 auto 38px',
    textAlign: 'center'
  },

  /* QUIENES SOMOS */
  aboutModernSection: {
    padding: '100px 7%',
    background: '#FFFFFF',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
    alignItems: 'center',
    gap: '80px'
  },

  aboutModernText: {
    maxWidth: '650px'
  },

  aboutParagraph: {
    color: '#6B7F91',
    fontSize: '16px',
    lineHeight: '1.8',
    marginBottom: '16px'
  },

  aboutStats: {
    display: 'flex',
    gap: '50px',
    marginTop: '35px'
  },

  aboutStatNumber: {
    display: 'block',
    color: '#2698EA',
    fontSize: '30px'
  },

  aboutStatLabel: {
    display: 'block',
    color: '#708395',
    fontSize: '13px',
    maxWidth: '170px'
  },

  aboutVisual: {
    minHeight: '390px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  aboutCircleLarge: {
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#EAF6FF,#EAF9F6)',
    color: '#2698EA',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '9px',
    boxShadow: '0 24px 55px rgba(38,152,234,.13)'
  },

  aboutCircleTitle: {
    fontSize: '26px'
  },

  aboutCircleText: {
    color: '#617487',
    fontSize: '13px'
  },

  floatingLabelOne: {
    position: 'absolute',
    top: '25px',
    right: '5%',
    padding: '12px 18px',
    background: '#FFF',
    borderRadius: '999px',
    boxShadow: '0 10px 30px rgba(22,50,79,.12)',
    fontWeight: '700',
    fontSize: '13px'
  },

  floatingLabelTwo: {
    position: 'absolute',
    bottom: '35px',
    right: '7%',
    padding: '12px 18px',
    background: '#FFF',
    borderRadius: '999px',
    boxShadow: '0 10px 30px rgba(22,50,79,.12)',
    fontWeight: '700',
    fontSize: '13px'
  },

  floatingLabelThree: {
    position: 'absolute',
    top: '155px',
    left: 0,
    padding: '12px 18px',
    background: '#FFF',
    borderRadius: '999px',
    boxShadow: '0 10px 30px rgba(22,50,79,.12)',
    fontWeight: '700',
    fontSize: '13px'
  },

  /* SOLUCIONES - COMPACTADAS */
  solutions: {
    padding: '80px 7% 85px',
    background: '#F8FBFD'
  },

  solutionHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    alignItems: 'end',
    marginBottom: '28px'
  },

  solutionHeaderText: {
    color: '#6B7F91',
    lineHeight: '1.7',
    fontSize: '15px',
    maxWidth: '560px',
    margin: 0
  },

  solutionTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5,1fr)',
    gap: '12px',
    marginBottom: '18px'
  },

  solutionTab: {
    border: '1px solid #E1EBF1',
    background: '#FFFFFF',
    borderRadius: '14px',
    padding: '12px 10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#617487',
    minHeight: '82px'
  },

  solutionTabActive: {
    border: '1px solid #2698EA',
    background: '#EFF8FE',
    borderRadius: '14px',
    padding: '12px 10px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#16324F',
    minHeight: '82px',
    boxShadow: '0 8px 20px rgba(38,152,234,.12)'
  },

  solutionTabIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: '#F3F8FB',
    color: '#8296A5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  solutionTabIconActive: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: '#2698EA',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  solutionTabTitle: {
    fontSize: '12px',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: '1.3'
  },

  solutionShowcase: {
    minHeight: '360px',
    borderRadius: '24px',
    background: '#FFFFFF',
    boxShadow: '0 18px 50px rgba(22,50,79,.07)',
    padding: '38px 42px',
    display: 'grid',
    gridTemplateColumns: '1.1fr .9fr',
    alignItems: 'center',
    gap: '40px',
    overflow: 'hidden'
  },

  solutionShowcaseContent: {
    maxWidth: '650px'
  },

  solutionShowcaseTag: {
    color: '#17A999',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '1.5px'
  },

  solutionShowcaseTitle: {
    fontSize: '32px',
    margin: '10px 0 5px'
  },

  solutionShowcaseSubtitle: {
    color: '#2698EA',
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '16px'
  },

  solutionShowcaseDescription: {
    color: '#667B8D',
    lineHeight: '1.7',
    fontSize: '15px'
  },

  solutionPoints: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2,1fr)',
    gap: '12px',
    marginTop: '24px'
  },

  solutionPoint: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#617487',
    fontSize: '13px'
  },

  solutionCheck: {
    width: '23px',
    height: '23px',
    borderRadius: '50%',
    background: '#EAF9F6',
    color: '#17A999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800'
  },

  solutionVisualArea: {
    height: '270px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  solutionVisualOuter: {
    width: '235px',
    height: '235px',
    borderRadius: '50%',
    background: '#EFF7FC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  solutionVisualMiddle: {
    width: '170px',
    height: '170px',
    borderRadius: '50%',
    background: '#E9F8F5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  solutionVisualCenter: {
    width: '92px',
    height: '92px',
    borderRadius: '50%',
    background: '#FFFFFF',
    color: '#2698EA',
    boxShadow: '0 15px 35px rgba(22,50,79,.13)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  solutionVisualLabelTop: {
    position: 'absolute',
    top: '12px',
    left: '25px',
    background: '#FFFFFF',
    padding: '9px 15px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '700',
    boxShadow: '0 8px 25px rgba(22,50,79,.1)'
  },

  solutionVisualLabelRight: {
    position: 'absolute',
    right: 0,
    top: '105px',
    background: '#FFFFFF',
    padding: '9px 15px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '700',
    boxShadow: '0 8px 25px rgba(22,50,79,.1)'
  },

  solutionVisualLabelBottom: {
    position: 'absolute',
    bottom: '8px',
    left: '20px',
    background: '#FFFFFF',
    padding: '9px 15px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '700',
    boxShadow: '0 8px 25px rgba(22,50,79,.1)'
  },

  /* COMO FUNCIONA */
  howSection: {
    padding: '90px 7%',
    background: '#FFFFFF'
  },

  timeline: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'repeat(4,1fr)',
    maxWidth: '1050px',
    margin: '0 auto'
  },

  timelineLine: {
    position: 'absolute',
    height: '2px',
    background: '#DCE8EF',
    top: '27px',
    left: '12%',
    right: '12%'
  },

  timelineButton: {
    position: 'relative',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
  },

  timelineCircle: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    margin: '0 auto 17px',
    background: '#FFFFFF',
    border: '2px solid #BFD0DD',
    color: '#8095A5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800'
  },

  timelineCircleActive: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    margin: '-3px auto 14px',
    background: '#2698EA',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    boxShadow: '0 10px 25px rgba(38,152,234,.3)'
  },

  timelineTitle: {
    color: '#718599',
    fontSize: '17px'
  },

  timelineTitleActive: {
    color: '#16324F',
    fontSize: '19px'
  },

  stepDetail: {
    maxWidth: '760px',
    margin: '45px auto 0',
    background: '#F8FBFD',
    padding: '28px 36px',
    borderRadius: '20px',
    display: 'grid',
    gridTemplateColumns: '80px 1fr',
    gap: '25px',
    alignItems: 'center'
  },

  stepDetailNumber: {
    fontSize: '40px',
    color: '#2698EA',
    fontWeight: '800'
  },

  stepDetailTitle: {
    fontSize: '24px',
    margin: '7px 0'
  },

  stepDetailText: {
    margin: 0,
    color: '#6B7F91',
    lineHeight: '1.7'
  },

  /* IA */
  aiSection: {
    margin: '10px 7% 45px',
    borderRadius: '28px',
    background: 'linear-gradient(135deg,#173B5C,#155B68)',
    color: '#FFFFFF',
    padding: '65px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
    gap: '50px',
    alignItems: 'center'
  },

  aiContent: {
    maxWidth: '680px'
  },

  aiTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,.11)',
    borderRadius: '999px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: '800'
  },

  aiTitle: {
    fontSize: 'clamp(31px,4vw,39px)',
    lineHeight: '1.2',
    margin: '18px 0'
  },

  aiDescription: {
    color: '#D7E8EE',
    lineHeight: '1.75',
    fontSize: '16px'
  },

  aiBenefits: {
    display: 'grid',
    gap: '12px',
    marginTop: '25px'
  },

  aiBenefit: {
    display: 'flex',
    gap: '9px',
    alignItems: 'center',
    color: '#E5F4F6',
    fontSize: '14px'
  },

  aiVisual: {
    minHeight: '280px',
    borderRadius: '22px',
    background: 'rgba(255,255,255,.08)',
    border: '1px solid rgba(255,255,255,.12)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },

  aiVisualTitle: {
    fontSize: '30px',
    fontWeight: '800',
    marginTop: '15px'
  },

  aiVisualText: {
    color: '#C9E5E8',
    fontSize: '14px'
  },

  /* BENEFICIOS - ESPACIADO CORREGIDO */
  benefitsSection: {
    padding: '65px 7% 90px',
    background: '#F8FBFD'
  },

  benefitsEcosystem: {
    maxWidth: '1050px',
    height: '600px',
    margin: '0 auto',
    position: 'relative'
  },

  benefitConnectorHorizontal: {
    position: 'absolute',
    left: '17%',
    right: '17%',
    top: '50%',
    height: '1px',
    background: '#D8E7ED'
  },

  benefitConnectorVertical: {
    position: 'absolute',
    top: '15%',
    bottom: '15%',
    left: '50%',
    width: '1px',
    background: '#D8E7ED'
  },

  benefitCenter: {
    width: '210px',
    height: '210px',
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%,-50%)',
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#2698EA,#35C9BB)',
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 20px 45px rgba(38,152,234,.25)',
    zIndex: 3
  },

  benefitCenterIcon: {
    marginBottom: '10px'
  },

  benefitCenterTitle: {
    fontSize: '27px'
  },

  benefitCenterText: {
    fontSize: '13px',
    opacity: 0.9,
    marginTop: '5px'
  },

  benefitBubbleTop: {
    ...benefitBase,
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)'
  },

  benefitBubbleLeft: {
    ...benefitBase,
    top: '195px',
    left: 0
  },

  benefitBubbleRight: {
    ...benefitBase,
    top: '195px',
    right: 0
  },

  benefitBubbleBottomLeft: {
    ...benefitBase,
    bottom: 0,
    left: '14%'
  },

  benefitBubbleBottomRight: {
    ...benefitBase,
    bottom: 0,
    right: '14%'
  },

  benefitBubbleNumber: {
    color: '#2698EA',
    fontWeight: '800',
    fontSize: '11px',
    display: 'block',
    marginBottom: '7px'
  },

  benefitBubbleText: {
    margin: '8px 0 0',
    color: '#708395',
    fontSize: '13px',
    lineHeight: '1.6'
  },

  /* NORMATIVAS */
  normativas: {
    padding: '90px 7%',
    background: '#FFFFFF'
  },

  normativeHeader: {
    maxWidth: '760px',
    marginBottom: '40px'
  },

  normativeButtons: {
    display: 'flex',
    gap: '12px',
    marginBottom: '30px',
    flexWrap: 'wrap'
  },

  normativeButton: {
    border: '1px solid #DCE7EE',
    background: '#FFFFFF',
    color: '#617487',
    borderRadius: '999px',
    padding: '12px 23px',
    cursor: 'pointer',
    fontWeight: '700'
  },

  normativeButtonActive: {
    border: '1px solid #2698EA',
    background: '#2698EA',
    color: '#FFFFFF',
    borderRadius: '999px',
    padding: '12px 23px',
    cursor: 'pointer',
    fontWeight: '700',
    boxShadow: '0 8px 20px rgba(38,152,234,.22)'
  },

  normativeInteractivePanel: {
    borderRadius: '28px',
    background: 'linear-gradient(135deg,#F1F8FD,#EDF9F7)',
    padding: '55px',
    display: 'grid',
    gridTemplateColumns: '1.2fr .8fr',
    gap: '65px'
  },

  normativeBigIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '22px',
    background: '#FFFFFF',
    color: '#2698EA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '30px',
    boxShadow: '0 10px 25px rgba(22,50,79,.08)'
  },

  normativeInteractiveTitle: {
    fontSize: '34px',
    margin: '10px 0 15px'
  },

  normativeInteractiveText: {
    color: '#617487',
    lineHeight: '1.8',
    maxWidth: '600px'
  },

  normativePoints: {
    borderLeft: '1px solid #D3E3E8',
    paddingLeft: '40px'
  },

  normativePointsTitle: {
    display: 'block',
    fontWeight: '800',
    marginBottom: '18px'
  },

  normativePoint: {
    padding: '16px 0',
    borderBottom: '1px solid #D5E3E8',
    display: 'flex',
    gap: '20px',
    color: '#617487'
  },

  normativePointNumber: {
    color: '#17A999',
    fontWeight: '800'
  },

  /* CTA */
  ctaSection: {
    padding: '80px 7%',
    background: '#F8FBFD'
  },

  ctaContent: {
    maxWidth: '950px',
    margin: '0 auto',
    textAlign: 'center',
    borderRadius: '26px',
    padding: '65px 45px',
    background: 'linear-gradient(135deg,#EAF6FF,#EAF9F6)'
  },

  ctaSmall: {
    color: '#169C90',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '1.4px'
  },

  ctaTitle: {
    fontSize: 'clamp(31px,4vw,39px)',
    lineHeight: '1.2',
    margin: '15px auto',
    maxWidth: '750px'
  },

  ctaText: {
    maxWidth: '660px',
    margin: '0 auto 28px',
    color: '#667B8D',
    lineHeight: '1.7'
  },

  ctaButton: {
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#2698EA',
    color: '#FFFFFF',
    padding: '14px 22px',
    borderRadius: '11px',
    fontWeight: '700'
  },

  footer: {
    padding: '38px 7%',
    background: '#FFFFFF',
    borderTop: '1px solid #E3ECF2',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
    gap: '35px',
    alignItems: 'center'
  },

  footerDescription: {
    color: '#75889A',
    fontSize: '13px',
    maxWidth: '390px',
    lineHeight: '1.5'
  },

  footerLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px'
  },

  footerLink: {
    color: '#617487',
    fontSize: '13px',
    textDecoration: 'none'
  },

  footerText: {
    color: '#75889A',
    fontSize: '13px'
  }
};

export default LandingPage;