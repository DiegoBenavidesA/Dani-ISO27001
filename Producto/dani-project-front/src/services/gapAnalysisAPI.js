// src/services/gapAnalysisAPI.js
import { API_URL } from './api';

const getToken = () => localStorage.getItem('token');

// Headers comunes para requests autenticados
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

// Obtener análisis completo
export const getFullGapAnalysis = async () => {
  const response = await fetch(`${API_URL}/api/gap-analysis/full`, {
    method: 'GET',
    headers: authHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Error al obtener el análisis de brechas');
  }
  
  return response.json();
};

// Obtener solo controles
export const getControlGaps = async (priority = null, category = null) => {
  let url = `${API_URL}/api/gap-analysis/controls`;
  const params = new URLSearchParams();
  if (priority) params.append('priority', priority);
  if (category) params.append('category', category);
  if (params.toString()) url += `?${params.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders()
  });
  
  return response.json();
};

// Obtener matriz de madurez
export const getMaturityMatrix = async () => {
  const response = await fetch(`${API_URL}/api/gap-analysis/maturity`, {
    method: 'GET',
    headers: authHeaders()
  });
  
  return response.json();
};

// Obtener plan de remediación
export const getRemediationPlan = async () => {
  const response = await fetch(`${API_URL}/api/gap-analysis/remediation-plan`, {
    method: 'GET',
    headers: authHeaders()
  });
  
  return response.json();
};

// Obtener dashboard de KPIs
export const getKPIDashboard = async () => {
  const response = await fetch(`${API_URL}/api/gap-analysis/kpi-dashboard`, {
    method: 'GET',
    headers: authHeaders()
  });
  
  return response.json();
};

// Obtener score de cumplimiento
export const getComplianceScore = async () => {
  const response = await fetch(`${API_URL}/api/gap-analysis/score`, {
    method: 'GET',
    headers: authHeaders()
  });
  
  return response.json();
};

// Guardar la meta interna de cumplimiento de la SOA (1 a 100)
export const setMetaCumplimiento = async (meta) => {
  const response = await fetch(`${API_URL}/api/gap-analysis/meta`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ meta })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(response.status === 403 ? 'Solo owner, admin o manager pueden cambiar la meta.' : (typeof err.detail === 'string' ? err.detail : 'No se pudo guardar la meta.'));
  }
  return response.json();
};

// Actualizar KPI
export const updateKPI = async (kpiId, currentValue) => {
  const response = await fetch(`${API_URL}/api/gap-analysis/kpi/update?kpi_id=${kpiId}&current_value=${currentValue}`, {
    method: 'POST',
    headers: authHeaders()
  });
  
  return response.json();
};

// Crear acción de remediación
export const createRemediationAction = async (gapId, actionData) => {
  const response = await fetch(`${API_URL}/api/gap-analysis/remediation-actions/${gapId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(actionData)
  });

  return response.json();
};

// Analizar documento con LLM contra controles ISO 27001
export const analyzeDocument = async (documentText, documentName = 'Documento') => {
  const response = await fetch(`${API_URL}/api/gap-analysis/analyze-document`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ document_text: documentText, document_name: documentName })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Error al analizar el documento');
  }

  return response.json();
};