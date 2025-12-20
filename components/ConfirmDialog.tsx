
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, confirmLabel = "Confirm", isDestructive = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDestructive ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
             <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onCancel(); }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
