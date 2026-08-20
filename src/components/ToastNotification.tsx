import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast, onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError   = toast.type === 'error';

  return (
    <div
      className="toast-anim"
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 20px',
        borderRadius: 99,
        background: isSuccess ? '#0f291a' : isError ? '#331217' : '#15233b',
        border: `1.5px solid ${isSuccess ? 'rgba(74, 222, 128, 0.5)' : isError ? 'rgba(248, 113, 113, 0.5)' : 'rgba(56, 189, 248, 0.5)'}`,
        boxShadow: isSuccess
          ? '0 10px 30px rgba(74, 222, 128, 0.3)'
          : isError
          ? '0 10px 30px rgba(248, 113, 113, 0.3)'
          : '0 10px 30px rgba(56, 189, 248, 0.3)',
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 700,
        backdropFilter: 'blur(12px)',
      }}
    >
      {isSuccess && <CheckCircle2 size={18} style={{ color: '#4ade80' }} />}
      {isError   && <AlertCircle size={18} style={{ color: '#f87171' }} />}
      {!isSuccess && !isError && <Info size={18} style={{ color: '#38bdf8' }} />}
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          padding: 2,
          marginLeft: 8,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
