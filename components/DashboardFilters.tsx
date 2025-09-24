
import React, { useState, useMemo } from 'react';
import { Store, AreaManager, HRPerson } from '../types';

interface DashboardFiltersProps {
  regions: string[];
  stores: Store[];
  areaManagers: AreaManager[];
  hrPersonnel: HRPerson[];
  filters: {
    region: string;
    store: string;
    am: string;
    hr: string;
  };
  onFilterChange: (filterName: 'region' | 'store' | 'am' | 'hr', value: string) => void;
  onReset: () => void;
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
      <label htmlFor={label} className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
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
          className={`w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md text-gray-900 dark:text-slate-200 ${
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
    <label htmlFor={label} className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">{label}</label>
    <select
      id={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
  filters,
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Region - Keep as simple select since usually limited options */}
        <FilterSelect
          label="Region"
          value={filters.region}
          onChange={(e) => onFilterChange('region', e.target.value)}
          placeholder="All Regions"
          options={regions.map(r => ({ value: r, label: r }))}
        />
        
        {/* Area Manager - Searchable (filtered by HR) */}
        <SearchableFilter
          label="Area Manager"
          value={filters.am}
          onChange={(value) => onFilterChange('am', value)}
          placeholder={filters.hr ? "All AMs under selected HR" : "All AMs"}
          options={areaManagers.map(am => ({ value: am.id, label: am.name, id: am.id }))}
          disabled={areaManagers.length === 0}
        />
        
        {/* Store - Searchable (filtered by AM or HR) */}
        <SearchableFilter
          label="Store"
          value={filters.store}
          onChange={(value) => onFilterChange('store', value)}
          placeholder={
            filters.am ? "All stores under selected AM" :
            filters.hr ? "All stores under selected HR" :
            "All Stores"
          }
          options={stores.map(s => ({ value: s.id, label: s.name, id: s.id }))}
          disabled={stores.length === 0}
        />
        
        {/* HR Personnel - Searchable */}
        <SearchableFilter
          label="HR Personnel"
          value={filters.hr}
          onChange={(value) => onFilterChange('hr', value)}
          placeholder="All HR"
          options={hrPersonnel.map(hr => ({ value: hr.id, label: hr.name, id: hr.id }))}
          disabled={hrPersonnel.length === 0}
        />
        
        {/* Reset Button */}
        <div className="pt-6">
          <button
            onClick={onReset}
            className="w-full bg-gray-500 dark:bg-slate-600 hover:bg-gray-600 dark:hover:bg-slate-500 text-white dark:text-slate-100 font-semibold py-2 px-4 rounded-md transition-colors duration-200 h-[42px]"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardFilters;
