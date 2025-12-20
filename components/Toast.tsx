
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const styles = {
    success: 'border-l-4 border-green-500',
    error: 'border-l-4 border-red-500',
    info: 'border-l-4 border-blue-500'
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${styles[toast.type]} animate-in slide-in-from-right-10 fade-in duration-300`}>
      {icons[toast.type]}
      <p className="font-medium text-sm">{toast.message}</p>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
