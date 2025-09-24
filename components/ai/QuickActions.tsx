import React from 'react';

interface QuickActionsProps {
  actions: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: string;
    timeToComplete: string;
  }>;
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 hover:bg-red-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  // Mock actions if empty
  const mockActions = actions.length > 0 ? actions : [
    {
      id: '1',
      title: 'Schedule Manager Training',
      description: 'Train managers on feedback delivery',
      priority: 'high' as const,
      estimatedImpact: 'High',
      timeToComplete: '2 weeks'
    },
    {
      id: '2', 
      title: 'Review Peak Hours',
      description: 'Analyze high-pressure periods',
      priority: 'medium' as const,
      estimatedImpact: 'Medium',
      timeToComplete: '1 week'
    },
    {
      id: '3',
      title: 'System Health Check',
      description: 'Audit app performance issues',
      priority: 'high' as const,
      estimatedImpact: 'High',
      timeToComplete: '3 days'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
          ⚡ Quick Actions
        </h3>
        <span className="text-xs text-gray-500 dark:text-slate-400">
          Immediate fixes
        </span>
      </div>

      <div className="space-y-3">
        {mockActions.map((action) => (
          <div
            key={action.id}
            className="group relative overflow-hidden bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border border-gray-200 dark:border-slate-600 hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {action.title}
              </h4>
              <button className={`px-2 py-1 text-xs text-white rounded-full ${getPriorityColor(action.priority)} transition-colors`}>
                {action.priority.toUpperCase()}
              </button>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">
              {action.description}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-500">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <span>💪</span>
                  <span>{action.estimatedImpact}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>⏱️</span>
                  <span>{action.timeToComplete}</span>
                </span>
              </div>
              <button className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                Take Action →
              </button>
            </div>
            
            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ))}
      </div>

      <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
        View All Actions
      </button>
    </div>
  );
};

export default QuickActions;