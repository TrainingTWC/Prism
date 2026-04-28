import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { hapticFeedback } from '../utils/haptics';

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
      className="w-9 h-9 rounded-full text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors duration-200 focus:outline-none flex items-center justify-center select-none"
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
      {theme === 'dark'
        ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.75} />
        : <Moon className="w-[18px] h-[18px]" strokeWidth={1.75} />}
    </button>
  );
};

export default ThemeToggle;