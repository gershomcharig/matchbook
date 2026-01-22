'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X, Info, Copy } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  };

  const isSuccess = toast.type === 'success';
  const isInfo = toast.type === 'info';
  const isError = toast.type === 'error';

  const getBackgroundClass = () => {
    if (isSuccess) return 'bg-emerald-50/95 dark:bg-emerald-950/95 border-emerald-200 dark:border-emerald-800';
    if (isInfo) return 'bg-blue-50/95 dark:bg-blue-950/95 border-blue-200 dark:border-blue-800';
    return 'bg-red-50/95 dark:bg-red-950/95 border-red-200 dark:border-red-800';
  };

  const getIcon = () => {
    if (isSuccess) return <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
    if (isInfo) return <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />;
    return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
  };

  const getTextClass = () => {
    if (isSuccess) return 'text-emerald-800 dark:text-emerald-200';
    if (isInfo) return 'text-blue-800 dark:text-blue-200';
    return 'text-red-800 dark:text-red-200';
  };

  const getButtonClass = () => {
    if (isSuccess) return 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900';
    if (isInfo) return 'text-blue-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900';
    return 'text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900';
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm
        transition-all duration-200 ease-out
        ${isVisible && !isLeaving ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
        ${getBackgroundClass()}
      `}
    >
      {/* Icon */}
      {getIcon()}

      {/* Message */}
      <p className={`text-sm font-medium flex-1 ${getTextClass()}`}>
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className={`p-1 rounded-lg transition-colors ${getButtonClass()}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Helper to generate unique IDs
let toastIdCounter = 0;
export function generateToastId(): string {
  return `toast-${++toastIdCounter}-${Date.now()}`;
}
