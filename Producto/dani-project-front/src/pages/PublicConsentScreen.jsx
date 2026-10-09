import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../services/api';

function PublicConsentScreen() {
  const { token } = useParams();

  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadConsent = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/consents/public/${encodeURIComponent(token)}`
        );

        if (!response.ok) {
          throw new Error('El enlace de consentimiento no es válido.');
        }

        const data = await response.json();
        setConsent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadConsent();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/api/consents/public/${encodeURIComponent(token)}/accept`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.detail || 'No fue posible aceptar el consentimiento.'
        );
      }

      const data = await response.json();
      setConsent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAccepting(false);
    }
  };

  const handleRevoke = async () => {
    const confirmed = window.confirm(
      '¿Confirmas que deseas revocar este consentimiento?'
    );

    if (!confirmed) {
      return;
    }

    setRevoking(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/api/consents/public/${encodeURIComponent(token)}/revoke`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.detail || 'No fue posible revocar el consentimiento.'
        );
      }

      const data = await response.json();
      setConsent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return <div style={styles.center}>Cargando consentimiento...</div>;
  }

  if (error && !consent) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h2>Enlace no disponible</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Solicitud de consentimiento</h1>

        <p style={styles.subtitle}>
          Hola <strong>{consent.titular}</strong>. Revisa la siguiente
          información sobre tu consentimiento.
        </p>

        <div style={styles.notice}>
          <div style={styles.version}>
            Versión del aviso: {consent.notice_version || 'No especificada'}
          </div>

          <pre style={styles.noticeText}>
            {consent.notice_text || 'No hay información disponible.'}
          </pre>
        </div>

        <div style={styles.status}>
          Estado: <strong>{consent.estado}</strong>
        </div>

        {consent.estado === 'pendiente' && (
          <button
            type="button"
            onClick={handleAccept}
            disabled={accepting}
            style={styles.button}
          >
            {accepting ? 'Registrando...' : 'Aceptar consentimiento'}
          </button>
        )}

        {consent.estado === 'otorgado' && (
          <>
            <div style={styles.success}>
              ✓ Tu consentimiento fue registrado correctamente.
            </div>

            <button
              type="button"
              onClick={handleRevoke}
              disabled={revoking}
              style={styles.revokeButton}
            >
              {revoking ? 'Revocando...' : 'Revocar consentimiento'}
            </button>
          </>
        )}

        {consent.estado === 'revocado' && (
          <div style={styles.revoked}>
            Este consentimiento fue revocado.
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f1f5f9',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
  },
  center: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f1f5f9',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '720px',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.10)',
  },
  title: {
    marginTop: 0,
    color: '#0f172a',
  },
  subtitle: {
    color: '#475569',
    lineHeight: 1.6,
  },
  notice: {
    marginTop: '24px',
    padding: '20px',
    borderRadius: '12px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  version: {
    marginBottom: '12px',
    fontSize: '14px',
    color: '#64748b',
  },
  noticeText: {
    whiteSpace: 'pre-wrap',
    fontFamily: 'inherit',
    lineHeight: 1.7,
    color: '#1e293b',
    margin: 0,
  },
  status: {
    marginTop: '20px',
    color: '#334155',
  },
  button: {
    width: '100%',
    marginTop: '24px',
    padding: '14px 20px',
    border: 'none',
    borderRadius: '10px',
    background: '#2563eb',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  revokeButton: {
    width: '100%',
    marginTop: '16px',
    padding: '14px 20px',
    border: 'none',
    borderRadius: '10px',
    background: '#dc2626',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  success: {
    marginTop: '24px',
    padding: '16px',
    borderRadius: '10px',
    background: '#dcfce7',
    color: '#166534',
    fontWeight: '600',
  },
  revoked: {
    marginTop: '24px',
    padding: '16px',
    borderRadius: '10px',
    background: '#fee2e2',
    color: '#991b1b',
    fontWeight: '600',
  },
  error: {
    marginTop: '16px',
    color: '#b91c1c',
  },
};

export default PublicConsentScreen;