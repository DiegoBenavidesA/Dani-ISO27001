// Escala única de nivel de riesgo (impacto × probabilidad, 1 a 25).
// Es la misma que usa el backend al guardar un riesgo (routes/risk.py y
// risk_service.py), así el Mapa de Riesgos y el Análisis de Brechas muestran
// el mismo nivel para el mismo puntaje.
export const UMBRALES_RIESGO = { critico: 15, alto: 8, medio: 4 };

export const NIVELES_RIESGO = [
  { clave: 'bajo', nombre: 'Bajo', rango: '1–3', color: '#15803d', fondo: '#dcfce7' },
  { clave: 'medio', nombre: 'Medio', rango: '4–7', color: '#b45309', fondo: '#fef3c7' },
  { clave: 'alto', nombre: 'Alto', rango: '8–14', color: '#ea580c', fondo: '#ffedd5' },
  { clave: 'critico', nombre: 'Crítico', rango: '15–25', color: '#dc2626', fondo: '#fee2e2' },
];

export const nivelRiesgo = (score) => {
  if (score >= UMBRALES_RIESGO.critico) return NIVELES_RIESGO[3];
  if (score >= UMBRALES_RIESGO.alto) return NIVELES_RIESGO[2];
  if (score >= UMBRALES_RIESGO.medio) return NIVELES_RIESGO[1];
  return NIVELES_RIESGO[0];
};
