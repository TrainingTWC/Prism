import React, { useState } from 'react';

interface InsightsCarouselProps {
  insights: Array<{
    id: string;
    title: string;
    description: string;
    metric: string;
    value: string | number;
    trend: 'up' | 'down' | 'stable';
    category: string;
    actionable: boolean;
    context: string;
  }>;
}

const InsightsCarousel: React.FC<InsightsCarouselProps> = ({ insights = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const safeInsights = Array.isArray(insights) ? insights : [];
  
  // Mock data if empty
  const mockInsights = safeInsights.length > 0 ? safeInsights : [
    {
      id: '1',
      title: 'Communication Gap Alert',
      description: 'Managers score significantly higher than direct reports on receiving feedback frequency',
      metric: 'Feedback Gap',
      value: '2.3 points',
      trend: 'down' as const,
      category: 'communication',
      actionable: true,
      context: 'This suggests managers think they provide feedback more often than employees perceive'
    },
    {
      id: '2',
      title: 'System Reliability Crisis',
      description: 'Zing, Jify, and Meal Benefit systems show consistent failure patterns affecting productivity',
      metric: 'System Reliability',
      value: '34%',
      trend: 'down' as const,
      category: 'operational',
      actionable: true,
      context: 'Multiple apps failing simultaneously indicates infrastructure issues'
    },
    {
      id: '3',
      title: 'Training Effectiveness Concern',
      description: 'New employee training completion rates vary significantly across departments',
      metric: 'Training Variance',
      value: '45%',
      trend: 'stable' as const,
      category: 'training',
      actionable: true,
      context: 'Some departments complete training 45% faster than others'
    },
    {
      id: '4',
      title: 'Recognition Pattern',
      description: 'Employees who receive regular recognition show 3x better satisfaction scores',
      metric: 'Recognition Impact',
      value: '+185%',
      trend: 'up' as const,
      category: 'satisfaction',
      actionable: true,
      context: 'Strong correlation between recognition frequency and overall satisfaction'
    },
    {
      id: '5',
      title: 'Cross-Department Insight',
      description: 'Teams with inter-departmental collaboration report higher innovation scores',
      metric: 'Collaboration Effect',
      value: '+67%',
      trend: 'up' as const,
      category: 'operational',
      actionable: false,
      context: 'Cross-functional teams consistently outperform isolated teams'
    }
  ];

  const nextInsight = () => {
    setCurrentIndex((prev) => (prev + 1) % mockInsights.length);
  };

  const prevInsight = () => {
    setCurrentIndex((prev) => (prev - 1 + mockInsights.length) % mockInsights.length);
  };

  const goToInsight = (index: number) => {
    setCurrentIndex(index);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return { icon: '📈', color: 'text-green-600 dark:text-green-400' };
      case 'down': return { icon: '📉', color: 'text-red-600 dark:text-red-400' };
      case 'stable': return { icon: '➡️', color: 'text-yellow-600 dark:text-yellow-400' };
      default: return { icon: '📊', color: 'text-gray-600 dark:text-gray-400' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication': return '💬';
      case 'operational': return '⚙️';
      case 'training': return '📚';
      case 'satisfaction': return '😊';
      case 'performance': return '🎯';
      default: return '💡';
    }
  };

  const getCurrentInsight = () => mockInsights[currentIndex];
  const insight = getCurrentInsight();
  const trendInfo = getTrendIcon(insight.trend);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
          🔮 AI Insights Carousel
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevInsight}
            className="p-2 rounded-full bg-white dark:bg-slate-600 shadow-md hover:shadow-lg transition-shadow text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100"
          >
            ←
          </button>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {currentIndex + 1} of {mockInsights.length}
          </span>
          <button
            onClick={nextInsight}
            className="p-2 rounded-full bg-white dark:bg-slate-600 shadow-md hover:shadow-lg transition-shadow text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100"
          >
            →
          </button>
        </div>
      </div>

      {/* Main insight card */}
      <div className="relative bg-white dark:bg-slate-700 rounded-lg p-6 shadow-md border border-gray-200 dark:border-slate-600 min-h-[200px]">
        {/* Category and actionable badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getCategoryIcon(insight.category)}</span>
            <span className="text-sm font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wide">
              {insight.category}
            </span>
          </div>
          {insight.actionable && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-bold rounded-full">
              ACTIONABLE
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
          {insight.title}
        </h4>

        {/* Description */}
        <p className="text-gray-600 dark:text-slate-400 mb-4 leading-relaxed">
          {insight.description}
        </p>

        {/* Metric display */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500 dark:text-slate-500">
              {insight.metric}
            </span>
            <span className={`text-2xl font-bold ${trendInfo.color}`}>
              {insight.value}
            </span>
            <span className={`text-xl ${trendInfo.color}`}>
              {trendInfo.icon}
            </span>
          </div>
        </div>

        {/* Context */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
          <div className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            💡 Context
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-400">
            {insight.context}
          </div>
        </div>

        {/* Auto-advance indicator */}
        <div className="absolute bottom-2 right-2">
          <div className="w-8 h-1 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-[5000ms] ease-linear"
              style={{
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                width: currentIndex === mockInsights.indexOf(insight) ? '100%' : '0%',
                animation: currentIndex === mockInsights.indexOf(insight) ? 'progress 5s linear infinite' : 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center space-x-2 mt-4">
        {mockInsights.map((_, index) => (
          <button
            key={index}
            onClick={() => goToInsight(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'scale-110'
                : 'bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500'
            }`}
            style={ index === currentIndex ? { background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' } : undefined }
          />
        ))}
      </div>

      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-green-100 dark:bg-green-900/30 rounded">
          <div className="text-xs text-green-800 dark:text-green-300 font-medium">Actionable</div>
          <div className="text-sm font-bold text-green-600 dark:text-green-400">
            {mockInsights.filter(i => i.actionable).length}
          </div>
        </div>
        <div className="text-center p-2 bg-red-100 dark:bg-red-900/30 rounded">
          <div className="text-xs text-red-800 dark:text-red-300 font-medium">Critical</div>
          <div className="text-sm font-bold text-red-600 dark:text-red-400">
            {mockInsights.filter(i => i.trend === 'down').length}
          </div>
        </div>
        <div className="text-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
          <div className="text-xs text-blue-800 dark:text-blue-300 font-medium">Positive</div>
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {mockInsights.filter(i => i.trend === 'up').length}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default InsightsCarousel;