import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, Download, RefreshCw } from 'lucide-react';

interface CalendarEntry {
    timestamp: string;
    trainerId: string;
    trainerName: string;
    month: string;
    date: string;
    eventType: string;
    location: string;
    task: string;
    details: string;
    region?: string;
    storeName?: string;
}

const TrainerCalendarDashboard: React.FC = () => {
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<CalendarEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [selectedTrainer, setSelectedTrainer] = useState('');
    const [selectedStore, setSelectedStore] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Get EMPID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('EMPID');

    // Fetch data from Google Sheets
    const fetchCalendarData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const scriptUrl = import.meta.env.VITE_TRAINER_CALENDAR_SCRIPT_URL;
            if (!scriptUrl) {
                throw new Error('Calendar script URL not configured');
            }

            // Append action parameter to fetch data
            const url = `${scriptUrl}?action=fetch`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status === 'success' && data.data) {
                setEntries(data.data);
                setFilteredEntries(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch calendar data');
            }
        } catch (err) {
            console.error('Error fetching calendar data:', err);
            setError(err instanceof Error ? err.message : 'Failed to load calendar data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendarData();
    }, []);

    // Extract unique values for filters
    const trainers = Array.from(new Set(entries.map(e => e.trainerName))).sort();
    const stores = Array.from(new Set(entries.map(e => e.storeName || e.location).filter(Boolean))).sort();
    const regions = Array.from(new Set(entries.map(e => e.region).filter(Boolean))).sort();
    const months = Array.from(new Set(entries.map(e => {
        const match = e.month?.match(/^(\w+)/);
        return match ? match[1] : '';
    }).filter(Boolean))).sort((a, b) => {
        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return monthOrder.indexOf(a) - monthOrder.indexOf(b);
    });
    const years = Array.from(new Set(entries.map(e => {
        const match = e.month?.match(/\d{4}$/);
        return match ? match[0] : '';
    }).filter(Boolean))).sort().reverse();

    // Apply filters
    useEffect(() => {
        let filtered = entries;

        if (selectedTrainer) {
            filtered = filtered.filter(e => e.trainerName === selectedTrainer);
        }

        if (selectedStore) {
            filtered = filtered.filter(e => 
                e.storeName === selectedStore || e.location === selectedStore
            );
        }

        if (selectedRegion) {
            filtered = filtered.filter(e => e.region === selectedRegion);
        }

        if (selectedMonth) {
            filtered = filtered.filter(e => e.month?.startsWith(selectedMonth));
        }

        if (selectedYear) {
            filtered = filtered.filter(e => e.month?.endsWith(selectedYear));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.trainerName?.toLowerCase().includes(query) ||
                e.location?.toLowerCase().includes(query) ||
                e.task?.toLowerCase().includes(query) ||
                e.details?.toLowerCase().includes(query) ||
                e.eventType?.toLowerCase().includes(query)
            );
        }

        setFilteredEntries(filtered);
    }, [selectedTrainer, selectedStore, selectedRegion, selectedMonth, selectedYear, searchQuery, entries]);

    const resetFilters = () => {
        setSelectedTrainer('');
        setSelectedStore('');
        setSelectedRegion('');
        setSelectedMonth('');
        setSelectedYear('');
        setSearchQuery('');
    };

    const exportToCSV = () => {
        if (filteredEntries.length === 0) return;

        const headers = ['Timestamp', 'Trainer ID', 'Trainer Name', 'Month', 'Date', 'Event Type', 'Location', 'Task', 'Details', 'Region'];
        const rows = filteredEntries.map(e => [
            e.timestamp,
            e.trainerId,
            e.trainerName,
            e.month,
            e.date,
            e.eventType,
            e.location,
            e.task,
            e.details,
            e.region || ''
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trainer-calendar-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    // Group entries by date for better display
    const groupedEntries = filteredEntries.reduce((acc, entry) => {
        const date = entry.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(entry);
        return acc;
    }, {} as Record<string, CalendarEntry[]>);

    const sortedDates = Object.keys(groupedEntries).sort((a, b) => {
        return new Date(b).getTime() - new Date(a).getTime();
    });

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="text-purple-500 dark:text-purple-400" size={32} />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                Trainer Calendar Dashboard
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                View and filter trainer calendar submissions
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchCalendarData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-gray-600 dark:text-slate-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Filters</h2>
                    </div>
                    <button
                        onClick={resetFilters}
                        className="text-sm text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                        Reset All
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Search */}
                    <div className="xl:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search trainer, location, task..."
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Trainer */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Trainer
                        </label>
                        <select
                            value={selectedTrainer}
                            onChange={(e) => setSelectedTrainer(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                        >
                            <option value="">All Trainers</option>
                            {trainers.map(trainer => (
                                <option key={trainer} value={trainer}>{trainer}</option>
                            ))}
                        </select>
                    </div>

                    {/* Region */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Region
                        </label>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                        >
                            <option value="">All Regions</option>
                            {regions.map(region => (
                                <option key={region} value={region}>{region}</option>
                            ))}
                        </select>
                    </div>

                    {/* Store */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Store/Location
                        </label>
                        <select
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                        >
                            <option value="">All Locations</option>
                            {stores.map(store => (
                                <option key={store} value={store}>{store}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Month
                        </label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                        >
                            <option value="">All Months</option>
                            {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Year
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white"
                        >
                            <option value="">All Years</option>
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Results Count & Export */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                        Showing <span className="font-semibold text-gray-800 dark:text-white">{filteredEntries.length}</span> of <span className="font-semibold">{entries.length}</span> entries
                    </p>
                    <button
                        onClick={exportToCSV}
                        disabled={filteredEntries.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <RefreshCw className="animate-spin mx-auto mb-4 text-purple-500" size={40} />
                        <p className="text-gray-600 dark:text-slate-400">Loading calendar data...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error Loading Data</p>
                    <p className="text-red-500 dark:text-red-300 text-sm">{error}</p>
                    <button
                        onClick={fetchCalendarData}
                        className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : filteredEntries.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center">
                    <Calendar className="mx-auto mb-4 text-gray-300 dark:text-slate-600" size={64} />
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-slate-400 mb-2">
                        No Calendar Entries Found
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-500">
                        {entries.length === 0 
                            ? 'No calendar submissions have been made yet.'
                            : 'Try adjusting your filters to see more results.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedDates.map(date => (
                        <div key={date} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3">
                                <h3 className="text-white font-semibold">
                                    {new Date(date).toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </h3>
                            </div>
                            <div className="divide-y divide-gray-200 dark:divide-slate-700">
                                {groupedEntries[date].map((entry, index) => (
                                    <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                                                    {entry.trainerName}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                                    ID: {entry.trainerId} • {entry.month}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                entry.eventType === 'store' 
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                                    : entry.eventType === 'campus'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                            }`}>
                                                {entry.eventType}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-3">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase mb-1">Location</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">{entry.location}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase mb-1">Task</p>
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">{entry.task || 'N/A'}</p>
                                            </div>
                                            {entry.region && (
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 uppercase mb-1">Region</p>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-white">{entry.region}</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {entry.details && (
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 uppercase mb-1">Details</p>
                                                <p className="text-sm text-gray-700 dark:text-slate-300">{entry.details}</p>
                                            </div>
                                        )}
                                        
                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
                                            Submitted: {new Date(entry.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrainerCalendarDashboard;
