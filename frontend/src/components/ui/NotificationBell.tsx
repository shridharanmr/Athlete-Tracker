import React, { useState, useRef, useEffect } from 'react';
import { Bell, TrendingUp, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { SocketNotification } from '../../types';

interface Props {
  notifications: SocketNotification[];
  unreadCount: number;
  onMarkAllRead: () => void;
}

const TypeIcon: Record<SocketNotification['type'], React.ReactNode> = {
  performance: <TrendingUp size={13} color="var(--primary)" />,
  payment:     <CreditCard size={13} color="var(--success)" />,
  alert:       <AlertTriangle size={13} color="var(--warning)" />,
  info:        <Info size={13} color="var(--info)" />,
};

export default function NotificationBell({ notifications, unreadCount, onMarkAllRead }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) onMarkAllRead();
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        style={{
          width: '34px', height: '34px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-muted)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative',
          color: 'var(--text-secondary)', transition: 'all 0.18s',
        }}
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: 'var(--danger)', color: '#fff',
            borderRadius: '50%', fontSize: '0.6rem',
            width: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, border: '2px solid var(--bg-header)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: '320px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border)',
          zIndex: 1000, overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            fontWeight: 700, fontSize: '0.82rem',
            color: 'var(--text-primary)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Notifications
          </div>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '28px', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '0.85rem',
              }}>
                No notifications yet
              </div>
            ) : notifications.map((n) => (
              <div key={n.id} style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--border)',
                background: n.read ? 'var(--bg-card)' : 'var(--primary-light)',
                fontSize: '0.82rem', color: 'var(--text-secondary)',
                display: 'flex', flexDirection: 'column', gap: '3px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  {TypeIcon[n.type]}
                  <span style={{ color: 'var(--text-primary)' }}>{n.message}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '20px' }}>
                  {new Date(n.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
