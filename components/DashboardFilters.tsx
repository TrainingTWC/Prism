
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
  employeeDirectory?: any; // Employee directory for SHLP employee filter
  vendorNames?: string[]; // Vendor names for Vendor Audit filter
  cities?: string[]; // Cities for Vendor Audit filter
  filters: {
    region: string[];
    store: string[];
    am: string[];
    trainer: string[];
    hrPerson: string[]; // Separate filter for HR personnel
    employee?: string; // Employee filter for SHLP dashboard
    // store health filter - '', 'Needs Attention', 'Brewing', 'Perfect Shot'
    health?: string;
    dateFrom?: string; // Date range start (YYYY-MM-DD)
    dateTo?: string;   // Date range end (YYYY-MM-DD)
    vendorName?: string; // Vendor name filter for Vendor Audit
    city?: string;       // City filter for Vendor Audit
  };
  onFilterChange: (filterName: 'region' | 'store' | 'am' | 'trainer' | 'hrPerson' | 'health' | 'dateFrom' | 'dateTo' | 'employee' | 'vendorName' | 'city', value: string) => void;
  onReset: () => void;
  onDownload?: () => void;
  onDownloadExcel?: () => void;
  onDownloadSHLPExcel?: () => void;
  onDownloadStoreHealthCard?: () => void;
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

// Legacy FilterSelect for non-searchable dropdowns (like Store Health)
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

