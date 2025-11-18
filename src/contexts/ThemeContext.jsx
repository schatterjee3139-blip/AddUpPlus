import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  setTheme: () => {},
  accentColor: '#3b82f6',
  setAccentColor: () => {},
  fontSize: 'medium',
  setFontSize: () => {},
  fontFamily: 'system',
  setFontFamily: () => {},
});

// Convert hex to HSL for accent color
const hexToHsl = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: h = 0;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const ThemeProvider = ({ children, defaultTheme = 'system', storageKey = 'ui-theme' }) => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  );
  const [accentColor, setAccentColorState] = useState(
    () => localStorage.getItem('accentColor') || '#3b82f6'
  );
  const [fontSize, setFontSizeState] = useState(
    () => localStorage.getItem('fontSize') || 'medium'
  );
  const [fontFamily, setFontFamilyState] = useState(
    () => localStorage.getItem('fontFamily') || 'system'
  );

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let systemTheme;
    if (theme === 'system') {
      systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Handle system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(newSystemTheme);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply accent color immediately on load and when changed
  useEffect(() => {
    if (accentColor && /^#[0-9A-F]{6}$/i.test(accentColor)) {
      const hsl = hexToHsl(accentColor);
      document.documentElement.style.setProperty('--primary', hsl);
    }
  }, [accentColor]);

  // Apply font size immediately on load and when changed
  useEffect(() => {
    const root = document.documentElement;
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.setProperty('--base-font-size', sizes[fontSize] || sizes.medium);
  }, [fontSize]);

  // Apply font family immediately on load and when changed
  useEffect(() => {
    const root = document.documentElement;
    const families = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: '"Courier New", Courier, monospace',
      sans: '"Inter", "Helvetica Neue", Arial, sans-serif',
    };
    root.style.setProperty('--font-family', families[fontFamily] || families.system);
  }, [fontFamily]);

  const setThemeWithStorage = (newTheme) => {
    localStorage.setItem(storageKey, newTheme);
    setTheme(newTheme);
  };

  const setAccentColor = (color) => {
    localStorage.setItem('accentColor', color);
    setAccentColorState(color);
  };

  const setFontSize = (size) => {
    localStorage.setItem('fontSize', size);
    setFontSizeState(size);
  };

  const setFontFamily = (family) => {
    localStorage.setItem('fontFamily', family);
    setFontFamilyState(family);
  };

  const value = {
    theme,
    setTheme: setThemeWithStorage,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


