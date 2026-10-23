import React, { useEffect } from 'react';
import {
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoInformationCircleOutline,
  IoCloseOutline
} from 'react-icons/io5';

const Toast = ({ message, type = 'info', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  let bgClass = 'bg-neutral-900 text-white border-neutral-900';
  let Icon = IoInformationCircleOutline;
  let iconColor = 'text-lime-400';

  if (type === 'success') {
    bgClass = 'bg-emerald-950 text-white border-emerald-800';
    Icon = IoCheckmarkCircleOutline;
    iconColor = 'text-emerald-400';
  } else if (type === 'error') {
    bgClass = 'bg-rose-950 text-white border-rose-800';
    Icon = IoAlertCircleOutline;
    iconColor = 'text-rose-400';
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 ${bgClass} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs font-bold max-w-md`}
        role="alert"
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
        <span className="flex-1 font-sans">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md cursor-pointer transition-colors"
            aria-label="Dismiss notification"
          >
            <IoCloseOutline className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
