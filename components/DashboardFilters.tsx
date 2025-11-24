
import React, { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Store, AreaManager, HRPerson } from '../types';

interface DashboardFiltersProps {
  regions: string[];
  stores: Store[];
  areaManagers: AreaManager[];
  // Legacy HR personnel list (kept for fallback). Prefer `trainers` for authoritative trainer list.
  hrPersonnel: HRPerson[];
  trainers?: { id: string; name: string }[];
  filters: {
    region: string;
    store: string;
    am: string;
    trainer: string;
    hrPerson: string; // Separate filter for HR personnel
    // store health filter - '', 'Needs Attention', 'Brewing', 'Perfect Shot'
    health?: string;
  };
  onFilterChange: (filterName: 'region' | 'store' | 'am' | 'trainer' | 'hrPerson' | 'health', value: string) => void;
  onReset: () => void;
  onDownload?: () => void;
  onDownloadExcel?: () => void;
  isGenerating?: boolean;
  dashboardType?: string; // Add dashboard type to customize labels
}

// Searchable Filter Component
const SearchableFilter: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; id?: string }[];
  placeholder: string;
  disabled?: boolean;
  showClear?: boolean;
}> = ({ label, value, onChange, options, placeholder, disabled = false, showClear = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Find current selection for display
  const currentSelection = options.find(opt => opt.value === value);
  const displayValue = currentSelection ? currentSelection.label : '';

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.id && opt.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [options, searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selected = filteredOptions[selectedIndex];
      onChange(selected.value);
      setSearchTerm('');
      setShowDropdown(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div>
      <label htmlFor={label} className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
        {label}
        {filteredOptions.length < options.length && !disabled && (
          <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">
            ({filteredOptions.length} of {options.length})
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={label}
          className={`w-full pl-3 pr-10 py-2.5 text-sm sm:text-base border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 rounded-md text-gray-900 dark:text-slate-200 ${
            disabled 
              ? 'bg-gray-100 dark:bg-slate-600 cursor-not-allowed opacity-50' 
              : 'bg-white dark:bg-slate-700'
          }`}
          value={showDropdown ? searchTerm : displayValue}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => {
            if (!disabled) {
              setShowDropdown(true);
              setSearchTerm(displayValue);
              setSelectedIndex(-1);
            }
          }}
          onChange={e => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay hiding dropdown to allow selection
            setTimeout(() => {
              setShowDropdown(false);
              setSelectedIndex(-1);
            }, 200);
          }}
        />
        
        {/* Clear button */}
        {showClear && value && !showDropdown && !disabled && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => {
              onChange('');
              setSearchTerm('');
            }}
          >
            ✕
          </button>
        )}
        
        {/* Search icon */}
        {showDropdown && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        )}

        {/* Dropdown */}
        {showDropdown && !disabled && (
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* "All" option */}
            <div
              className={`p-3 cursor-pointer border-b border-gray-100 dark:border-slate-600 ${
                selectedIndex === -1 && !searchTerm
                  ? 'bg-sky-100 dark:bg-sky-900' 
                  : 'hover:bg-gray-100 dark:hover:bg-slate-600'
              }`}
              onMouseDown={() => {
                onChange('');
                setSearchTerm('');
                setShowDropdown(false);
                setSelectedIndex(-1);
              }}
              onMouseEnter={() => setSelectedIndex(-1)}
            >
              <div className="font-medium text-gray-900 dark:text-slate-100">{placeholder}</div>
            </div>
            
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-gray-500 dark:text-slate-400">No matching options found</div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={`p-3 cursor-pointer border-b border-gray-100 dark:border-slate-600 last:border-b-0 ${
                    index === selectedIndex 
                      ? 'bg-sky-100 dark:bg-sky-900' 
                      : 'hover:bg-gray-100 dark:hover:bg-slate-600'
                  }`}
                  onMouseDown={() => {
                    onChange(option.value);
                    setSearchTerm('');
                    setShowDropdown(false);
                    setSelectedIndex(-1);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="font-medium text-gray-900 dark:text-slate-100">{option.label}</div>
                  {option.id && option.id !== option.value && (
                    <div className="text-sm text-gray-500 dark:text-slate-400">{option.id}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Legacy FilterSelect for non-searchable dropdowns (like Region)
const FilterSelect: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}> = ({ label, value, onChange, options, placeholder, disabled = false }) => (
  <div>
    <label htmlFor={label} className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">{label}</label>
    <select
      id={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full pl-3 pr-10 py-2.5 text-sm sm:text-base border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  regions,
  stores,
  areaManagers,
  hrPersonnel,
  trainers,
  filters,
  onFilterChange,
  onReset,
  onDownload,
  onDownloadExcel,
  isGenerating = false,
  dashboardType = 'training', // Default to training for backward compatibility
}) => {
  // Mobile drawer state
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // Debug logging to understand what trainers data we're getting
  console.log('DashboardFilters - trainers prop:', trainers);
  console.log('DashboardFilters - trainers length:', trainers?.length || 0);
  console.log('DashboardFilters - hrPersonnel length:', hrPersonnel?.length || 0);
  console.log('DashboardFilters - dashboardType:', dashboardType);

  // trainers prop contains the actual trainers for Training dashboards
  // hrPersonnel contains HR/HRBP personnel for HR dashboards
  const effectiveTrainers = trainers || [];
  const effectiveHRPersonnel = hrPersonnel || [];
  
  console.log('DashboardFilters - received trainers prop:', trainers?.length || 0);
  console.log('DashboardFilters - effective trainers:', effectiveTrainers.slice(0, 3)); // Log first 3
  console.log('DashboardFilters - effective HR personnel:', effectiveHRPersonnel.slice(0, 3)); // Log first 3
  console.log('DashboardFilters - dashboardType:', dashboardType);
  console.log('DashboardFilters - will show trainer filter?', dashboardType !== 'hr' && effectiveTrainers.length > 0);

  const handleRefresh = (e?: React.KeyboardEvent | React.MouseEvent) => {
    // allow keyboard activation via Enter/Space
    /* eslint-disable-next-line no-console */
    console.log('Refresh requested');
    window.dispatchEvent(new CustomEvent('prism-refresh'));
  };

  const Drawer = () => (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => setShowMobileFilters(false)}
        aria-hidden
      />

      {/* Slide-over panel */}
      <div className="relative ml-auto w-full max-w-md bg-white dark:bg-slate-800 p-5 shadow-xl border-l border-gray-200 dark:border-slate-700 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onReset(); }}
              className="px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-sm rounded-md"
            >
              Reset
            </button>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="px-3 py-1.5 bg-sky-600 text-white text-sm rounded-md"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Stacked filters for mobile */}
          <FilterSelect
            label="Region"
            value={filters.region}
            onChange={(e) => onFilterChange('region', e.target.value)}
            placeholder="All Regions"
            options={regions.map(r => ({ value: r, label: r }))}
          />

          {/* Store Health - semantic filter */}
          <FilterSelect
            label="Store Health"
            value={filters.health || ''}
            onChange={(e) => onFilterChange('health', e.target.value)}
            placeholder="All Health"
            options={[
              { value: '', label: 'All Health' },
              { value: 'Needs Attention', label: 'Needs Attention' },
              { value: 'Brewing', label: 'Brewing' },
              { value: 'Perfect Shot', label: 'Perfect Shot' }
            ]}
          />

          <SearchableFilter
            label="Area Manager"
            value={filters.am}
            onChange={(value) => onFilterChange('am', value)}
            placeholder={filters.trainer ? "All AMs under selected Trainer" : "All AMs"}
            options={areaManagers.map(am => ({ value: am.id, label: am.name, id: am.id }))}
            disabled={areaManagers.length === 0}
          />

          <SearchableFilter
            label="Store"
            value={filters.store}
            onChange={(value) => onFilterChange('store', value)}
            placeholder={
              filters.am ? "All stores under selected AM" :
              filters.trainer ? "All stores under selected Trainer" :
              "All Stores"
            }
            options={stores.map(s => ({ value: s.id, label: s.name, id: s.id }))}
            disabled={stores.length === 0}
          />

          {/* Trainer Filter - Only show on non-HR dashboards */}
          {dashboardType !== 'hr' && effectiveTrainers.length > 0 && (
            <SearchableFilter
              label="Trainer"
              value={filters.trainer}
              onChange={(value) => onFilterChange('trainer', value)}
              placeholder="All Trainers"
              options={effectiveTrainers.map(t => ({ value: t.id, label: t.name, id: t.id }))}
              disabled={effectiveTrainers.length === 0}
            />
          )}

          {/* HR Filter - Only show on HR dashboard */}
          {dashboardType === 'hr' && effectiveHRPersonnel.length > 0 && (
            <SearchableFilter
              label="HR"
              value={filters.hrPerson}
              onChange={(value) => onFilterChange('hrPerson', value)}
              placeholder="All HRs"
              options={effectiveHRPersonnel.map(h => ({ value: h.id, label: h.name, id: h.id }))}
              disabled={effectiveHRPersonnel.length === 0}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      {/* Desktop/tablet inline filters */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 items-end">
          {/* Region - Keep as simple select since usually limited options */}
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <FilterSelect
              label="Region"
              value={filters.region}
              onChange={(e) => onFilterChange('region', e.target.value)}
              placeholder="All Regions"
              options={regions.map(r => ({ value: r, label: r }))}
            />
          </div>
          
          {/* Store Health */}
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <FilterSelect
              label="Store Health"
              value={filters.health || ''}
              onChange={(e) => onFilterChange('health', e.target.value)}
              placeholder="All Health"
              options={[
                { value: '', label: 'All Health' },
                { value: 'Needs Attention', label: 'Needs Attention' },
                { value: 'Brewing', label: 'Brewing' },
                { value: 'Perfect Shot', label: 'Perfect Shot' }
              ]}
            />
          </div>
          
          {/* Area Manager - Searchable (filtered by Trainer) */}
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <SearchableFilter
              label="Area Manager"
              value={filters.am}
              onChange={(value) => onFilterChange('am', value)}
              placeholder={filters.trainer ? "All AMs under selected Trainer" : "All AMs"}
              options={areaManagers.map(am => ({ value: am.id, label: am.name, id: am.id }))}
              disabled={areaManagers.length === 0}
            />
          </div>
          
          {/* Store - Searchable (filtered by AM or Trainer) */}
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <SearchableFilter
              label="Store"
              value={filters.store}
              onChange={(value) => onFilterChange('store', value)}
              placeholder={
                filters.am ? "All stores under selected AM" :
                filters.trainer ? "All stores under selected Trainer" :
                "All Stores"
              }
              options={stores.map(s => ({ value: s.id, label: s.name, id: s.id }))}
              disabled={stores.length === 0}
            />
          </div>
          
          {/* Trainer Filter - Only show on non-HR dashboards */}
          {dashboardType !== 'hr' && effectiveTrainers.length > 0 && (
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <SearchableFilter
                label="Trainer"
                value={filters.trainer}
                onChange={(value) => onFilterChange('trainer', value)}
                placeholder="All Trainers"
                options={effectiveTrainers.map(t => ({ value: t.id, label: t.name, id: t.id }))}
                disabled={effectiveTrainers.length === 0}
              />
            </div>
          )}

          {/* HR Filter - Only show on HR dashboard */}
          {dashboardType === 'hr' && effectiveHRPersonnel.length > 0 && (
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <SearchableFilter
                label="HR"
                value={filters.hrPerson}
                onChange={(value) => onFilterChange('hrPerson', value)}
                placeholder="All HRs"
                options={effectiveHRPersonnel.map(h => ({ value: h.id, label: h.name, id: h.id }))}
                disabled={effectiveHRPersonnel.length === 0}
              />
            </div>
          )}
        </div>
        
        {/* Action buttons row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4">
          {/* Reset Button */}
          <button
            onClick={onReset}
            className="bg-white dark:bg-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl transition-colors duration-200 text-sm sm:text-base border border-gray-200 dark:border-slate-700 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Reset Filters
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={(e) => handleRefresh(e as any)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleRefresh(e);
              }
            }}
            className="bg-white dark:bg-slate-800/50 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl transition-colors duration-200 text-sm sm:text-base border border-gray-200 dark:border-slate-700 flex items-center justify-center gap-2"
            aria-label="Refresh data"
          >
            <RefreshCw className="w-5 h-5" aria-hidden="true" />
            Refresh
          </button>
          
          {/* Download PDF Report Button */}
          <button
            onClick={() => { if (typeof onDownload === 'function') onDownload(); }}
            disabled={isGenerating}
            className={`${isGenerating ? 'opacity-80 pointer-events-none' : ''} btn-primary-gradient text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all duration-200 text-sm sm:text-base hover:shadow-lg flex items-center justify-center gap-2`}
            aria-label="Download PDF report"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download PDF
              </>
            )}
          </button>

          {/* Download Excel Button - Only show for HR dashboard */}
          {dashboardType === 'hr' && onDownloadExcel && (
            <button
              onClick={() => { if (typeof onDownloadExcel === 'function') onDownloadExcel(); }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all duration-200 text-sm sm:text-base hover:shadow-lg flex items-center justify-center gap-2"
              aria-label="Download Excel report"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Excel
            </button>
          )}
        </div>
      </div>

      {/* Mobile compact bar with Filters button and Download/report actions */}
      <div className="block md:hidden flex items-center justify-between gap-3">
        <button
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          onClick={() => setShowMobileFilters(true)}
          aria-label="Open filters"
          aria-expanded={showMobileFilters}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 icon-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M3 5a1 1 0 011-1h12a1 1 0 01.8 1.6l-4.6 6.13a1 1 0 00-.2.64V17a1 1 0 01-1 1H8a1 1 0 01-1-1v-3.63a1 1 0 00-.2-.64L2.2 5.6A1 1 0 013 5z" />
          </svg>
          <span className="text-sm font-medium">Filters</span>
        </button>

        <button
          onClick={() => { if (typeof onDownload === 'function') onDownload(); }}
          disabled={isGenerating}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-3 ${isGenerating ? 'opacity-80 pointer-events-none disabled:opacity-60' : ''} btn-primary-gradient text-white rounded-lg shadow-sm transition-transform duration-150 transform hover:scale-105`}
          aria-label="Download PDF report"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span className="text-sm">Generating</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V3zM3 9a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
              </svg>
              <span className="text-sm">PDF</span>
            </>
          )}
        </button>

        {/* Excel Download Button for Mobile - Only show for HR dashboard */}
        {dashboardType === 'hr' && onDownloadExcel && (
          <button
            onClick={() => { if (typeof onDownloadExcel === 'function') onDownloadExcel(); }}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-transform duration-150 transform hover:scale-105"
            aria-label="Download Excel report"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V3zM3 9a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
            </svg>
            <span className="text-sm">Excel</span>
          </button>
        )}

        <button
          onClick={(e) => handleRefresh(e as any)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleRefresh(e);
            }
          }}
          className="inline-flex items-center justify-center gap-2 py-3 px-3 bg-gray-100 dark:bg-slate-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Refresh data"
          title="Refresh data"
        >
          <RefreshCw className="w-5 h-5" aria-hidden="true" />
          <span className="sr-only">Refresh data</span>
        </button>
      </div>

      {/* Mobile drawer render */}
      {showMobileFilters && <Drawer />}
    </div>
  );
};

export default DashboardFilters;
