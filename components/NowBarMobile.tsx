import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface Pill {
  id: string;
  label: string;
  value: string | number | React.ReactNode;
  color?: string;
  onClick?: () => void;
}

interface NowBarMobileProps {
  pills: Pill[];
}

const NowBarMobile: React.FC<NowBarMobileProps> = ({ pills }) => {
  const [items, setItems] = useState(pills);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    
    // If user flicks up significantly (velocity or distance)
    if (info.offset.y < -50 || info.velocity.y < -200) {
      // Move the top card to the back
      setItems(prev => {
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    }
  };

  const handleTap = (pill: Pill) => {
    if (pill.onClick && !isDragging) {
      pill.onClick();
    }
  };

  return (
    <div className="w-full flex justify-center md:hidden">
      <div 
        className="relative w-[90vw] max-w-sm"
        style={{
          perspective: '1000px',
          height: '120px'
        }}
      >
        {items.map((pill, index) => {
          const isTop = index === 0;
          const scale = 1 - (index * 0.05);
          const yOffset = index * 16;
          const zIndex = items.length - index;

          return (
            <motion.div
              key={pill.id}
              drag={isTop ? "y" : false}
              dragConstraints={{ top: -200, bottom: 0 }}
              dragElastic={0.1}
              onDragStart={() => isTop && setIsDragging(true)}
              onDragEnd={handleDragEnd}
              onTap={() => isTop && handleTap(pill)}
              initial={false}
              animate={{
                scale: scale,
                y: yOffset,
                zIndex: zIndex,
                opacity: index < 3 ? 1 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25,
              }}
              className={`
                absolute top-0 left-0 w-full h-[100px]
                rounded-[32px] shadow-xl
                bg-white/90 dark:bg-gray-800/90
                backdrop-blur-lg
                border border-white/20
                ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
              `}
              style={{
                touchAction: 'none',
                willChange: 'transform',
              }}
            >
              <div className="px-6 py-4 flex items-center justify-between w-full">
                {/* Left side - Label */}
                <div className="flex flex-col items-start text-left flex-shrink-0">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">
                    {pill.id === 'store-health' ? (
                      // Single line for Store Health
                      pill.label
                    ) : (
                      // Multi-line for others
                      pill.label.split(' ').map((word, i) => (
                        <div key={i}>{word}</div>
                      ))
                    )}
                  </span>
                </div>
                
                {/* Right side - Value/Content */}
                <div className="flex items-center justify-end flex-1 ml-4">
                  {typeof pill.value === 'string' || typeof pill.value === 'number' ? (
                    <span className="text-4xl font-black text-gray-900 dark:text-white">
                      {pill.value}
                    </span>
                  ) : (
                    <div className="flex items-center justify-end w-full">
                      {pill.value}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Flick indicator on top card */}
              {isTop && !isDragging && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Flick up</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default NowBarMobile;
