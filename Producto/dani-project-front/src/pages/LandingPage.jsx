import React from 'react';
import {
  ShieldCheck,
  LockKeyhole,
  BarChart3,
  Scale,
  ArrowRight
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoIcon}>✓</div>
          <span style={styles.logoText}>NORMIA</span>
        </div>

        <nav style={styles.nav}>
          <a href="#inicio" style={styles.navLink}>Inicio</a>
          <a href="#soluciones" style={styles.navLink}>Soluciones</a>
          <a href="#normativas" style={styles.navLink}>Normativas</a>

          <a href="/login" style={styles.loginButton}>
            Iniciar sesión
          </a>
        </nav>
      </header>

      <main>
        <section id="inicio" style={styles.hero}>
          <div style={styles.heroContent}>
            <span style={styles.badge}>
              Seguridad · Cumplimiento · Privacidad
            </span>

            <h1 style={styles.title}>
              Cumplimiento y seguridad
              <span style={styles.titleAccent}> más simples de gestionar.</span>
            </h1>

            <p style={styles.description}>
              NORMIA centraliza la gestión de riesgos, seguridad de la
              información y protección de datos en una plataforma clara,
              moderna y fácil de utilizar.
            </p>

            <div style={styles.buttons}>
              <a href="/login" style={styles.primaryButton}>
                Comenzar ahora
                <ArrowRight size={18} />
              </a>

              <a href="#soluciones" style={styles.secondaryButton}>
                Conocer más
              </a>
            </div>
          </div>

          <div style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <div style={styles.previewIcon}>
                <ShieldCheck size={32} />
              </div>

              <div>
                <span style={styles.smallText}>NORMIA</span>
                <h3 style={styles.previewTitle}>
                  Gestión centralizada
                </h3>
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
          </div>
        </section>

        <section id="soluciones" style={styles.solutions}>
          <div style={styles.sectionHeading}>
            <span style={styles.sectionTag}>SOLUCIONES</span>

            <h2 style={styles.sectionTitle}>
              Todo en un solo lugar
            </h2>

            <p style={styles.sectionDescription}>
              Herramientas para facilitar el seguimiento del cumplimiento,
              los riesgos y la protección de datos.
            </p>
          </div>

          <div style={styles.cards}>
            <Card
              icon={<ShieldCheck size={27} />}
              title="Gestión de riesgos"
              text="Identifica, evalúa y realiza seguimiento de los riesgos de tu organización."
            />

            <Card
              icon={<Scale size={27} />}
              title="Cumplimiento"
              text="Organiza controles y requisitos asociados a ISO 27001 y otras obligaciones."
            />

            <Card
              icon={<LockKeyhole size={27} />}
              title="Privacidad"
              text="Gestiona tratamientos, consentimientos y protección de datos personales."
            />

            <Card
              icon={<BarChart3 size={27} />}
              title="Seguimiento"
              text="Visualiza avances y mantén trazabilidad de las actividades realizadas."
            />
          </div>
        </section>

        <section id="normativas" style={styles.normativas}>
          <span style={styles.sectionTag}>CUMPLIMIENTO</span>

          <h2 style={styles.sectionTitle}>
            Una plataforma preparada para tus desafíos
          </h2>

          <div style={styles.normativeCards}>
            <div style={styles.normativeCard}>
              <strong style={styles.normativeTitle}>ISO 27001</strong>
              <span style={styles.normativeText}>
                Seguridad de la información
              </span>
            </div>

            <div style={styles.normativeCard}>
              <strong style={styles.normativeTitle}>Ley N.º 21.719</strong>
              <span style={styles.normativeText}>
                Protección de datos personales
              </span>
            </div>

            <div style={styles.normativeCard}>
              <strong style={styles.normativeTitle}>GRC</strong>
              <span style={styles.normativeText}>
                Gobierno, riesgo y cumplimiento
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <div style={styles.brand}>
          <div style={styles.logoIconSmall}>✓</div>
          <strong>NORMIA</strong>
        </div>

        <span style={styles.footerText}>
          Seguridad · Cumplimiento · Confianza
        </span>
      </footer>
    </div>
  );
};

const Card = ({ icon, title, text }) => (
  <div style={styles.card}>
    <div style={styles.cardIcon}>{icon}</div>
    <h3 style={styles.cardTitle}>{title}</h3>
    <p style={styles.cardText}>{text}</p>
  </div>
);

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F8FBFD',
    color: '#16324F',
    fontFamily: 'Inter, Arial, sans-serif'
  },

  header: {
    height: '76px',
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
    gap: '28px'
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
    padding: '95px 7%',
    minHeight: '590px',
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
    alignItems: 'center',
    gap: '70px'
  },

  heroContent: {
    maxWidth: '690px'
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
    fontSize: '56px',
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
    maxWidth: '620px',
    marginBottom: '32px'
  },

  buttons: {
    display: 'flex',
    gap: '14px'
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

  previewCard: {
    background: '#FFFFFF',
    borderRadius: '24px',
    padding: '32px',
    border: '1px solid #E4EDF3',
    boxShadow: '0 24px 60px rgba(38, 80, 110, 0.12)'
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
    gridTemplateColumns: '1fr 1fr',
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
    borderRadius: '14px'
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
    background: 'linear-gradient(90deg, #2698EA, #35C9BB)',
    borderRadius: '10px'
  },

  solutions: {
    padding: '90px 7%',
    background: '#FFFFFF'
  },

  sectionHeading: {
    maxWidth: '670px',
    marginBottom: '42px'
  },

  sectionTag: {
    color: '#17A999',
    fontWeight: '800',
    fontSize: '12px',
    letterSpacing: '1.5px'
  },

  sectionTitle: {
    fontSize: '38px',
    margin: '10px 0 14px'
  },

  sectionDescription: {
    color: '#6B7F91',
    lineHeight: '1.6'
  },

  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px'
  },

  card: {
    background: '#FFFFFF',
    border: '1px solid #E3ECF2',
    borderRadius: '18px',
    padding: '26px'
  },

  cardIcon: {
    width: '50px',
    height: '50px',
    background: '#ECF9F7',
    color: '#1EB4A4',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px'
  },

  cardTitle: {
    fontSize: '18px',
    marginBottom: '9px'
  },

  cardText: {
    color: '#708395',
    fontSize: '14px',
    lineHeight: '1.6'
  },

  normativas: {
    padding: '90px 7%',
    textAlign: 'center'
  },

  normativeCards: {
    maxWidth: '900px',
    margin: '40px auto 0',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '18px'
  },

  normativeCard: {
    background: '#FFFFFF',
    border: '1px solid #E3ECF2',
    padding: '25px',
    borderRadius: '16px'
  },

  normativeTitle: {
    display: 'block',
    color: '#2698EA',
    fontSize: '18px',
    marginBottom: '7px'
  },

  normativeText: {
    color: '#708395',
    fontSize: '14px'
  },

  footer: {
    padding: '26px 7%',
    background: '#FFFFFF',
    borderTop: '1px solid #E3ECF2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  footerText: {
    color: '#75889A',
    fontSize: '13px'
  }
};

export default LandingPage;