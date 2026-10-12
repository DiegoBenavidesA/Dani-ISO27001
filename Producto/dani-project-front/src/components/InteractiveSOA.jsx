/* eslint-disable */
import React, { useState } from 'react';
import { FileCheck, CheckCircle2, Edit3 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const labels = {
  en: { 
    title: 'Statement of Applicability (SOA)', 
    control: 'Control', description: 'Description', 
    applicable: 'Applicable', notApplicable: 'Not Applicable', 
    justification: 'Justification', status: 'Status', 
    implemented: 'Implemented', planned: 'Planned', notImplemented: 'Not Implemented', 
    showAll: 'All', showApplicable: 'Applicable', showNotApplicable: 'Not Applicable', 
    required: 'Required', autoSaved: 'Auto-saved' 
  },
  es: { 
    title: 'Declaración de Aplicabilidad (SOA)', 
    control: 'Control', description: 'Descripción', 
    applicable: 'Aplica', notApplicable: 'No Aplica', 
    justification: 'Justificación', status: 'Estado', 
    implemented: 'Implementado', planned: 'Planificado', notImplemented: 'No Implementado', 
    showAll: 'Todos', showApplicable: 'Aplica', showNotApplicable: 'No Aplica', 
    required: 'Requerido', autoSaved: 'Auto-guardado' 
  },
  pt: { 
    title: 'Declaração de Aplicabilidade (SOA)', 
    control: 'Controle', description: 'Descrição', 
    applicable: 'Aplicável', notApplicable: 'Não Aplicável', 
    justification: 'Justificativa', status: 'Status', 
    implemented: 'Implementado', planned: 'Planejado', notImplemented: 'Não Implementado', 
    showAll: 'Todos', showApplicable: 'Aplicável', showNotApplicable: 'Não Aplicável', 
    required: 'Obrigatório', autoSaved: 'Auto-salvo' 
  }
};

// MODIFICADO: Ahora recibe de forma limpia los controles y el set del componente Padre para persistencia real
function InteractiveSOA({ controls = [], setControls }) {
  const { theme: t, language } = useTheme();
  const [filterApplicable, setFilterApplicable] = useState('all');
  const l = labels[language] || labels.en;

  // Lógica interactiva adaptada para actualizar el estado superior (GapAnalysisScreen) sin mutaciones directas
  const toggleApplicable = (id) => {
    setControls(prev => prev.map(c => {
      const currentId = c.control_id || c.id;
      if (currentId === id) {
        // Mapeamos de forma cruzada el atributo de aplicabilidad manejado en backend y frontend
        const nextApplicable = !(c.applies !== undefined ? c.applies : c.applicable);
        return { ...c, applies: nextApplicable, applicable: nextApplicable };
      }
      return c;
    }));
  };

  const updateStatus = (id, status) => {
    // Convertimos la nomenclatura si viene en minúsculas de la maqueta o capitalizado del backend
    let mappedStatus = status;
    if (status === 'implemented') mappedStatus = 'Implementado';
    if (status === 'planned') mappedStatus = 'Planificado';
    if (status === 'notImplemented') mappedStatus = 'No Implementado';

    setControls(prev => prev.map(c => {
      const currentId = c.control_id || c.id;
      return currentId === id ? { ...c, status: mappedStatus } : c;
    }));
  };

  // Filtrado reactivo con soporte para ambas nomenclaturas de objetos (Backend & Frontend Mockup)
  const filteredControls = controls.filter(c => {
    const isApplicable = c.applies !== undefined ? c.applies : c.applicable;
    if (filterApplicable === 'all') return true;
    if (filterApplicable === 'applicable') return isApplicable;
    if (filterApplicable === 'notApplicable') return !isApplicable;
    return true;
  });

  // Funciones de conveniencia para contadores de cabecera con validación de nulos
  const totalApplicable = controls.filter(c => c.applies !== undefined ? c.applies : c.applicable).length;
  const totalImplemented = controls.filter(c => {
    const isApp = c.applies !== undefined ? c.applies : c.applicable;
    const currentStatus = (c.status || '').toLowerCase();
    return isApp && (currentStatus === 'implementado' || currentStatus === 'implemented');
  }).length;

  return (
    <div style={{ background: t.cardBg, borderRadius: '20px', border: `1px solid ${t.border}`, overflow: 'hidden', marginTop: '24px' }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileCheck size={22} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{l.title}</h3>
            <p style={{ fontSize: '12px', color: t.textDim }}>
              {totalApplicable} {l.applicable} • {totalImplemented} {l.implemented}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[{ id: 'all', label: l.showAll }, { id: 'applicable', label: l.showApplicable }, { id: 'notApplicable', label: l.showNotApplicable }].map((filter) => (
            <button key={filter.id} onClick={() => setFilterApplicable(filter.id)} style={{ 
              padding: '8px 14px', 
              background: filterApplicable === filter.id ? '#8b5cf620' : 'transparent', 
              border: `1px solid ${filterApplicable === filter.id ? '#8b5cf6' : t.border}`, 
              borderRadius: '8px', color: filterApplicable === filter.id ? '#8b5cf6' : t.textMuted, 
              fontSize: '12px', fontWeight: 500, cursor: 'pointer' 
            }}>{filter.label}</button>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', width: '100px' }}>{l.control}</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.description}</th>
              <th style={{ padding: '14px 20px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', width: '140px' }}>{l.applicable}?</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase', width: '150px' }}>{l.status}</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: t.textDim, textTransform: 'uppercase' }}>{l.justification}</th>
            </tr>
          </thead>
          <tbody>
            {filteredControls.map((control) => {
              const currentId = control.control_id || control.id;
              const currentTitle = control.title || control.name;
              const isApplicable = control.applies !== undefined ? control.applies : control.applicable;
              
              // Normalizamos el string de estado para posicionar correctamente el select de la interfaz
              let selectValue = control.status || 'notImplemented';
              if (selectValue === 'Implementado') selectValue = 'implemented';
              if (selectValue === 'Planificado') selectValue = 'planned';
              if (selectValue === 'No Implementado') selectValue = 'notImplemented';

              return (
                <tr key={currentId} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: '16px 20px' }}><span style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', fontFamily: 'monospace' }}>{currentId}</span></td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '13px', color: t.text }}>{currentTitle}</div>
                    <span style={{ fontSize: '11px', color: t.textDim }}>{control.category}</span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => toggleApplicable(currentId)} style={{ padding: '6px 12px', background: isApplicable ? '#004ac620' : 'transparent', border: `1px solid ${isApplicable ? '#004ac6' : t.border}`, borderRadius: '6px 0 0 6px', color: isApplicable ? '#004ac6' : t.textDim, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>{l.applicable}</button>
                      <button onClick={() => toggleApplicable(currentId)} style={{ padding: '6px 12px', background: !isApplicable ? '#ef444420' : 'transparent', border: `1px solid ${!isApplicable ? '#ef4444' : t.border}`, borderRadius: '0 6px 6px 0', color: !isApplicable ? '#ef4444' : t.textDim, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>{l.notApplicable}</button>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {isApplicable && (
                      <select value={selectValue} onChange={(e) => updateStatus(currentId, e.target.value)} style={{ padding: '6px 10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: '6px', color: t.text, fontSize: '12px', outline: 'none', cursor: 'pointer' }}>
                        <option value="implemented">{l.implemented}</option>
                        <option value="planned">{l.planned}</option>
                        <option value="notImplemented">{l.notImplemented}</option>
                      </select>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: control.justification ? t.textMuted : '#ef4444' }}>{control.justification || l.required}</span>
                      <button style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: t.textDim }}><Edit3 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#004ac6' }}>
        <CheckCircle2 size={14} /><span>{l.autoSaved}</span>
      </div>
    </div>
  );
}

export default InteractiveSOA;