import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface InfographicCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

const InfographicCard: React.FC<InfographicCardProps> = ({ 
  title, 
  children, 
  className = '', 
  onClick,
  clickable = false 
}) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className={`${
        theme === 'dark' 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white/70 border-gray-200'
      } backdrop-blur-sm p-5 rounded-xl shadow-lg border h-full flex flex-col ${className} ${
        clickable ? 'cursor-pointer hover:shadow-xl transition-shadow duration-200' : ''
      } ${
        clickable && theme === 'dark' 
          ? 'hover:bg-slate-800/70' 
          : clickable 
          ? 'hover:bg-white/90' 
          : ''
      }`}
      onClick={clickable ? onClick : undefined}
    >
      <h3 className={`text-lg font-semibold mb-4 flex-shrink-0 ${
        theme === 'dark' ? 'text-slate-100' : 'text-gray-900'
      } ${clickable ? 'flex items-center justify-between' : ''}`}>
        {title}
        {clickable && (
          <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </h3>
      <div className="flex-1">
          {children}
      </div>
    </div>
  );
};

export default InfographicCard;