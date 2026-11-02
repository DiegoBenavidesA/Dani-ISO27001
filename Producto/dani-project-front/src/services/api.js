// src/services/api.js
// Configuración centralizada de la API (Sin importaciones de React)

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
    const response = await fetch(`${API_URL}/api/documents/${documentId}/acknowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(resolvedToken && { 'Authorization': `Bearer ${resolvedToken}` })
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || 'No se pudo registrar la aceptación');
    return data;
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
  delete: async (evidenceId, token) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/evidence/${evidenceId}`, { method: 'DELETE', headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.detail || 'No se pudo eliminar la evidencia.'); }
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
  },
  predictVulnerabilities: async (token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/risks/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken && { 'Authorization': `Bearer ${activeToken}` })
      }
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Error HTTP ${response.status}`);
    }
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
  },
  autoRemediate: async (payload) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/capas/auto-remediate`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
      body: JSON.stringify(payload) 
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Fallo al ejecutar script de remediación');
    }
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
  },
  delete: async (breachId, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/breaches/${breachId}`, { method: 'DELETE', headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
};

export const authFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const defaultOptions = { headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': `Bearer ${token}` }) } };
  return await fetch(`${API_URL}${endpoint}`, { ...defaultOptions, ...options, headers: { ...defaultOptions.headers, ...options.headers } });
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

  // Superadmin: la IA redacta como pregunta, con título corto y evidencia
  // esperada, las preguntas del marco que no la tienen (p. ej. las de un PDF).
  // Corre en segundo plano; onProgress recibe {done, total, stage}.
  mejorar: async (marco, onProgress = null) => {
    const token = localStorage.getItem('token');
    const auth = token ? { 'Authorization': `Bearer ${token}` } : {};
    const form = new FormData();
    form.append('marco', marco);
    const inicio = await fetch(`${API_URL}/api/assessment-questions/mejorar`, { method: 'POST', headers: auth, body: form });
    if (!inicio.ok) { const err = await inicio.json().catch(() => ({})); throw new Error(err.detail || `Error ${inicio.status}`); }
    const { job_id, total } = await inicio.json();
    if (!job_id) return { total: 0, con_ia: 0 };
    for (;;) {
      await new Promise((r) => setTimeout(r, 2500));
      const resp = await fetch(`${API_URL}/api/assessment-questions/mejorar/${job_id}`, { headers: auth });
      if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.detail || `Error ${resp.status}`); }
      const job = await resp.json();
      if (onProgress) onProgress({ done: job.done, total: job.total || total, stage: job.stage });
      if (job.status === 'done') return job.result;
      if (job.status === 'error') throw new Error(job.error || 'No se pudieron mejorar las preguntas');
    }
  },

  // Respuestas guardadas de la empresa (incluye las marcadas como "no aplica").
  getAnswers: async (token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/assessment-questions/answers`, { headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error(`Error ${response.status}`);
    return response.json();
  },
  // Respuesta manual (veredicto: 'cumple' | 'parcial' | 'no_cumple').
  setAnswer: async (questionId, veredicto, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/assessment-questions/answers/${questionId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify({ veredicto }) });
    if (!response.ok) throw new Error('No se pudo guardar la respuesta');
    return response.json();
  },
  // La empresa declara que una pregunta no le aplica, con justificación.
  setNoAplica: async (questionId, justificacion, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/assessment-questions/answers/${questionId}/no-aplica`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }, body: JSON.stringify({ justificacion }) });
    if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.detail || 'No se pudo marcar como "no aplica"'); }
    return response.json();
  },
  clearNoAplica: async (questionId, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/assessment-questions/answers/${questionId}/no-aplica`, { method: 'DELETE', headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) } });
    if (!response.ok) throw new Error('No se pudo quitar el "no aplica"');
    return response.json();
  },

  // Carga masiva desde Excel (.xlsx) a un marco ('iso27001' o 'ley21719').
  // Devuelve { marco, creadas, omitidas, columnas_detectadas, ... }
  bulkImport: async (file, marco, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const form = new FormData();
    form.append('file', file);
    form.append('marco', marco);
    const response = await fetch(`${API_URL}/api/assessment-questions/bulk-import`, {
      method: 'POST',
      headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) },
      body: form
    });
    if (!response.ok) {
      let detail = `Error ${response.status}`;
      try { const e = await response.json(); if (e.detail) detail = e.detail; } catch (_) {}
      throw new Error(detail);
    }
    return response.json();
  },

  // Carga masiva desde un PDF (checklist/listado) a un marco ('iso27001' o 'ley21719').
  // Devuelve { marco, creadas, omitidas, total_detectadas, categorias }
  bulkImportPdf: async (file, marco, token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const form = new FormData();
    form.append('file', file);
    form.append('marco', marco);
    const response = await fetch(`${API_URL}/api/assessment-questions/bulk-import-pdf`, {
      method: 'POST',
      headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) },
      body: form
    });
    if (!response.ok) {
      let detail = `Error ${response.status}`;
      try { const e = await response.json(); if (e.detail) detail = e.detail; } catch (_) {}
      throw new Error(detail);
    }
    return response.json();
  },

  // Descarga la plantilla Excel con las columnas esperadas.
  downloadTemplate: async (token = null) => {
    const activeToken = token || localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/assessment-questions/bulk-template`, {
      headers: { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) }
    });
    if (!response.ok) throw new Error('No se pudo descargar la plantilla');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_preguntas.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // Evaluar con IA: la IA responde las preguntas de UN marco ('iso27001' o 'ley21719').
  // questionIds = [] -> evalúa todas; con ids -> solo esas (revalidar).
  // La evaluación corre en segundo plano en el servidor: este método la inicia
  // y consulta el avance cada 2 s, llamando a onProgress({ done, total, stage }).
  // Devuelve { marco, total, results, evaluated_with_ai }.
  evaluate: async (marco, files, questionIds = [], evidenceIds = [], token = null, onProgress = null) => {
    const activeToken = token || localStorage.getItem('token');
    const headers = { ...(activeToken && { 'Authorization': `Bearer ${activeToken}` }) };
    const form = new FormData();
    (files || []).forEach((f) => form.append('files', f));
    form.append('marco', marco);
    form.append('question_ids', (questionIds || []).join(','));
    form.append('evidence_ids', (evidenceIds || []).join(','));

    const leerError = async (response) => {
      let detail = `Error ${response.status}`;
      try { const e = await response.json(); if (e.detail) detail = e.detail; } catch (_) {}
      return new Error(detail);
    };

    const start = await fetch(`${API_URL}/api/assessment-questions/evaluate`, { method: 'POST', headers, body: form });
    if (!start.ok) throw await leerError(start);
    const { job_id, total } = await start.json();
    if (onProgress) onProgress({ done: 0, total, stage: 'Iniciando evaluación' });

    // Hasta ~60 min de espera; los fallos de red puntuales no cortan el sondeo.
    let fallosSeguidos = 0;
    for (let i = 0; i < 1800; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      let job;
      try {
        const res = await fetch(`${API_URL}/api/assessment-questions/evaluate/${job_id}`, { headers });
        if (!res.ok) throw await leerError(res);
        job = await res.json();
        fallosSeguidos = 0;
      } catch (err) {
        if (++fallosSeguidos >= 10) throw err;
        continue;
      }
      if (onProgress) onProgress({ done: job.done, total: job.total, stage: job.stage });
      if (job.status === 'done') return job.result;
      if (job.status === 'error') throw new Error(job.error || 'La evaluación falló.');
    }
    throw new Error('La evaluación con IA tardó demasiado. Vuelve a intentarlo.');
  },
};

const api = {
  API_URL, userAPI, chatAPI, documentsAPI, complianceAPI, authAPI, evidenceAPI, riskAPI, capaAPI,
  breachesAPI, authFetch, endpoints, organizationsAPI,
  assessmentQuestionsAPI, getFullGapAnalysis, getRemediationPlan, getKPIDashboard, getComplianceScore, getDomainScores
};

export default api;