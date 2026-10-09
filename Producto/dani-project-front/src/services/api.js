// src/services/api.js - VERSIÓN COMPLETA
export const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

export const userAPI = {
  getUsers: async (token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/users`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    return response.json();
  },
  getAll: async (token) => userAPI.getUsers(token),
  getUserById: async (userId, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/users/${userId}`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    return response.json();
  },
  getOne: async (userId, token) => userAPI.getUserById(userId, token),
  createUser: async (userData, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(userData) });
    return response.json();
  },
  create: async (userData, token) => userAPI.createUser(userData, token),
  invite: async (data, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/users/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(data) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || 'Error al invitar usuario');
    return body;
  },
  updateUser: async (userId, userData, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(userData) });
    return response.json();
  },
  update: async (userId, userData, token) => userAPI.updateUser(userId, userData, token),
  deleteUser: async (userId, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/users/${userId}`, { method: 'DELETE', headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    return response.json();
  },
  delete: async (userId, token) => userAPI.deleteUser(userId, token)
};

export const chatAPI = {
  sendMessage: async (message, language = 'es', token = null, signal = null, history = []) => {
    try {
      const resolvedToken = token || localStorage.getItem('token');
      let effectiveSignal = signal;
      let timeoutId = null;
      if (!effectiveSignal) {
        const controller = new AbortController();
        effectiveSignal = controller.signal;
        timeoutId = setTimeout(() => controller.abort(), 30000); 
      }
      const response = await fetch(`${API_URL}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) }, body: JSON.stringify({ message, language, history }), signal: effectiveSignal });
      if (timeoutId) clearTimeout(timeoutId);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 503) throw new Error(errorData.detail || "Servicio Analítico Degradado: El motor de IA no está disponible.");
        throw new Error(errorData.detail || `Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') return { error: 'Tiempo de espera agotado (Timeout de 30s).' };
      return { error: error.message };
    }
  }
};

export const documentsAPI = {
  getAll: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents`, { headers: { ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) } });
    return response.json();
  },
  generate: async (docType, data, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/generate/${docType}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) }, body: JSON.stringify(data) });
    return response.json();
  },
  getDocument: async (chapterId, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/${chapterId}`, { headers: { ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) } });
    return response.json();
  },
  saveDocument: async (chapterId, title, content, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) }, body: JSON.stringify({ chapter_id: chapterId, title, content }) });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  updateStatus: async (chapterId, status, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/${chapterId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) }, body: JSON.stringify({ status }) });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  getPublishedPolicies: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/published/policies`, { method: 'GET', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) } });
    return response.json();
  },
  acknowledgePolicy: async (documentId, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/documents/${documentId}/acknowledge`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) } });
    return response.json();
  }
};

export const complianceAPI = {
  getControls: async (token, category = null) => {
    const resolvedToken = token || localStorage.getItem('token'); 
    const url = category ? `${API_URL}/api/compliance/controls?category=${category}` : `${API_URL}/api/compliance/controls`;
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${resolvedToken}`, 'Content-Type': 'application/json' } });
    return response.json();
  },
  getStatistics: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/compliance/statistics`, { headers: { ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) } });
    return response.json();
  },
  assessControl: async (controlId, evidence, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/compliance/assess/${controlId}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) }, body: JSON.stringify(evidence) });
    return response.json();
  },
  fullAssessment: async (organizationData, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/compliance/full-assessment`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) }, body: JSON.stringify(organizationData) });
    return response.json();
  },
  evaluateControl: async (controlId, documentId, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/compliance/${controlId}/evaluate`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) }, body: JSON.stringify({ document_id: documentId }) });
    return response.json();
  },
  bulkAudit: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/compliance/bulk-audit`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) } });
    return response.json();
  }
};

export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    return response.json();
  },
  register: async (name, email, password) => {
    const response = await fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
    return response.json();
  },
  verify: async (token) => {
    const response = await fetch(`${API_URL}/api/auth/verify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    return response.json();
  },
  getMe: async (token) => {
    const response = await fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
    return response.json();
  },
  getActivationInfo: async (token) => {
    const response = await fetch(`${API_URL}/api/auth/activate/${token}`);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || 'El enlace de activación no es válido.');
    return body;
  },
  activate: async (token, newPassword) => {
    const response = await fetch(`${API_URL}/api/auth/activate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, new_password: newPassword }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || 'No se pudo activar la cuenta.');
    return body;
  }
};

