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
  authFetch,
  endpoints
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

export default api;