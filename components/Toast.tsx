import React, { useEffect, useState } from 'react';
import { ICONS } from '../constants';
import { ToastState } from '../types';

interface ToastProps extends ToastState {
  onClose: () => void;
}

const TOAST_CONFIG = {
  success: { icon: ICONS.SUCCESS, barColor: 'bg-green-500' },
  error: { icon: ICONS.ERROR, barColor: 'bg-red-500' },
  info: { icon: ICONS.INFO, barColor: 'bg-blue-500' },
  warning: { icon: ICONS.WARNING, barColor: 'bg-yellow-500' },
};

export const Toast: React.FC<ToastProps> = ({ type, message, onClose, onUndo }) => {
  const [undoTimer, setUndoTimer] = useState(30);

  useEffect(() => {
    let undoInterval: number | undefined;
    if (onUndo) {
      undoInterval = window.setInterval(() => {
        setUndoTimer(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    
    let closeTimeout: number | undefined;
    if (!onUndo) {
        closeTimeout = window.setTimeout(onClose, 4000);
    }

    return () => {
      if(undoInterval) clearInterval(undoInterval);
      if(closeTimeout) clearTimeout(closeTimeout);
    };
  }, [onClose, onUndo]);

  const config = TOAST_CONFIG[type];

  const handleUndo = () => {
    if(onUndo) onUndo();
    onClose();
  }

  return (
    <div className="fixed bottom-5 right-5 w-full max-w-sm bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.barColor}`}></div>
      <div className="p-4 flex items-start">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{message}</p>
          <div className="mt-2 flex items-center flex-wrap gap-x-4 gap-y-1">
            {onUndo && (
              <button onClick={handleUndo} className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-semibold px-3 py-1 rounded-md">
                Hoàn tác ({undoTimer}s)
              </button>
            )}
            {(onUndo) && (
              <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 font-medium">
                Bỏ qua
              </button>
            )}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onClose} className="inline-flex text-slate-400 hover:text-slate-500">
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};