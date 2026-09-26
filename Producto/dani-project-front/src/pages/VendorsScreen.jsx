import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  X
} from 'lucide-react';

import { vendorsAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const VendorsScreen = () => {
  const { theme: t } = useTheme();

  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    datos_compartidos: '',
    pais: '',
    estado_contrato: 'pendiente'
  });

  // ============================================
  // CARGAR PROVEEDORES
  // ============================================
  const loadVendors = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await vendorsAPI.getAll();
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los proveedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  // ============================================
  // LIMPIAR FORMULARIO
  // ============================================
  const resetForm = () => {
    setFormData({
      nombre: '',
      datos_compartidos: '',
      pais: '',
      estado_contrato: 'pendiente'
    });

    setEditingVendor(null);
  };

  // ============================================
  // ABRIR FORMULARIO NUEVO
  // ============================================
  const handleNewVendor = () => {
    resetForm();
    setShowForm(true);
  };

  // ============================================
  // ABRIR FORMULARIO EDITAR
  // ============================================
  const handleEditVendor = (vendor) => {
    setEditingVendor(vendor);

    setFormData({
      nombre: vendor.nombre || '',
      datos_compartidos: vendor.datos_compartidos || '',
      pais: vendor.pais || '',
      estado_contrato: vendor.estado_contrato || 'pendiente'
    });

    setShowForm(true);
  };

  // ============================================
  // CERRAR FORMULARIO
  // ============================================
  const handleCloseForm = () => {
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
  // CREAR / EDITAR PROVEEDOR
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      alert('Debes ingresar el nombre del proveedor.');
      return;
    }

    const payload = {
      nombre: formData.nombre.trim(),
      datos_compartidos: formData.datos_compartidos.trim() || null,
      pais: formData.pais.trim() || null,
      estado_contrato: formData.estado_contrato,
      treatment_id: null,
    };

    try {
      setSaving(true);

      if (editingVendor) {
        await vendorsAPI.update(editingVendor.id, payload);
      } else {
        await vendorsAPI.create(payload);
      }

      await loadVendors();
      handleCloseForm();
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo guardar el proveedor.');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // ELIMINAR PROVEEDOR
  // ============================================
  const handleDeleteVendor = async (vendor) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar al proveedor "${vendor.nombre}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await vendorsAPI.delete(vendor.id);
      await loadVendors();
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo eliminar el proveedor.');
    }
  };

  // ============================================
  // BUSCADOR
  // ============================================
  const filteredVendors = vendors.filter((vendor) => {
    const text = `${vendor.nombre || ''} ${vendor.pais || ''} ${
      vendor.datos_compartidos || ''
    }`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  // ============================================
  // ESTILO ESTADO CONTRATO
  // ============================================
  const getStatusStyle = (status) => {
    switch (status) {
      case 'vigente':
        return {
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981'
        };

      case 'vencido':
        return {
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444'
        };

      default:
        return {
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b'
        };
    }
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
            <Building2 size={30} color="#10b981" />

            <h1
              style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: 700
              }}
            >
              Gestión de Proveedores
            </h1>
          </div>

          <p
            style={{
              color: t.textDim,
              marginTop: '8px',
              marginBottom: 0
            }}
          >
            Registro y control de terceros que procesan o reciben datos
            personales.
          </p>
        </div>

        <button
          onClick={handleNewVendor}
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
          Nuevo Proveedor
        </button>
      </div>

      {/* RESUMEN */}
      <div
        style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px'
        }}
      >
        <div
          style={{
            color: t.textDim,
            fontSize: '13px',
            marginBottom: '6px'
          }}
        >
          Total de proveedores registrados
        </div>

        <div
          style={{
            fontSize: '28px',
            fontWeight: 700
          }}
        >
          {vendors.length}
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
          placeholder="Buscar proveedor..."
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
            Cargando proveedores...
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
                    'PROVEEDOR',
                    'DATOS COMPARTIDOS',
                    'PAÍS',
                    'ESTADO CONTRATO',
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
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        padding: '35px',
                        textAlign: 'center',
                        color: t.textDim
                      }}
                    >
                      No hay proveedores registrados.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
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
                        {vendor.nombre}
                      </td>

                      <td style={{ padding: '16px' }}>
                        {vendor.datos_compartidos || '—'}
                      </td>

                      <td style={{ padding: '16px' }}>
                        {vendor.pais || '—'}
                      </td>

                      <td style={{ padding: '16px' }}>
                        <span
                          style={{
                            ...getStatusStyle(vendor.estado_contrato),
                            padding: '6px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'capitalize'
                          }}
                        >
                          {vendor.estado_contrato || 'pendiente'}
                        </span>
                      </td>

                      <td style={{ padding: '16px' }}>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px'
                          }}
                        >
                          <button
                            title="Editar"
                            onClick={() => handleEditVendor(vendor)}
                            style={{
                              border: `1px solid ${t.border}`,
                              background: 'transparent',
                              color: t.textMuted,
                              borderRadius: '8px',
                              padding: '7px',
                              cursor: 'pointer'
                            }}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            title="Eliminar"
                            onClick={() => handleDeleteVendor(vendor)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR */}
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
                {editingVendor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
              {/* NOMBRE */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  Nombre del proveedor *
                </label>

                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Amazon Web Services"
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

              {/* DATOS COMPARTIDOS */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  Datos compartidos
                </label>

                <textarea
                  name="datos_compartidos"
                  value={formData.datos_compartidos}
                  onChange={handleChange}
                  placeholder="Ej: Nombre, correo electrónico y datos de cuenta"
                  rows="3"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 12px',
                    borderRadius: '9px',
                    border: `1px solid ${t.border}`,
                    background: t.inputBg,
                    color: t.text,
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* PAÍS */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  País
                </label>

                <input
                  type="text"
                  name="pais"
                  value={formData.pais}
                  onChange={handleChange}
                  placeholder="Ej: Chile"
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

              {/* ESTADO */}
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '7px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  Estado del contrato
                </label>

                <select
                  name="estado_contrato"
                  value={formData.estado_contrato}
                  onChange={handleChange}
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
                  <option value="pendiente">Pendiente</option>
                  <option value="vigente">Vigente</option>
                  <option value="vencido">Vencido</option>
                </select>
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
                  {saving
                    ? 'Guardando...'
                    : editingVendor
                    ? 'Guardar cambios'
                    : 'Crear Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsScreen;