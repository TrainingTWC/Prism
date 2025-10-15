import React, { createContext, useContext, useState, useEffect } from 'react';

interface TourContextType {
  isTourActive: boolean;
  startTour: () => void;
  completeTour: () => void;
  skipTour: () => void;
  shouldShowTour: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    // Check if user has completed the tour before
    const tourCompleted = localStorage.getItem('prism-tour-completed');
    if (!tourCompleted) {
      setShouldShowTour(true);
    }
  }, []);

  const startTour = () => {
    setIsTourActive(true);
  };

  const completeTour = () => {
    setIsTourActive(false);
    localStorage.setItem('prism-tour-completed', 'true');
    setShouldShowTour(false);
  };

  const skipTour = () => {
    setIsTourActive(false);
    localStorage.setItem('prism-tour-completed', 'true');
    setShouldShowTour(false);
  };

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        startTour,
        completeTour,
        skipTour,
        shouldShowTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
