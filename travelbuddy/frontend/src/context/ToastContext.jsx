import React, { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

// Read mute setting directly from localStorage so it works without context ordering issues
function isNotificationMuted() {
  try {
    const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
    if (!token) return false;
    // webSettings are stored per-profile — we can't access them here without fetching
    // so we use a lightweight key written by WebSettingsContext
    return localStorage.getItem('ws_muteNotifications') === 'true';
  } catch { return false; }
}

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    // Suppress if notifications are muted
    if (isNotificationMuted()) return;
    setToast({ message, type });
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setToast(null), 300); // Wait for slide out animation
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div 
        className={`fixed top-5 right-5 z-[999] transition-all duration-300 transform ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {toast && (
          <div className={`px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            ) : null}
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
};
