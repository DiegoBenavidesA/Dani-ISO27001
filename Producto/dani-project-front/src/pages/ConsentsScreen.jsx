/* eslint-disable */
import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  Trash2,
  X,
  Ban
} from 'lucide-react';

import { consentsAPI, treatmentsAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const ConsentsScreen = () => {
  const { theme: t } = useTheme();

  const [consents, setConsents] = useState([]);
  const [treatments, setTreatments] = useState([]); // para el desplegable
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    titular: '',
    treatment_id: '',
    medio: '',
    comprobante_url: '',
    organization_id: ''
  });

  // ============================================
  // CARGAR CONSENTIMIENTOS
  // ============================================
  const loadConsents = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await consentsAPI.getAll();
      setConsents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los consentimientos.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar los tratamientos para el desplegable (así no se escribe el ID a mano)
  const loadTreatments = async () => {
    try {
      const data = await treatmentsAPI.getAll();
      setTreatments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('No se pudieron cargar los tratamientos.', err);
      setTreatments([]);
    }
  };

  useEffect(() => {
    loadConsents();
    loadTreatments();
  }, []);

  // Nombre legible del tratamiento a partir de su id (para la tabla)
  const treatmentName = (id) => {
    const found = treatments.find((tr) => tr.id === id);
    return found ? found.nombre : id;
  };

  // ============================================
  // LIMPIAR FORMULARIO
  // ============================================
  const resetForm = () => {
    setFormData({
      titular: '',
      treatment_id: '',
      medio: '',
      comprobante_url: '',
      organization_id: ''
    });
  };

  // ============================================
  // ABRIR FORMULARIO
  // ============================================
  const handleNewConsent = () => {
    resetForm();
    setShowForm(true);
  };

  // ============================================
  // CERRAR FORMULARIO
  // ============================================
  const handleCloseForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  // ============================================
  // CAMBIOS DEL FORMULARIO
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // ============================================
  // CREAR CONSENTIMIENTO
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titular.trim()) {
      alert('Debes ingresar el titular.');
      return;
    }

    if (!formData.treatment_id.trim()) {
      alert('Debes seleccionar un tratamiento.');
      return;
    }

    if (!formData.medio.trim()) {
      alert('Debes ingresar el medio del consentimiento.');
      return;
    }

    const payload = {
      titular: formData.titular.trim(),
      treatment_id: formData.treatment_id.trim(),
      medio: formData.medio.trim(),
      comprobante_url: formData.comprobante_url.trim() || null,
      organization_id: formData.organization_id.trim() || null
    };

    try {
      setSaving(true);

      await consentsAPI.create(payload);
      await loadConsents();

      handleCloseForm();
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo registrar el consentimiento.');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // REVOCAR
  // ============================================
  const handleRevokeConsent = async (consent) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas revocar el consentimiento de "${consent.titular}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await consentsAPI.revoke(consent.id);
      await loadConsents();
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo revocar el consentimiento.');
    }
  };

  // ============================================
  // ELIMINAR
  // ============================================
  const handleDeleteConsent = async (consent) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar el consentimiento de "${consent.titular}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await consentsAPI.delete(consent.id);
      await loadConsents();
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo eliminar el consentimiento.');
    }
  };

  // ============================================
  // BUSCADOR
  // ============================================
  const filteredConsents = consents.filter((consent) => {
    const text = `${consent.titular || ''} ${
      consent.medio || ''
    } ${consent.estado || ''} ${
      consent.treatment_id || ''
    }`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  // ============================================
  // CONTADORES
  // ============================================
  const grantedCount = consents.filter(
    (consent) =>
      String(consent.estado || '').toLowerCase() === 'otorgado'
  ).length;

  const revokedCount = consents.filter(
    (consent) =>
      String(consent.estado || '').toLowerCase() === 'revocado'
  ).length;

  // ============================================
  // ESTILO ESTADO
  // ============================================
  const getStatusStyle = (status) => {
    if (String(status || '').toLowerCase() === 'revocado') {
      return {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444'
      };
    }

    return {
      background: 'rgba(16, 185, 129, 0.15)',
      color: '#10b981'
    };
  };

  // ============================================
  // FORMATEAR FECHA
  // ============================================
  const formatDate = (date) => {
    if (!date) return '—';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }

    return parsed.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      style={{
        padding: '32px',
        color: t.text,
        minHeight: '100%'
      }}
    >
      {/* ENCABEZADO */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          gap: '20px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <ClipboardCheck size={30} color="#10b981" />

            <h1
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700
              }}
            >
              Gestión de Consentimientos
            </h1>
          </div>

          <p
            style={{
              color: t.textDim,
              marginTop: '8px',
              marginBottom: 0
            }}
          >
            Registro y administración de consentimientos de titulares.
          </p>
        </div>

        <button
          onClick={handleNewConsent}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 18px',
            border: 'none',
            borderRadius: '10px',
            background: '#10b981',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={18} />
          Nuevo Consentimiento
        </button>
      </div>

      {/* RESUMEN */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: '14px',
            padding: '20px'
          }}
        >
          <div
            style={{
              color: t.textDim,
              fontSize: '13px',
              marginBottom: '6px'
            }}
          >
            Total de consentimientos
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 700
            }}
          >
            {consents.length}
          </div>
        </div>

        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: '14px',
            padding: '20px'
          }}
        >
          <div
            style={{
              color: t.textDim,
              fontSize: '13px',
              marginBottom: '6px'
            }}
          >
            Otorgados
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#10b981'
            }}
          >
            {grantedCount}
          </div>
        </div>

        <div
          style={{
            background: t.cardBg,
            border: `1px solid ${t.border}`,
            borderRadius: '14px',
            padding: '20px'
          }}
        >
          <div
            style={{
              color: t.textDim,
              fontSize: '13px',
              marginBottom: '6px'
            }}
          >
            Revocados
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#ef4444'
            }}
          >
            {revokedCount}
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div
        style={{
          position: 'relative',
          marginBottom: '20px'
        }}
      >
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: t.textDim
          }}
        />

        <input
          type="text"
          placeholder="Buscar consentimiento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 42px',
            borderRadius: '10px',
            border: `1px solid ${t.border}`,
            background: t.inputBg,
            color: t.text,
            outline: 'none'
          }}
        />

        {search && (
          <X
            size={18}
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: t.textDim,
              cursor: 'pointer'
            }}
          />
        )}
      </div>

      {/* TABLA */}
      <div
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: '14px',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center' }}>
            Cargando consentimientos...
          </div>
        ) : error ? (
          <div
            style={{
              padding: '30px',
              textAlign: 'center',
              color: '#ef4444'
            }}
          >
            {error}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${t.border}`
                  }}
                >
                  {[
                    'TITULAR',
                    'TRATAMIENTO',
                    'MEDIO',
                    'ESTADO',
                    'FECHA OTORGADO',
                    'ACCIONES'
                  ].map((title) => (
                    <th
                      key={title}
                      style={{
                        padding: '14px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        color: t.textDim
                      }}
                    >
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredConsents.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        padding: '35px',
                        textAlign: 'center',
                        color: t.textDim
                      }}
                    >
                      No hay consentimientos registrados.
                    </td>
                  </tr>
                ) : (
                  filteredConsents.map((consent) => {
                    const revoked =
                      String(consent.estado || '').toLowerCase() ===
                      'revocado';

                    return (
                      <tr
                        key={consent.id}
                        style={{
                          borderBottom: `1px solid ${t.border}`
                        }}
                      >
                        <td
                          style={{
                            padding: '16px',
                            fontWeight: 600
                          }}
                        >
                          {consent.titular}
                        </td>

                        <td style={{ padding: '16px' }}>
                          <span
                            title={consent.treatment_id}
                            style={{
                              display: 'inline-block',
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {treatmentName(consent.treatment_id)}
                          </span>
                        </td>

                        <td style={{ padding: '16px' }}>
                          {consent.medio || '—'}
                        </td>

                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              ...getStatusStyle(consent.estado),
                              padding: '6px 10px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: 600,
                              textTransform: 'capitalize'
                            }}
                          >
                            {consent.estado || 'otorgado'}
                          </span>
                        </td>

                        <td style={{ padding: '16px' }}>
                          {formatDate(consent.fecha_otorgado)}
                        </td>

                        <td style={{ padding: '16px' }}>
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px'
                            }}
                          >
                            {!revoked && (
                              <button
                                title="Revocar"
                                onClick={() =>
                                  handleRevokeConsent(consent)
                                }
                                style={{
                                  border: `1px solid ${t.border}`,
                                  background: 'transparent',
                                  color: '#f59e0b',
                                  borderRadius: '8px',
                                  padding: '7px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Ban size={16} />
                              </button>
                            )}

                            <button
                              title="Eliminar"
                              onClick={() =>
                                handleDeleteConsent(consent)
                              }
                              style={{
                                border: `1px solid ${t.border}`,
                                background: 'transparent',
                                color: '#ef4444',
                                borderRadius: '8px',
                                padding: '7px',
                                cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL NUEVO CONSENTIMIENTO */}
      {showForm && (
        <div
          onClick={handleCloseForm}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: t.cardBg,
              border: `1px solid ${t.border}`,
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
            }}
          >
            {/* CABECERA MODAL */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '22px'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '21px'
                }}
              >
                Nuevo Consentimiento
              </h2>

              <button
                type="button"
                onClick={handleCloseForm}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: t.textDim,
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* TITULAR */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  Titular *
                </label>

                <input
                  type="text"
                  name="titular"
                  value={formData.titular}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 12px',
                    borderRadius: '9px',
                    border: `1px solid ${t.border}`,
                    background: t.inputBg,
                    color: t.text,
                    outline: 'none'
                  }}
                />
              </div>

              {/* TRATAMIENTO */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  Tratamiento *
                </label>

                <select
                  name="treatment_id"
                  value={formData.treatment_id}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 12px',
                    borderRadius: '9px',
                    border: `1px solid ${t.border}`,
                    background: t.inputBg,
                    color: t.text,
                    outline: 'none'
                  }}
                >
                  <option value="">
                    {treatments.length === 0
                      ? '— No hay tratamientos: crea uno primero —'
                      : 'Selecciona un tratamiento...'}
                  </option>
                  {treatments.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* MEDIO */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  Medio *
                </label>

                <input
                  type="text"
                  name="medio"
                  value={formData.medio}
                  onChange={handleChange}
                  placeholder="Ej: Formulario web"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 12px',
                    borderRadius: '9px',
                    border: `1px solid ${t.border}`,
                    background: t.inputBg,
                    color: t.text,
                    outline: 'none'
                  }}
                />
              </div>

              {/* COMPROBANTE */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  URL del comprobante
                </label>

                <input
                  type="url"
                  name="comprobante_url"
                  value={formData.comprobante_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 12px',
                    borderRadius: '9px',
                    border: `1px solid ${t.border}`,
                    background: t.inputBg,
                    color: t.text,
                    outline: 'none'
                  }}
                />
              </div>

              {/* ORGANIZACION */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  ID de organización
                </label>

                <input
                  type="text"
                  name="organization_id"
                  value={formData.organization_id}
                  onChange={handleChange}
                  placeholder="Opcional"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 12px',
                    borderRadius: '9px',
                    border: `1px solid ${t.border}`,
                    background: t.inputBg,
                    color: t.text,
                    outline: 'none'
                  }}
                />
              </div>

              {/* BOTONES */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px'
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={saving}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '9px',
                    border: `1px solid ${t.border}`,
                    background: 'transparent',
                    color: t.text,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '9px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Guardando...' : 'Crear Consentimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentsScreen;