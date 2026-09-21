// src/services/api.js - VERSIÓN COMPLETA CON userAPI
// Configuración centralizada de la API

// ============================================
// 🔥 URL BASE AUTOMÁTICA
// ============================================
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ============================================
// 👤 USER API
// ============================================
export const userAPI = {
  getUsers: async (token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/users`, {
      headers: { 
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      }
    });
    return response.json();
  },
  getAll: async (token) => {
    return userAPI.getUsers(token);
  },
  
  getUserById: async (userId, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      headers: { 
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      }
    });
    return response.json();
  },
  getOne: async (userId, token) => {
    return userAPI.getUserById(userId, token);
  },
  
  createUser: async (userData, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      },
      body: JSON.stringify(userData)
    });
    return response.json();
  },
  create: async (userData, token) => {
    return userAPI.createUser(userData, token);
  },
  
  updateUser: async (userId, userData, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      },
      body: JSON.stringify(userData)
    });
    return response.json();
  },
  update: async (userId, userData, token) => {
    return userAPI.updateUser(userId, userData, token);
  },
  
  deleteUser: async (userId, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      }
    });
    return response.json();
  },
  delete: async (userId, token) => {
    return userAPI.deleteUser(userId, token);
  }
};

// ============================================
// 📌 CHAT API
// ============================================
export const chatAPI = {
  sendMessage: async (message, language = 'es', token = null, signal = null, history = []) => {
    try {
      const resolvedToken = token || localStorage.getItem('token');
      
      let effectiveSignal = signal;
      let timeoutId = null;
      if (!effectiveSignal) {
        const controller = new AbortController();
        effectiveSignal = controller.signal;
        timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      }

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
        },
        body: JSON.stringify({ message, language, history }),
        signal: effectiveSignal
      });
      
      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503) {
            throw new Error(errorData.detail || "Servicio Analítico Degradado: El motor de IA no está disponible.");
        }
        throw new Error(errorData.detail || `Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Chat API error:', error);
      if (error.name === 'AbortError') {
        return { error: 'Tiempo de espera agotado (Timeout de 30s). DANI tardó demasiado en responder.' };
      }
      return { error: error.message };
    }
  }
};

// ============================================
// 📄 DOCUMENTOS API
// ============================================
export const documentsAPI = {
  getAll: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents`, {
      headers: { 
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      }
    });
    return response.json();
  },
  
  generate: async (docType, data, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/generate/${docType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  getDocument: async (chapterId, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/${chapterId}`, {
      headers: { 
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      }
    });
    return response.json();
  },
  saveDocument: async (chapterId, title, content, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      },
      body: JSON.stringify({ chapter_id: chapterId, title, content })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  
  updateStatus: async (chapterId, status, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/${chapterId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getPublishedPolicies: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/published/policies`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      }
    });
    return response.json();
  },

  acknowledgePolicy: async (documentId, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/${documentId}/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      }
    });
    return response.json();
  }
};

// ============================================
// 📊 COMPLIANCE API
// ============================================
export const complianceAPI = {
  getControls: async (token, category = null) => {
  const resolvedToken = token || localStorage.getItem('token'); // ✅ Agregar esto
  const url = category 
    ? `${API_URL}/api/compliance/controls?category=${category}`
    : `${API_URL}/api/compliance/controls`;
  const response = await fetch(url, {
    headers: { 
      'Authorization': `Bearer ${resolvedToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
},
  
  getStatistics: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/compliance/statistics`, {
      headers: { 
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      }
    });
    return response.json();
  },
  
  assessControl: async (controlId, evidence, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/compliance/assess/${controlId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      },
      body: JSON.stringify(evidence)
    });
    return response.json();
  },
  
  fullAssessment: async (organizationData, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/compliance/full-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      },
      body: JSON.stringify(organizationData)
    });
    return response.json();
  },
  
  evaluateControl: async (controlId, documentId, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/compliance/${controlId}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      },
      body: JSON.stringify({ document_id: documentId })
    });
    return response.json();
  },
  
  bulkAudit: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/compliance/bulk-audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      }
    });
    return response.json();
  }
};

// ============================================
// 🔐 AUTHENTICATION API
// ============================================
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },
  
  register: async (name, email, password) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return response.json();
  },
  
  verify: async (token) => {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return response.json();
  },
  
  getMe: async (token) => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
};

// ============================================
// 📋 EVIDENCE API
// ============================================
export const evidenceAPI = {
  getAll: async (token) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/evidence`, {
      headers: { 'Authorization': `Bearer ${resolvedToken}` }
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  
  upload: async (fileOrFormData, token) => {
    const resolvedToken = token || localStorage.getItem('token');
    const body = fileOrFormData instanceof FormData
      ? fileOrFormData
      : (() => { const fd = new FormData(); fd.append('file', fileOrFormData); return fd; })();
    const response = await fetch(`${API_URL}/api/evidence/upload`, {
      method: 'POST',
      headers: { ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) },
      body
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  download: async (evidenceId, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/evidence/${evidenceId}/download`, {
      headers: { ...(activeToken && { Authorization: `Bearer ${activeToken}` }) }
    });
    if (!response.ok) throw new Error('Error al descargar evidencia');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  exportZip: async (token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/evidence/export/zip`, {
      headers: { 
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      }
    });
    if (!response.ok) {
      throw new Error('Error al exportar las evidencias en ZIP');
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
};

// ============================================
// 🎯 RISK API
// ============================================
export const riskAPI = {
  getAll: async (token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/risks`, {
      headers: { 
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      }
    });
    return response.json();
  },
  
  create: async (riskData, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/risks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      },
      body: JSON.stringify(riskData)
    });
    return response.json();
  },
  
  getStatistics: async (token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/risks/statistics`, {
      headers: { 
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      }
    });
    return response.json();
  },

  analyzeWithAI: async (riskId, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/risks/${riskId}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      }
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  }
};

// ============================================
// 🚨 CAPA API
// ============================================
export const capaAPI = {
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/capas/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.json();
  },

  create: async (data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/capas/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear CAPA');
    return response.json();
  },

  updateStatus: async (dbId, status, progress = null) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/capas/${dbId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, progress })
    });
    if (!response.ok) throw new Error('Error al actualizar estado');
    return response.json();
  },

  delete: async (dbId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/capas/${dbId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error al eliminar CAPA');
    return response.json();
  }
};

// ============================================
// 👤 SOLICITUDES DE TITULARES (ARCO+P) API — Ley 21.719 (O3)
// Backend: routes/data_requests.py  →  /api/data-requests
// ============================================
export const dataRequestsAPI = {
  // Listar todas las solicitudes (ordenadas por fecha límite ascendente)
  getAll: async (token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/data-requests`, {
      headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  // Obtener el detalle de una solicitud
  getOne: async (requestId, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/data-requests/${requestId}`, {
      headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  },

  // Crear una nueva solicitud (el backend calcula la fecha límite: +30 días hábiles)
  // requestData: { titular, tipo, descripcion, organization_id? }
  create: async (requestData, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/data-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      },
      body: JSON.stringify(requestData)
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  // Actualizar estado / responsable / respuesta de una solicitud
  // updateData: { estado?, responsable?, respuesta? }
  update: async (requestId, updateData, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/data-requests/${requestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
};

// ============================================
// 🚨 GESTIÓN DE BRECHAS API — Ley 21.719 (O4)
// Backend: routes/breaches.py  →  /api/breaches
// ============================================
export const breachesAPI = {
  // Listar todas las brechas (el backend marca alerta_vencida si venció el plazo de 72h)
  getAll: async (token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/breaches`, {
      headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  // Registrar una nueva brecha (el backend calcula fecha_limite_notificacion: +72 horas)
  // breachData: { descripcion, datos_afectados, gravedad, fecha_deteccion?, cantidad_afectados?, organization_id? }
  create: async (breachData, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/breaches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      },
      body: JSON.stringify(breachData)
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  // Actualizar la investigación de la brecha
  // updateData: { estado?, medidas_tomadas?, responsable?, cantidad_afectados?, gravedad? }
  update: async (breachId, updateData, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/breaches/${breachId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  // Marcar la brecha como notificada a la Agencia (detiene el reloj de las 72h)
  notify: async (breachId, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/breaches/${breachId}/notify`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
};

// ============================================
// 🔧 FUNCIONES HELPER
// ============================================
export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  });

  return response;
};


// ============================================
// 🛡️ TREATMENTS API (Ley 21.719 - RoPA)
// ============================================
export const treatmentsAPI = {
  getAll: async (token) => {
    const activeToken = token || localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/treatments`, {
        headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }
      });
      if (!response.ok) throw new Error('Error al obtener tratamientos');
      return await response.json();
    } catch (e) {
      console.warn("Usando datos de fallback para tratamientos");
      return null; // El frontend manejará el fallback
    }
  },

  // Crear un tratamiento
  create: async (treatmentData, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/treatments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      },
      body: JSON.stringify(treatmentData)
    });
    if (!response.ok) {
      let detail = `Error ${response.status}`;
      try { const e = await response.json(); if (e.detail) detail = e.detail; } catch (_) {}
      throw new Error(detail);
    }
    return response.json();
  },

  // Eliminar un tratamiento
  delete: async (treatmentId, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/treatments/${treatmentId}`, {
      method: 'DELETE',
      headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  }
};

// ============================================
// 🎯 IMPACT ASSESSMENT API (Ley 21.719 - DPIA)
// ============================================
export const impactAPI = {
  getAll: async (token) => {
    const activeToken = token || localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/impact`, {
        headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }
      });
      if (!response.ok) throw new Error('Error al obtener evaluaciones de impacto');
      return await response.json();
    } catch (e) {
      return null;
    }
  }
};
// ============================================
// ✅ CONSENTS API
// ============================================
export const consentsAPI = {
  getAll: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/consents`, {
      headers: {
        ...(resolvedToken && {
          Authorization: `Bearer ${resolvedToken}`
        })
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Error al obtener los consentimientos');
    }

    return response.json();
  },

  getById: async (id, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/consents/${id}`, {
      headers: {
        ...(resolvedToken && {
          Authorization: `Bearer ${resolvedToken}`
        })
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Error al obtener el consentimiento');
    }

    return response.json();
  },

  create: async (consentData, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/consents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && {
          Authorization: `Bearer ${resolvedToken}`
        })
      },
      body: JSON.stringify(consentData)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Error al registrar el consentimiento');
    }

    return response.json();
  },

  revoke: async (id, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/consents/${id}/revoke`, {
      method: 'PATCH',
      headers: {
        ...(resolvedToken && {
          Authorization: `Bearer ${resolvedToken}`
        })
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Error al revocar el consentimiento');
    }

    return response.json();
  },

  delete: async (id, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/consents/${id}`, {
      method: 'DELETE',
      headers: {
        ...(resolvedToken && {
          Authorization: `Bearer ${resolvedToken}`
        })
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Error al eliminar el consentimiento');
    }

    return response.json();
  }
};

// ============================================
// 🏢 VENDORS API
// ============================================
export const vendorsAPI = {
  getAll: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/vendors/`, {
      headers: {
        ...(resolvedToken && {
          Authorization: `Bearer ${resolvedToken}`
        })
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener los proveedores');
    }

    return response.json();
  },

  getById: async (vendorId, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/vendors/${vendorId}`, {
      headers: {
        ...(resolvedToken && {
          Authorization: `Bearer ${resolvedToken}`
        })
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener el proveedor');
    }

    return response.json();
  },

  create: async (vendorData, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/vendors/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && {
          Authorization: `Bearer ${resolvedToken}`
        })
      },
      body: JSON.stringify(vendorData)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Error al crear el proveedor');
    }

    return response.json();
  },

  update: async (vendorId, vendorData, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/vendors/${vendorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && {
          Authorization: `Bearer ${resolvedToken}`
        })
      },
      body: JSON.stringify(vendorData)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Error al actualizar el proveedor');
    }

    return response.json();
  },

  delete: async (vendorId, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/vendors/${vendorId}`, {
      method: 'DELETE',
      headers: {
        ...(resolvedToken && {
          Authorization: `Bearer ${resolvedToken}`
        })
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Error al eliminar el proveedor');
    }

    return response.json();
  }
};

// ============================================
// 📍 ENDPOINTS (para referencia)
// ============================================
export const endpoints = {
  login: `${API_URL}/api/auth/login`,
  register: `${API_URL}/api/auth/register`,
  verify: `${API_URL}/api/auth/verify`,
  me: `${API_URL}/api/auth/me`,
  compliance: `${API_URL}/api/compliance`,
  controls: `${API_URL}/api/compliance/controls`,
  statistics: `${API_URL}/api/compliance/statistics`,
  documents: `${API_URL}/api/documents`,
  evidence: `${API_URL}/api/evidence`,
  risks: `${API_URL}/api/risks`,
  chat: `${API_URL}/api/chat`,
  users: `${API_URL}/api/users`,
  dataRequests: `${API_URL}/api/data-requests`,
  breaches: `${API_URL}/api/breaches`,
};

// ============================================
// 🚪 EXPORT DEFAULT
// ============================================
const api = {
  API_URL,
  userAPI,
  chatAPI,
  documentsAPI,
  complianceAPI,
  authAPI,
  evidenceAPI,
  riskAPI,
  vendorsAPI,
  consentsAPI,
  dataRequestsAPI,
  breachesAPI,
  authFetch,
  endpoints,
  treatmentsAPI,
  impactAPI
};

// services/api.js - Agregar estas funciones

// Obtener análisis completo
export const getFullGapAnalysis = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/gap-analysis/full`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Obtener plan de remediación
export const getRemediationPlan = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/gap-analysis/remediation-plan`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Obtener dashboard de KPIs
export const getKPIDashboard = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/gap-analysis/kpi-dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Obtener score de cumplimiento
export const getComplianceScore = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/gap-analysis/score`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Obtener scores por dominio ISO para el sidebar
export const getDomainScores = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/gap-analysis/domains`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// ==========================================
// Catálogo de preguntas de evaluación ISO 27001
// ==========================================
export const assessmentQuestionsAPI = {
  // Listar preguntas (opcionalmente filtradas por categoría)
  getAll: async (categoria = null, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const url = categoria
      ? `${API_URL}/api/assessment-questions/?categoria=${encodeURIComponent(categoria)}`
      : `${API_URL}/api/assessment-questions/`;
    const response = await fetch(url, {
      headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }
    });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  // Evaluar con IA: sube documentos y la IA responde cada pregunta.
  // questionIds = [] -> evalúa todas; con ids -> solo esas (revalidar).
  evaluate: async (files, questionIds = [], token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const form = new FormData();
    (files || []).forEach((f) => form.append('files', f));
    form.append('question_ids', (questionIds || []).join(','));
    // Timeout de seguridad: la evaluación con IA puede tardar, pero no debe
    // colgarse indefinidamente. Cortamos a los 5 minutos.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    try {
      const response = await fetch(`${API_URL}/api/assessment-questions/evaluate`, {
        method: 'POST',
        headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) },
        body: form,
        signal: controller.signal,
      });
      if (!response.ok) {
        let detail = `Error ${response.status}`;
        try { const e = await response.json(); if (e.detail) detail = e.detail; } catch (_) {}
        throw new Error(detail);
      }
      return response.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('La evaluación con IA tardó demasiado (timeout). Intenta con menos preguntas o vuelve a intentar.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};

// ============================================
// 🏢 ORGANIZATIONS API (Multi-Tenant)
// ============================================
export const organizationsAPI = {
  getAll: async (token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/organizations/`, {
      headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }
    });
    if (!response.ok) throw new Error('Error al obtener empresas');
    return response.json();
  },
  
  update: async (orgId, data, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/organizations/${orgId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar empresa');
    return response.json();
  }
};
// Recuerda exportarlo al final del archivo dentro de const api = { ... organizationsAPI ... }


export default api;