export const evidenceAPI = {
  getAll: async (token) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/evidence`, { headers: { 'Authorization': `Bearer ${resolvedToken}` } });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  upload: async (fileOrFormData, token) => {
    const resolvedToken = token || localStorage.getItem('token');
    const body = fileOrFormData instanceof FormData ? fileOrFormData : (() => { const fd = new FormData(); fd.append('file', fileOrFormData); return fd; })();
    const response = await fetch(`${API_URL}/api/evidence/upload`, { method: 'POST', headers: { ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` }) }, body });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  download: async (evidenceId, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/evidence/${evidenceId}/download`, { headers: { ...(activeToken && { Authorization: `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error('Error al descargar evidencia');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
  exportZip: async (token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/evidence/export/zip`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error('Error al exportar en ZIP');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
};

export const riskAPI = {
  getAll: async (token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/risks`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    return response.json();
  },
  create: async (riskData, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/risks`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(riskData) });
    return response.json();
  },
  getStatistics: async (token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/risks/statistics`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    return response.json();
  },
  analyzeWithAI: async (riskId, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/risks/${riskId}/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  }
};

export const capaAPI = {
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/capas/`, { headers: { Authorization: `Bearer ${token}` } });
    return response.json();
  },
  create: async (data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/capas/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Error al crear CAPA');
    return response.json();
  },
  updateStatus: async (dbId, status, progress = null) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/capas/${dbId}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status, progress }) });
    if (!response.ok) throw new Error('Error al actualizar estado');
    return response.json();
  },
  delete: async (dbId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/capas/${dbId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('Error al eliminar CAPA');
    return response.json();
  }
};

export const dataRequestsAPI = {
  getAll: async (token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/data-requests`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  getOne: async (requestId, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/data-requests/${requestId}`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  },
  create: async (requestData, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/data-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(requestData) });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  update: async (requestId, updateData, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/data-requests/${requestId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(updateData) });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
};

export const breachesAPI = {
  getAll: async (token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/breaches`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  create: async (breachData, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/breaches`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(breachData) });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  update: async (breachId, updateData, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/breaches/${breachId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(updateData) });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },
  notify: async (breachId, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/breaches/${breachId}/notify`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
};

export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const defaultOptions = { headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) } };
  return await fetch(`${API_URL}${endpoint}`, { ...defaultOptions, ...options, headers: { ...defaultOptions.headers, ...options.headers } });
};

