// src/components/NotificationCenter.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, Clock, CheckCircle2, RefreshCw, Bell } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { API_URL } from '../services/api';

const labels = {
  en: {
    title: 'Notifications', markAllRead: 'Mark all read',
    noNotifications: 'No new notifications', loading: 'Loading...'
  },
  es: {
    title: 'Notificaciones', markAllRead: 'Marcar todo leído',
    noNotifications: 'Sin notificaciones nuevas', loading: 'Cargando...'
  },
  pt: {
    title: 'Notificações', markAllRead: 'Marcar tudo lido',
    noNotifications: 'Sem notificações novas', loading: 'Carregando...'
  }
};

const TYPE_ICON = { error: XCircle, warning: AlertTriangle, info: Clock, success: CheckCircle2 };
const TYPE_COLOR = { error: '#ef4444', warning: '#f59e0b', info: '#3b82f6', success: '#004ac6' };

function NotificationCenter({ isOpen, onClose, onCountChange }) {
  const { darkMode, theme: t, language } = useTheme();
  const l = labels[language] || labels.en;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/notifications/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const list = data.notifications || [];
      setNotifications(list);
      const unread = list.filter(n => !readIds.has(n.id)).length;
      onCountChange?.(unread);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  const markAllRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadIds(allIds);
    onCountChange?.(0);
  };

  const markRead = (id) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    const unread = notifications.filter(n => !next.has(n.id)).length;
    onCountChange?.(unread);
  };

  if (!isOpen) return null;

  const unread = notifications.filter(n => !readIds.has(n.id));
  const read = notifications.filter(n => readIds.has(n.id));
  const sorted = [...unread, ...read];

  return (
    <div style={{ position: 'absolute', top: '50px', right: '0', width: '380px', background: darkMode ? '#1e293b' : '#ffffff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', border: `1px solid ${t.border}`, overflow: 'hidden', zIndex: 100 }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: t.text }}>{l.title}</h3>
        <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#004ac6', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}>{l.markAllRead}</button>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: t.textDim, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '13px' }}>{l.loading}</span>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Bell size={32} color={t.textDim} style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '13px', color: t.textDim }}>{l.noNotifications}</p>
          </div>
        ) : sorted.map((notif) => {
          const Icon = TYPE_ICON[notif.type] || Clock;
          const color = TYPE_COLOR[notif.type] || t.textDim;
          const isRead = readIds.has(notif.id);
          return (
            <div
              key={notif.id}
              onClick={() => markRead(notif.id)}
              style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', gap: '12px', background: isRead ? 'transparent' : (darkMode ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)'), cursor: 'pointer' }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: t.text }}>{notif.title}</span>
                  {!isRead && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />}
                </div>
                <p style={{ fontSize: '12px', color: t.textDim, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.message}</p>
                <span style={{ fontSize: '11px', color: t.textMuted }}>{notif.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NotificationCenter;
