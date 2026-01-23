import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { hapticFeedback } from '../utils/haptics';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const handleClick = () => {
    // Use strong haptic feedback for theme toggle (like premium apps)
    hapticFeedback.strong();
    toggleTheme();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200 focus:outline-none shadow-lg hover:shadow-xl flex items-center justify-center select-none leading-none"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{ 
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {theme === 'dark' ? (
        <Moon className="w-5 h-5 text-slate-300" />
      ) : (
        <Sun className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
};

export default ThemeToggle;