import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { AuthContext } from './AuthContext';

export const WebSettingsContext = createContext({
  webSettings: {},
  muteNotifications: false,
  t: (key) => key,
});

export const useWebSettings = () => useContext(WebSettingsContext);

const fontSizeMap = {
  small:  '13px',
  medium: '16px',
  large:  '19px',
};

export function WebSettingsProvider({ children }) {
  const { profile } = useContext(AuthContext);
  const { t: i18nT } = useTranslation();
  const [settings, setSettings] = useState({
    language: 'en',
    fontSize: 'medium',
    compactView: false,
    muteNotifications: false,
    muteUntil: null,
  });

  // Sync with profile whenever it loads/changes
  useEffect(() => {
    if (profile?.webSettings) {
      setSettings(prev => ({ ...prev, ...profile.webSettings }));
    }
  }, [profile?.webSettings]);

  // ── Drive i18next language whenever settings.language changes ──────────────
  useEffect(() => {
    const lang = settings.language || 'en';
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
  }, [settings.language]);

  // Apply font size to :root CSS variable
  useEffect(() => {
    const size = fontSizeMap[settings.fontSize] || '16px';
    document.documentElement.style.setProperty('--ws-font-size', size);
  }, [settings.fontSize]);

  // Apply / remove compact-view class on body
  useEffect(() => {
    if (settings.compactView) {
      document.body.classList.add('compact-view');
    } else {
      document.body.classList.remove('compact-view');
    }
  }, [settings.compactView]);

  // Determine if notifications are currently muted
  const isMuted = (() => {
    if (!settings.muteNotifications) return false;
    if (!settings.muteUntil) return true; // muted indefinitely
    return new Date(settings.muteUntil) > new Date(); // timed mute
  })();

  // Write mute state to localStorage so ToastContext can read it synchronously
  useEffect(() => {
    localStorage.setItem('ws_muteNotifications', String(isMuted));
  }, [isMuted]);

  // Translation helper — delegates to i18next; falls back to the key itself
  const t = (key) => i18nT(key, { defaultValue: key });

  return (
    <WebSettingsContext.Provider value={{ webSettings: settings, muteNotifications: isMuted, t }}>
      {children}
    </WebSettingsContext.Provider>
  );
}
