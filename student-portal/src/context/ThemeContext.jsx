'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const SOCIETIES = {
  computer_society: {
    primary: '#0076D6', secondary: '#004A8F', accent: '#00D4FF',
    gradient: 'linear-gradient(135deg, #0076D6 0%, #00D4FF 50%, #004A8F 100%)',
    glow: 'rgba(0, 118, 214, 0.3)', backgroundEffect: 'code_rain',
  },
  student_branch: {
    primary: '#00629B', secondary: '#003D61', accent: '#4ECDC4',
    gradient: 'linear-gradient(135deg, #00629B 0%, #4ECDC4 50%, #003D61 100%)',
    glow: 'rgba(0, 98, 155, 0.3)', backgroundEffect: 'node_network',
  },
  women_in_engineering: {
    primary: '#6B2D8B', secondary: '#3D1952', accent: '#E040FB',
    gradient: 'linear-gradient(135deg, #6B2D8B 0%, #E040FB 50%, #3D1952 100%)',
    glow: 'rgba(107, 45, 139, 0.3)', backgroundEffect: 'aurora',
  },
  robotics: {
    primary: '#E74C3C', secondary: '#922B21', accent: '#FF7675',
    gradient: 'linear-gradient(135deg, #E74C3C 0%, #FF7675 50%, #922B21 100%)',
    glow: 'rgba(231, 76, 60, 0.3)', backgroundEffect: 'circuit_board',
  },
  industrial_applications: {
    primary: '#F39C12', secondary: '#B7770D', accent: '#FFEAA7',
    gradient: 'linear-gradient(135deg, #F39C12 0%, #FFEAA7 50%, #B7770D 100%)',
    glow: 'rgba(243, 156, 18, 0.3)', backgroundEffect: 'blueprint_grid',
  },
};

const DEFAULT_THEME = {
  primary: '#6C63FF',
  secondary: '#FF6584',
  accent: '#00D9FF',
  background: '#0a0a1a',
  surface: 'rgba(255, 255, 255, 0.05)',
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  gradient: 'linear-gradient(135deg, #6C63FF 0%, #00D9FF 50%, #FF6584 100%)',
  glow: 'rgba(108, 99, 255, 0.3)',
  backgroundEffect: null,
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [society, setSociety] = useState(null);

  const applyTheme = (bootcamp) => {
    if (!bootcamp) {
      setTheme(DEFAULT_THEME);
      setSociety(null);
      return;
    }

    const societyIds = Array.isArray(bootcamp.society)
      ? bootcamp.society.filter(Boolean)
      : (bootcamp.society ? [bootcamp.society] : []);
    const primarySociety = societyIds[0];
    const societyTheme = SOCIETIES[primarySociety] || {};
    const customTheme = bootcamp.colorTheme || {};

    const mergedTheme = {
      ...DEFAULT_THEME,
      ...societyTheme,
      ...customTheme,
    };

    setTheme(mergedTheme);
    setSociety(societyIds);

    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--color-primary', mergedTheme.primary);
    root.style.setProperty('--color-secondary', mergedTheme.secondary);
    root.style.setProperty('--color-accent', mergedTheme.accent);
    root.style.setProperty('--color-bg', mergedTheme.background || DEFAULT_THEME.background);
    root.style.setProperty('--color-surface', mergedTheme.surface || DEFAULT_THEME.surface);
    root.style.setProperty('--color-text', mergedTheme.text || DEFAULT_THEME.text);
    root.style.setProperty('--color-text-secondary', mergedTheme.textSecondary || DEFAULT_THEME.textSecondary);
    root.style.setProperty('--color-gradient', mergedTheme.gradient);
    root.style.setProperty('--color-glow', mergedTheme.glow);
  };

  const resetTheme = () => {
    setTheme(DEFAULT_THEME);
    setSociety(null);
    const root = document.documentElement;
    Object.keys(DEFAULT_THEME).forEach(key => {
      root.style.removeProperty(`--color-${key}`);
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, society, applyTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
