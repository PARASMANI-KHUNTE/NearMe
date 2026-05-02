import { useState, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Initialize theme from store
    const currentTheme = useThemeStore.getState().theme;
    useThemeStore.getState().setTheme(currentTheme);
  }, []);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="relative w-14 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] transition-all duration-300 hover:border-[var(--primary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)] overflow-hidden"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-pressed={theme === 'light'}
    >
      {/* Track */}
      <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />

      {/* Thumb */}
      <span
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-[var(--primary)] shadow-md transition-all duration-300 flex items-center justify-center z-10 ${
          theme === 'light' ? 'translate-x-6' : ''
        } ${isAnimating ? 'scale-110' : 'scale-100'}`}
        aria-hidden="true"
      >
        {theme === 'dark' ? (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 17a1 1 0 100-2H3a1 1 0 100 2h2zM4.465 17.293a1 1 0 10-1.414-1.414l.707.707a1 1 0 001.414 1.414l-.707.707zM8 12a1 1 0 100-2H7a1 1 0 100 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    </button>
  );
}
