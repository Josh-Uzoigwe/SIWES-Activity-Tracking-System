import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ style = {}, className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-main)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: 'var(--shadow-sm)',
        ...style
      }}
    >
      {isDark ? (
        <Sun size={17} color="#fbbf24" style={{ transition: 'transform 0.2s ease' }} />
      ) : (
        <Moon size={17} color="#475569" style={{ transition: 'transform 0.2s ease' }} />
      )}
    </button>
  );
};

export default ThemeToggle;
