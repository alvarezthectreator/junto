import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    message: string,
    type: ToastType = 'info',
    duration = 3000
  ) => {
    const id = Date.now().toString();
    const newToast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={index}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  index: number;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, index, onRemove }: ToastItemProps) {
  const typeStyles = {
    success: {
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-200',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />
    },
    error: {
      bg: 'bg-rose-500/10 border-rose-500/20',
      text: 'text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-400" />
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/20',
      text: 'text-blue-200',
      icon: <Info className="w-5 h-5 text-blue-400" />
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-200',
      icon: <AlertCircle className="w-5 h-5 text-amber-400" />
    }
  };

  const style = typeStyles[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, y: 0 }}
      animate={{ opacity: 1, x: 0, y: index * 100 }}
      exit={{ opacity: 0, x: 400 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`pointer-events-auto mb-3 flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm ${style.bg}`}
    >
      <div className="mt-0.5 flex-shrink-0">{style.icon}</div>
      <p className={`flex-1 text-sm font-medium ${style.text}`}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 mt-0.5 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
