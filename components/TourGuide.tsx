import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'none';
}

interface TourGuideProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const tourSteps: TourStep[] = [
  {
    target: '',
    title: '👋 Welcome to Prism Training Dashboard!',
    content: 'Let me show you around! This quick tour will help you understand how to fill checklists, use the dashboard, and download reports.',
    position: 'bottom',
  },
  {
    target: '[data-tour="checklist-tab"]',
    title: '📋 Training Checklist',
    content: 'Click here to access the training audit checklist. This is where you\'ll conduct store training audits.',
    position: 'bottom',
    action: 'click',
  },
  {
    target: '[data-tour="store-select"]',
    title: '🏪 Select Your Store',
    content: 'Start by selecting the store you want to audit from this dropdown. Choose carefully as this determines which audit you\'re completing.',
    position: 'bottom',
  },
  {
    target: '[data-tour="checklist-form"]',
    title: '✍️ Fill Out the Checklist',
    content: 'The checklist is organized into sections. Answer each question by selecting Yes/No or providing the required information. Red asterisks (*) indicate required fields.',
    position: 'right',
  },
  {
    target: '[data-tour="submit-button"]',
    title: '✅ Submit Your Audit',
    content: 'Once you\'ve completed all required fields, click Submit to save your training audit. Make sure all information is accurate before submitting!',
    position: 'top',
  },
  {
    target: '[data-tour="dashboard-tab"]',
    title: '📊 View Dashboard',
    content: 'After submitting, navigate to the Dashboard to view training performance analytics and insights across all stores.',
    position: 'bottom',
    action: 'click',
  },
  {
    target: '[data-tour="filters"]',
    title: '🔍 Filter Your Data',
    content: 'Use these filters to narrow down your view by region, store, area manager, or date range. This helps you focus on specific data you want to analyze.',
    position: 'bottom',
  },
  {
    target: '[data-tour="score-chart"]',
    title: '📈 Score Distribution',
    content: 'Click on any score range (like 90-100% or 60-69%) to see detailed information about stores in that performance bracket.',
    position: 'left',
    action: 'none',
  },
  {
    target: '[data-tour="region-chart"]',
    title: '🗺️ Regional Performance',
    content: 'Click on regions or trainers to drill down into specific performance data. The modal will show detailed breakdowns for your selection.',
    position: 'top',
  },
  {
    target: '[data-tour="download-button"]',
    title: '📥 Download Reports',
    content: 'Click here to download a comprehensive PDF report with all training audit data, charts, and insights. Perfect for sharing with management!',
    position: 'left',
  },
  {
    target: '',
    title: '🎉 You\'re All Set!',
    content: 'That\'s it! You now know how to use the Prism Training Dashboard. Remember: Fill checklists → View insights → Download reports. If you need to see this tour again, look for the "Help" or "Tour" button.',
    position: 'bottom',
  },
];

const TourGuide: React.FC<TourGuideProps> = ({ isActive, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive) return;

    const step = tourSteps[currentStep];
    if (!step.target) {
      // Center screen for welcome/completion steps
      setTargetElement(null);
      return;
    }

    const findElement = () => {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        updateTooltipPosition(element, step.position || 'bottom');
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight the element
        element.style.position = 'relative';
        element.style.zIndex = '10001';
      } else {
        // Element not found, try again after a short delay
        setTimeout(findElement, 500);
      }
    };

    findElement();
  }, [currentStep, isActive]);

  const updateTooltipPosition = (element: HTMLElement, position: string) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 350;
    const tooltipHeight = 200;
    const offset = 20;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - offset;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + offset;
        break;
    }

    // Keep tooltip within viewport
    top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));
    left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));

    setTooltipPosition({ top, left });
  };

  const handleNext = () => {
    const step = tourSteps[currentStep];
    
    if (step.action === 'click' && targetElement) {
      // Trigger click on the target element
      targetElement.click();
      
      // Wait for navigation/render
      setTimeout(() => {
        if (currentStep < tourSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          onComplete();
        }
      }, 300);
    } else {
      if (currentStep < tourSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Clean up any highlighted elements
    if (targetElement) {
      targetElement.style.zIndex = '';
    }
    onSkip();
  };

  if (!isActive) return null;

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  // Center screen overlay for welcome/completion steps
  if (!step.target) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000]">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="text-5xl mb-4">
              {currentStep === 0 ? '👋' : '🎉'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {step.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              Step {currentStep + 1} of {tourSteps.length}
            </div>
          </div>

          <div className="flex justify-between items-center gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Skip Tour
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors flex items-center gap-2 font-medium"
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    Finish <CheckCircle className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    {step.action === 'click' ? 'Click & Continue' : 'Next'} <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tooltip with spotlight for specific elements
  return (
    <>
      {/* Dark overlay with spotlight */}
      <div className="fixed inset-0 z-[10000] pointer-events-none">
        <div className="absolute inset-0 bg-black opacity-70" />
        {targetElement && (
          <div
            className="absolute border-4 border-blue-500 rounded-lg shadow-2xl"
            style={{
              top: targetElement.getBoundingClientRect().top - 4,
              left: targetElement.getBoundingClientRect().left - 4,
              width: targetElement.getBoundingClientRect().width + 8,
              height: targetElement.getBoundingClientRect().height + 8,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(59, 130, 246, 0.5)',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[10001] bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm pointer-events-auto"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 pr-6">
          {step.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
          {step.content}
        </p>

        {/* Progress */}
        <div className="mb-4">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {currentStep + 1} / {tourSteps.length}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 text-sm"
              >
                <ChevronLeft className="w-3 h-3" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors flex items-center gap-1 text-sm font-medium"
            >
              {step.action === 'click' ? 'Click & Go' : 'Next'} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TourGuide;
