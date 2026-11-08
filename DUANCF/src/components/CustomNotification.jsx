import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Context thông báo toàn cục
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Thêm toast mới
  const addToast = useCallback(({ type = 'info', title = '', message = '', duration = 3500 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, title, message, duration, createdAt: Date.now() };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  // Xóa toast theo ID
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Các hàm tiện ích
  const showSuccess = useCallback((message, title = 'Thành công') => {
    addToast({ type: 'success', title, message, duration: 3500 });
  }, [addToast]);

  const showError = useCallback((message, title = 'Thông báo lỗi') => {
    addToast({ type: 'error', title, message, duration: 4500 });
  }, [addToast]);

  const showWarning = useCallback((message, title = 'Cảnh báo') => {
    addToast({ type: 'warning', title, message, duration: 4000 });
  }, [addToast]);

  const showInfo = useCallback((message, title = 'Thông tin') => {
    addToast({ type: 'info', title, message, duration: 3500 });
  }, [addToast]);

  // Hộp thoại xác nhận thay thế window.confirm
  const showConfirm = useCallback(({ 
    title = 'Xác nhận hành động', 
    message = 'Bạn có chắc chắn muốn thực hiện thao tác này?', 
    confirmText = 'Xác nhận', 
    cancelText = 'Hủy bỏ', 
    type = 'danger', // 'danger' | 'warning' | 'primary'
    onConfirm, 
    onCancel 
  }) => {
    setConfirmDialog({
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setConfirmDialog(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmDialog(null);
      },
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        addToast,
        removeToast,
      }}
    >
      {children}

      {/* DANH SÁCH TOAST NỔI (GÓC TRÊN BÊN PHẢI) */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* MODAL XÁC NHẬN (THAY THẾ WINDOW.CONFIRM) */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 transform transition-all animate-scaleUp">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-100 text-rose-600'
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-indigo-100 text-indigo-600'
                }`}
              >
                {confirmDialog.type === 'danger' ? '🗑️' : confirmDialog.type === 'warning' ? '⚠️' : '❓'}
              </div>
              <h3 className="text-lg font-black text-slate-800">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed pl-1">
              {confirmDialog.message}
            </p>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={confirmDialog.onCancel}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-lg transition ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/30'
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/30'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/30'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

// Hook để các component con gọi thông báo dễ dàng
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// Component từng thẻ Toast
function ToastItem({ toast, onClose }) {
  const { type, title, message, duration } = toast;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!duration || duration <= 0) return;
    const intervalTime = 20;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration]);

  // Cấu hình màu sắc & biểu tượng theo loại thông báo
  const config = {
    success: {
      border: 'border-emerald-200',
      bg: 'bg-white',
      accent: 'bg-emerald-500',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: '✓',
      titleColor: 'text-emerald-950',
      progressBg: 'bg-emerald-500',
      shadow: 'shadow-emerald-500/10',
    },
    error: {
      border: 'border-rose-200',
      bg: 'bg-white',
      accent: 'bg-rose-500',
      iconBg: 'bg-rose-100 text-rose-600',
      icon: '✕',
      titleColor: 'text-rose-950',
      progressBg: 'bg-rose-500',
      shadow: 'shadow-rose-500/10',
    },
    warning: {
      border: 'border-amber-200',
      bg: 'bg-white',
      accent: 'bg-amber-500',
      iconBg: 'bg-amber-100 text-amber-700',
      icon: '!',
      titleColor: 'text-amber-950',
      progressBg: 'bg-amber-500',
      shadow: 'shadow-amber-500/10',
    },
    info: {
      border: 'border-indigo-200',
      bg: 'bg-white',
      accent: 'bg-indigo-500',
      iconBg: 'bg-indigo-100 text-indigo-600',
      icon: 'ℹ',
      titleColor: 'text-indigo-950',
      progressBg: 'bg-indigo-500',
      shadow: 'shadow-indigo-500/10',
    },
  }[type] || config.info;

  return (
    <div
      className={`pointer-events-auto rounded-2xl border ${config.border} ${config.bg} p-4 shadow-xl ${config.shadow} flex flex-col relative overflow-hidden transition-all duration-300 transform translate-y-0 opacity-100 hover:scale-[1.02]`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5 ${config.iconBg}`}
        >
          {config.icon}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-2">
          {title && (
            <h4 className={`text-xs font-black uppercase tracking-wider mb-0.5 ${config.titleColor}`}>
              {title}
            </h4>
          )}
          <p className="text-xs font-medium text-slate-700 leading-relaxed break-words">
            {message}
          </p>
        </div>

        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold hover:bg-gray-100 transition flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Thanh thời gian (Progress Bar) */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
          <div
            className={`h-full transition-all duration-75 ${config.progressBg}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