export const treatmentsAPI = {
  getAll: async (token) => {
    const activeToken = token || localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/treatments`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
      if (!response.ok) throw new Error('Error al obtener tratamientos');
      return await response.json();
    } catch (e) {
      console.warn("Usando datos de fallback para tratamientos");
      return null; 
    }
  },
  create: async (treatmentData, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/treatments/`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(treatmentData) });
    if (!response.ok) {
      let detail = `Error ${response.status}`;
      try { const e = await response.json(); if (e.detail) detail = e.detail; } catch (_) {}
      throw new Error(detail);
    }
    return response.json();
  },
  delete: async (treatmentId, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/treatments/${treatmentId}`, { method: 'DELETE', headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  }
};

export const impactAPI = {
  getAll: async (token = null) => {
    const activeToken = token || localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/impact`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
      if (!response.ok) throw new Error('Error al obtener evaluaciones');
      return await response.json();
    } catch (e) { return null; }
  },
  analyzeAll: async (token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/impact/analyze-all`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  }
};

// ============================================
// ✅ CONSENTS API (Solucionado bloqueo CORS quitando slash final)
// ============================================
export const consentsAPI = {
  getAll: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/consents`, { headers: { ...(resolvedToken && { Authorization: `Bearer ${resolvedToken}` }) } });
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.detail || 'Error al obtener'); }
    return response.json();
  },
  getById: async (id, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/consents/${id}`, { headers: { ...(resolvedToken && { Authorization: `Bearer ${resolvedToken}` }) } });
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.detail || 'Error al obtener'); }
    return response.json();
  },
  create: async (consentData, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/consents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(resolvedToken && { Authorization: `Bearer ${resolvedToken}` }) },
      body: JSON.stringify(consentData)
    });
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.detail || 'Error al registrar'); }
    return response.json();
  },
  revoke: async (id, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/consents/${id}/revoke`, {
      method: 'POST',
      headers: { ...(resolvedToken && { Authorization: `Bearer ${resolvedToken}` }) }
    });
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.detail || 'Error al revocar'); }
    return response.json();
  },
  delete: async (id, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/consents/${id}`, {
      method: 'DELETE',
      headers: { ...(resolvedToken && { Authorization: `Bearer ${resolvedToken}` }) }
    });
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.detail || 'Error al eliminar'); }
    return response.json();
  }
};

export const vendorsAPI = {
  getAll: async (token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/vendors/`, { headers: { ...(resolvedToken && { Authorization: `Bearer ${resolvedToken}` }) } });
    if (!response.ok) throw new Error('Error al obtener');
    return response.json();
  },
  getById: async (vendorId, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/vendors/${vendorId}`, { headers: { ...(resolvedToken && { Authorization: `Bearer ${resolvedToken}` }) } });
    if (!response.ok) throw new Error('Error al obtener');
    return response.json();
  },
  create: async (vendorData, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/vendors/`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { Authorization: `Bearer ${resolvedToken}` }) }, body: JSON.stringify(vendorData) });
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.detail || 'Error al crear'); }
    return response.json();
  },
  update: async (vendorId, vendorData, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/vendors/${vendorId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(resolvedToken && { Authorization: `Bearer ${resolvedToken}` }) }, body: JSON.stringify(vendorData) });
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.detail || 'Error al actualizar'); }
    return response.json();
  },
  delete: async (vendorId, token = null) => {
    const resolvedToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/vendors/${vendorId}`, { method: 'DELETE', headers: { ...(resolvedToken && { Authorization: `Bearer ${resolvedToken}` }) } });
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.detail || 'Error al eliminar'); }
    return response.json();
  }
};

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

export const organizationsAPI = {
  getAll: async (token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/organizations/`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error('Error al obtener empresas');
    return response.json();
  },
  update: async (orgId, data, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/organizations/${orgId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Error al actualizar empresa');
    return response.json();
  },
  create: async (data, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/organizations/`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(data) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || 'Error al crear la empresa');
    return body;
  },
  inviteUser: async (orgId, data, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/organizations/${orgId}/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(data) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || 'Error al invitar usuario');
    return body;
  }
};

export const getFullGapAnalysis = async () => { const token = localStorage.getItem('token'); const response = await fetch(`${API_URL}/api/gap-analysis/full`, { headers: { 'Authorization': `Bearer ${token}` } }); return response.json(); };
export const getRemediationPlan = async () => { const token = localStorage.getItem('token'); const response = await fetch(`${API_URL}/api/gap-analysis/remediation-plan`, { headers: { 'Authorization': `Bearer ${token}` } }); return response.json(); };
export const getKPIDashboard = async () => { const token = localStorage.getItem('token'); const response = await fetch(`${API_URL}/api/gap-analysis/kpi-dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }); return response.json(); };
export const getComplianceScore = async () => { const token = localStorage.getItem('token'); const response = await fetch(`${API_URL}/api/gap-analysis/score`, { headers: { 'Authorization': `Bearer ${token}` } }); return response.json(); };
export const getDomainScores = async () => { const token = localStorage.getItem('token'); const response = await fetch(`${API_URL}/api/gap-analysis/domains`, { headers: { 'Authorization': `Bearer ${token}` } }); return response.json(); };

export const assessmentQuestionsAPI = {
  getAll: async (categoria = null, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const url = categoria ? `${API_URL}/api/assessment-questions/?categoria=${encodeURIComponent(categoria)}` : `${API_URL}/api/assessment-questions/`;
    const response = await fetch(url, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
  create: async (data, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/assessment-questions/`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Error al crear la pregunta');
    return response.json();
  },
  update: async (id, data, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/assessment-questions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Error al actualizar la pregunta');
    return response.json();
  },
  delete: async (id, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/assessment-questions/${id}`, { method: 'DELETE', headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error('Error al eliminar la pregunta');
    return response.json();
  },
  evaluate: async (files, questionIds = [], token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const form = new FormData();
    (files || []).forEach((f) => form.append('files', f));
    form.append('question_ids', (questionIds || []).join(','));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    try {
      const response = await fetch(`${API_URL}/api/assessment-questions/evaluate`, { method: 'POST', headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: form, signal: controller.signal });
      if (!response.ok) { let detail = `Error ${response.status}`; try { const e = await response.json(); if (e.detail) detail = e.detail; } catch (_) {} throw new Error(detail); }
      return response.json();
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Timeout. Intenta de nuevo.');
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};

const api = {
  API_URL, userAPI, chatAPI, documentsAPI, complianceAPI, authAPI, evidenceAPI, riskAPI, vendorsAPI,
  consentsAPI, dataRequestsAPI, breachesAPI, authFetch, endpoints, treatmentsAPI, impactAPI, organizationsAPI
};

export default api;