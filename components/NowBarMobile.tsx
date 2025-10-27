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

  // Haptics helper - different patterns for different interactions
  // Patterns (milliseconds):
  // light: 10 (subtle)
  // medium: [20, 10] (tap-like)
  // strong: [40, 20, 40] (noticeable)
  const vibrate = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        // @ts-ignore - navigator.vibrate exists in browsers that support it
        navigator.vibrate(pattern);
      }
    } catch (e) {
      // ignore - vibration not supported or blocked
    }
  };

  // Update pill data while preserving user's custom order
  React.useEffect(() => {
    setItems(prevItems => {
      // Create a map of updated pills by id
      const updatedPillsMap = new Map(pills.map(pill => [pill.id, pill]));
      
      // Update each item with new data while keeping the current order
      return prevItems.map(item => updatedPillsMap.get(item.id) || item);
    });
  }, [pills]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);

    // Determine if this was a flick-to-cycle or just a snap back
    const didCycle = info.offset.y < -80 || info.velocity.y < -500;

    if (didCycle) {
      // stronger vibration for an actual cycle
      vibrate([40, 20, 40]);

      // Move the top card to the back
      setItems(prev => {
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    } else {
      // soft tap/vibration indicating snap back
      vibrate(10);
    }
  };

  const handleTap = (pill: Pill) => {
    if (pill.onClick && !isDragging) {
      // medium vibration for actionable tap/modal open
      vibrate([20, 10]);
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
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.8}
              dragMomentum={false}
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
