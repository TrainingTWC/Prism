/**
 * AUDIT DASHBOARD MAIN COMPONENT
 * 
 * Main container component that handles routing between different views
 * based on the current view state and renders breadcrumbs.
 */

import React from 'react';
import { useCurrentView, useBreadcrumbs, useNavigate } from './state';
import Dashboard from './views/Dashboard';

// Placeholder components for other views
const RegionView: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Region View</h1>
    <p>Region drill-down view - to be implemented</p>
  </div>
);

const TrainerView: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Trainer View</h1>
    <p>Trainer performance view - to be implemented</p>
  </div>
);

const SectionView: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Section View</h1>
    <p>Section breakdown view - to be implemented</p>
  </div>
);

const DistributionView: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Distribution View</h1>
    <p>Score distribution view - to be implemented</p>
  </div>
);

const StoreView: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Store View</h1>
    <p>Store audit details view - to be implemented</p>
  </div>
);

const QuestionView: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Question View</h1>
    <p>Question evidence view - to be implemented</p>
  </div>
);

const HealthView: React.FC = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Health View</h1>
    <p>Store health cards view - to be implemented</p>
  </div>
);

const AuditDashboard: React.FC = () => {
  const currentView = useCurrentView();
  const breadcrumbs = useBreadcrumbs();
  const navigate = useNavigate();

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard />;
      case 'REGION':
        return <RegionView />;
      case 'TRAINER':
        return <TrainerView />;
      case 'SECTION':
        return <SectionView />;
      case 'DISTRIBUTION':
        return <DistributionView />;
      case 'STORE':
        return <StoreView />;
      case 'QUESTION':
        return <QuestionView />;
      case 'HEALTH':
        return <HealthView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <div className="bg-white border-b px-6 py-3">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              {breadcrumbs.map((crumb, index) => (
                <li key={index}>
                  <div className="flex items-center">
                    {index > 0 && (
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-gray-300 mr-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                      </svg>
                    )}
                    {index < breadcrumbs.length - 1 ? (
                      <button
                        onClick={() => navigate(crumb.view, crumb.params)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-gray-500">
                        {crumb.label}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        {renderView()}
      </div>
    </div>
  );
};

export default AuditDashboard;