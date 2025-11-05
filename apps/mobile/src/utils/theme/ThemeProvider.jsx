import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PREF_KEYS, loadPreferences, setPreference } from '@/utils/preferences';

const ThemeContext = createContext({
  isDark: false,
  setDark: (_v) => {},
  colors: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    text: '#1F2937',
    muted: '#6B7280',
    border: '#E5E7EB',
    primary: '#007AFF',
  },
});

const lightColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#1F2937',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#007AFF',
};

const darkColors = {
  background: '#0B0F14',
  surface: '#131A22',
  text: '#E5E7EB',
  muted: '#9CA3AF',
  border: '#1F2937',
  primary: '#60A5FA',
};

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  useEffect(() => {
    (async () => {
      const prefs = await loadPreferences();
      setIsDark(!!prefs.darkMode);
    })();
  }, []);

  const setDark = async (value) => {
    setIsDark(!!value);
    await setPreference(PREF_KEYS.darkMode, !!value);
  };

  return (
    <ThemeContext.Provider value={{ isDark, setDark, colors }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <React.Fragment>{children}</React.Fragment>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
