import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  setTheme: () => null,
  effectiveTheme: 'light'
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('personal_tracker_theme') || 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (targetTheme) => {
      let isDark = false;
      if (targetTheme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = targetTheme === 'dark';
      }

      root.classList.remove('light', 'dark');
      if (isDark) {
        root.classList.add('dark');
        setEffectiveTheme('dark');
      } else {
        root.classList.add('light');
        setEffectiveTheme('light');
      }
    };

    applyTheme(theme);
    localStorage.setItem('personal_tracker_theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => {
        applyTheme('system');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