// Multi-select filter with checkbox dropdown and chip display
const MultiSelectFilter: React.FC<{
  label: string;
  values: string[];
  onChange: (value: string) => void; // '' = clear all, otherwise toggle
  options: { value: string; label: string; id?: string }[];
  placeholder: string;
  disabled?: boolean;
}> = ({ label, values, onChange, options, placeholder, disabled = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.id && opt.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [options, searchTerm]);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref}>
      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
        {label}
        {values.length > 0 && (
          <span className="text-xs text-sky-600 dark:text-sky-400 ml-1">({values.length} selected)</span>
        )}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setShowDropdown(v => !v)}
          className={`w-full min-h-[42px] text-left px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 ${
            disabled
              ? 'bg-gray-100 dark:bg-slate-600 cursor-not-allowed opacity-50'
              : 'bg-white dark:bg-slate-700 cursor-pointer'
          }`}
        >
          {values.length === 0 ? (
            <span className="text-gray-400 dark:text-slate-400">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1 pr-6">
              {values.map(v => {
                const opt = options.find(o => o.value === v);
                return (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 rounded text-xs"
                  >
                    {opt ? opt.label : v}
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove ${opt ? opt.label : v}`}
                      className="cursor-pointer hover:text-sky-900 dark:hover:text-sky-100 font-bold"
                      onMouseDown={(e) => { e.stopPropagation(); onChange(v); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onChange(v); } }}
                    >
                      ×
                    </span>
                  </span>
                );
              })}
            </div>
          )}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
        </button>

        {showDropdown && !disabled && (
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-64 overflow-y-auto">
            <div className="p-2 border-b border-gray-100 dark:border-slate-600 sticky top-0 bg-white dark:bg-slate-700 z-10">
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div
              className="p-3 cursor-pointer border-b border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
              onMouseDown={() => { onChange(''); setSearchTerm(''); setShowDropdown(false); }}
            >
              <span className="text-sm text-gray-500 dark:text-slate-400 font-medium">{placeholder}</span>
            </div>
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-400 dark:text-slate-500">No matching options</div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = values.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={`p-3 cursor-pointer border-b border-gray-100 dark:border-slate-600 last:border-b-0 flex items-center gap-2 ${
                      isSelected ? 'bg-sky-50 dark:bg-sky-900/30' : 'hover:bg-gray-50 dark:hover:bg-slate-600'
                    }`}
                    onMouseDown={() => onChange(option.value)}
                  >
                    <input type="checkbox" readOnly checked={isSelected} className="accent-sky-500 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{option.label}</div>
                      {option.id && option.id !== option.value && (
                        <div className="text-xs text-gray-500 dark:text-slate-400">{option.id}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  regions,
  stores,
  areaManagers,
  hrPersonnel,
  trainers,
  employeeDirectory,
  vendorNames = [],
  cities = [],
  filters,
  onFilterChange,
  onReset,
  onDownload,
  onDownloadExcel,
  onDownloadSHLPExcel,
  onDownloadStoreHealthCard,
  isGenerating = false,
  dashboardType = 'training', // Default to training for backward compatibility
}) => {
  // Mobile drawer state
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  // trainers prop contains the actual trainers for Training dashboards
  // hrPersonnel contains HR/HRBP personnel for HR dashboards
  const effectiveTrainers = trainers || [];
  const effectiveHRPersonnel = hrPersonnel || [];

  const handleRefresh = (e?: React.KeyboardEvent | React.MouseEvent) => {
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
          <MultiSelectFilter
            label="Region"
            values={filters.region}
            onChange={(value) => onFilterChange('region', value)}
            placeholder="All Regions"
            options={regions.map(r => ({ value: r, label: r }))}
          />

          {/* Store Health - hidden for audit dashboards */}
          {dashboardType !== 'vendor-audit' && dashboardType !== 'vehicle-audit' && dashboardType !== 'cf-audit' && (
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
          )}

          <MultiSelectFilter
            label={dashboardType === 'vendor-audit' || dashboardType === 'vehicle-audit' || dashboardType === 'cf-audit' ? 'Auditor' : 'Area Manager'}
            values={filters.am}
            onChange={(value) => onFilterChange('am', value)}
            placeholder={filters.trainer.length > 0 ? "All AMs under selected Trainer" : (dashboardType === 'vendor-audit' || dashboardType === 'vehicle-audit' || dashboardType === 'cf-audit' ? "All Auditors" : "All AMs")}
            options={areaManagers.map(am => ({ value: am.id, label: am.name, id: am.id }))}
            disabled={areaManagers.length === 0}
          />

          {/* Store filter - hidden for audit dashboards */}
          {dashboardType !== 'vendor-audit' && dashboardType !== 'vehicle-audit' && dashboardType !== 'cf-audit' && (
            <MultiSelectFilter
              label="Store"
              values={filters.store}
              onChange={(value) => onFilterChange('store', value)}
              placeholder={
                filters.am.length > 0 ? "All stores under selected AM" :
                filters.trainer.length > 0 ? "All stores under selected Trainer" :
                "All Stores"
              }
              options={stores.map(s => ({ value: s.id, label: s.name, id: s.id }))}
              disabled={stores.length === 0}
            />
          )}

          {/* Vendor Name filter - Only show for vendor-audit */}
          {dashboardType === 'vendor-audit' && vendorNames.length > 0 && (
            <SearchableFilter
              label="Vendor Name"
              value={filters.vendorName || ''}
              onChange={(value) => onFilterChange('vendorName', value)}
              placeholder="All Vendors"
              options={vendorNames.map(v => ({ value: v, label: v }))}
            />
          )}

          {/* City filter - Only show for vendor-audit */}
          {dashboardType === 'vendor-audit' && cities.length > 0 && (
            <SearchableFilter
              label="City"
              value={filters.city || ''}
              onChange={(value) => onFilterChange('city', value)}
              placeholder="All Cities"
              options={cities.map(c => ({ value: c, label: c }))}
            />
          )}

          {/* Trainer Filter - Only show on non-HR, non-audit dashboards */}
          {dashboardType !== 'hr' && dashboardType !== 'vendor-audit' && dashboardType !== 'vehicle-audit' && dashboardType !== 'cf-audit' && effectiveTrainers.length > 0 && (
            <MultiSelectFilter
              label="Trainer"
              values={filters.trainer}
              onChange={(value) => onFilterChange('trainer', value)}
              placeholder="All Trainers"
              options={effectiveTrainers.map(t => ({ value: t.id, label: t.name, id: t.id }))}
              disabled={effectiveTrainers.length === 0}
            />
          )}

          {/* Employee Filter - Only show on SHLP dashboard */}
          {dashboardType === 'shlp' && employeeDirectory?.byId && (
            <SearchableFilter
              label="Employee"
              value={filters.employee || ''}
              onChange={(value) => onFilterChange('employee', value)}
              placeholder="All Employees"
              options={Object.values(employeeDirectory.byId)
                .sort((a: any, b: any) => (a.empname || '').localeCompare(b.empname || ''))
                .map((emp: any) => ({ 
                  value: emp.employee_code, 
                  label: `${emp.empname} (${emp.employee_code})`,
                  id: emp.employee_code 
                }))}
            />
          )}

          {/* HR Filter - Only show on HR dashboard */}
          {dashboardType === 'hr' && effectiveHRPersonnel.length > 0 && (
            <MultiSelectFilter
              label="HR"
              values={filters.hrPerson}
              onChange={(value) => onFilterChange('hrPerson', value)}
              placeholder="All HRs"
              options={effectiveHRPersonnel.map(h => ({ value: h.id, label: h.name, id: h.id }))}
              disabled={effectiveHRPersonnel.length === 0}
            />
          )}

          {/* Date Range Filter - Show on HR, Training, and audit dashboards */}
          {(dashboardType === 'hr' || dashboardType === 'training' || dashboardType === 'vendor-audit' || dashboardType === 'vehicle-audit' || dashboardType === 'cf-audit') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Date Range
              </label>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">From</label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">To</label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => onFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
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
          {/* Region */}
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <MultiSelectFilter
              label="Region"
              values={filters.region}
              onChange={(value) => onFilterChange('region', value)}
              placeholder="All Regions"
              options={regions.map(r => ({ value: r, label: r }))}
            />
          </div>
          
          {/* Store Health - hidden for audit dashboards */}
          {dashboardType !== 'vendor-audit' && dashboardType !== 'vehicle-audit' && dashboardType !== 'cf-audit' && (
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
          )}
          
          {/* Area Manager / Auditor */}
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
            <MultiSelectFilter
              label={dashboardType === 'vendor-audit' || dashboardType === 'vehicle-audit' || dashboardType === 'cf-audit' ? 'Auditor' : 'Area Manager'}
              values={filters.am}
              onChange={(value) => onFilterChange('am', value)}
              placeholder={filters.trainer.length > 0 ? "All AMs under selected Trainer" : (dashboardType === 'vendor-audit' || dashboardType === 'vehicle-audit' || dashboardType === 'cf-audit' ? "All Auditors" : "All AMs")}
              options={areaManagers.map(am => ({ value: am.id, label: am.name, id: am.id }))}
              disabled={areaManagers.length === 0}
            />
          </div>
          
          {/* Store - hidden for audit dashboards */}
          {dashboardType !== 'vendor-audit' && dashboardType !== 'vehicle-audit' && dashboardType !== 'cf-audit' && (
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <MultiSelectFilter
                label="Store"
                values={filters.store}
                onChange={(value) => onFilterChange('store', value)}
                placeholder={
                  filters.am.length > 0 ? "All stores under selected AM" :
                  filters.trainer.length > 0 ? "All stores under selected Trainer" :
                  "All Stores"
                }
                options={stores.map(s => ({ value: s.id, label: s.name, id: s.id }))}
                disabled={stores.length === 0}
              />
            </div>
          )}

          {/* Vendor Name - Only show for vendor-audit */}
          {dashboardType === 'vendor-audit' && vendorNames.length > 0 && (
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <SearchableFilter
                label="Vendor Name"
                value={filters.vendorName || ''}
                onChange={(value) => onFilterChange('vendorName', value)}
                placeholder="All Vendors"
                options={vendorNames.map(v => ({ value: v, label: v }))}
              />
            </div>
          )}

          {/* City - Only show for vendor-audit */}
          {dashboardType === 'vendor-audit' && cities.length > 0 && (
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <SearchableFilter
                label="City"
                value={filters.city || ''}
                onChange={(value) => onFilterChange('city', value)}
                placeholder="All Cities"
                options={cities.map(c => ({ value: c, label: c }))}
              />
            </div>
          )}
          
          {/* Trainer Filter - Only show on non-HR, non-audit dashboards */}
          {dashboardType !== 'hr' && dashboardType !== 'vendor-audit' && dashboardType !== 'vehicle-audit' && dashboardType !== 'cf-audit' && effectiveTrainers.length > 0 && (
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <MultiSelectFilter
                label="Trainer"
                values={filters.trainer}
                onChange={(value) => onFilterChange('trainer', value)}
                placeholder="All Trainers"
                options={effectiveTrainers.map(t => ({ value: t.id, label: t.name, id: t.id }))}
                disabled={effectiveTrainers.length === 0}
              />
            </div>
          )}
          {/* Employee - Show on SHLP dashboard, searchable */}
          {dashboardType === 'shlp' && employeeDirectory?.byId && (
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <SearchableFilter
                label="Employee"
                value={filters.employee || ''}
                onChange={(value) => onFilterChange('employee', value)}
                placeholder="All Employees"
                options={Object.values(employeeDirectory.byId)
                  .sort((a: any, b: any) => (a.empname || '').localeCompare(b.empname || ''))
                  .map((emp: any) => ({ 
                    value: emp.employee_code, 
                    label: `${emp.empname} (${emp.employee_code})`,
                    id: emp.employee_code 
                  }))}
              />
            </div>
          )}
          {/* HR Filter - Only show on HR dashboard */}
          {dashboardType === 'hr' && effectiveHRPersonnel.length > 0 && (
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <MultiSelectFilter
                label="HR"
                values={filters.hrPerson}
                onChange={(value) => onFilterChange('hrPerson', value)}
                placeholder="All HRs"
                options={effectiveHRPersonnel.map(h => ({ value: h.id, label: h.name, id: h.id }))}
                disabled={effectiveHRPersonnel.length === 0}
              />
            </div>
          )}

          {/* Date Range Filter - Show on HR, Training, and audit dashboards */}
          {(dashboardType === 'hr' || dashboardType === 'training' || dashboardType === 'vendor-audit' || dashboardType === 'vehicle-audit' || dashboardType === 'cf-audit') && (
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Date Range
              </label>
              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">From</label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">To</label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => onFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm"
                  />
                </div>
              </div>
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

          {/* Download SHLP Excel Button - Only show for SHLP dashboard */}
          {dashboardType === 'shlp' && onDownloadSHLPExcel && (
            <button
              onClick={() => { if (typeof onDownloadSHLPExcel === 'function') onDownloadSHLPExcel(); }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all duration-200 text-sm sm:text-base hover:shadow-lg flex items-center justify-center gap-2"
              aria-label="Download SHLP Excel report"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Excel
            </button>
          )}

          {/* Download Store Health Card Button - Only show for Training dashboard */}
          {dashboardType === 'training' && onDownloadStoreHealthCard && (
            <button
              onClick={() => { if (typeof onDownloadStoreHealthCard === 'function') onDownloadStoreHealthCard(); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-all duration-200 text-sm sm:text-base hover:shadow-lg flex items-center justify-center gap-2"
              aria-label="Download Store Health Card"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Store Health Card</span>
              <span className="sm:hidden">Health Card</span>
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

        {/* Excel Download Button for Mobile - Only show for SHLP dashboard */}
        {dashboardType === 'shlp' && onDownloadSHLPExcel && (
          <button
            onClick={() => { if (typeof onDownloadSHLPExcel === 'function') onDownloadSHLPExcel(); }}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-transform duration-150 transform hover:scale-105"
            aria-label="Download SHLP Excel report"
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
