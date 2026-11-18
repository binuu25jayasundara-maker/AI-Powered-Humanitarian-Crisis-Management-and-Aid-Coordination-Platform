import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const config = {
    success: { icon: CheckCircle, color: '#15803d', bg: '#dcfce7', border: '#bbf7d0', iconColor: 'var(--color-green-success)' },
    error:   { icon: XCircle,     color: '#991b1b', bg: '#fef2f2', border: '#fecaca', iconColor: 'var(--color-red-danger)' },
    warning: { icon: AlertTriangle,color: '#92400e', bg: '#fef3c7', border: '#fde68a', iconColor: 'var(--color-amber-warning)' },
    info:    { icon: Info,         color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', iconColor: 'var(--color-blue-primary)' },
  }[type];

  const Icon = config.icon;

  React.useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      minWidth: 320,
      maxWidth: 480,
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 'var(--radius-lg, 12px)',
      boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      animation: 'slideIn 0.25s ease',
    }}>
      <Icon size={18} color={config.iconColor} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: config.color, lineHeight: 1.5 }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: config.color, padding: 2 }}
      >
        <X size={14} />
      </button>
      <style>{`@keyframes slideIn { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export function useToast() {
  const [toast, setToast] = React.useState<{ message: string; type: ToastType } | null>(null);

  const showToast = React.useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  }, []);

  const clearToast = React.useCallback(() => setToast(null), []);

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={clearToast} />
  ) : null;

  return { showToast, ToastComponent };
}
