import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Filter } from 'lucide-react';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedTrainer, setSelectedTrainer] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Fetch data from Google Sheets
    const fetchCalendarData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const scriptUrl = import.meta.env.VITE_TRAINER_CALENDAR_SCRIPT_URL;
            if (!scriptUrl) {
                throw new Error('Calendar script URL not configured');
            }

            const url = `${scriptUrl}?action=fetch`;
            
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.status}`);
            }

            const data = await response.json();
            
            console.log('Fetched data:', data);
            console.log('Number of entries:', data.data?.length);
            
            if (data.status === 'success' && data.data) {
                console.log('Setting entries:', data.data);
                setEntries(data.data);
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

    // Extract unique trainer names for filter
    const trainers = Array.from(new Set(entries.map(e => e.trainerName))).filter(Boolean).sort();

    // Debug logging
    useEffect(() => {
        console.log('=== CALENDAR DEBUG ===');
        console.log('Total entries:', entries.length);
        console.log('Selected trainer:', selectedTrainer);
        console.log('Current month:', currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
        
        if (entries.length > 0) {
            console.log('First 3 entries:', entries.slice(0, 3));
            console.log('All dates in entries:', [...new Set(entries.map(e => e.date))]);
            console.log('All trainer names:', [...new Set(entries.map(e => e.trainerName))]);
        } else {
            console.log('⚠️ No entries loaded from API');
        }
    }, [entries, selectedTrainer]);


    // Calendar helper functions
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDateKey = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Filter entries by selected trainer and current month/year
    const getEventsForDate = (date: Date) => {
        const dateKey = formatDateKey(date);
        const filtered = entries.filter(entry => {
            // Extract just the date part from entry.date (in case it has timestamp)
            const entryDate = entry.date.split('T')[0]; // Get YYYY-MM-DD part only
            const matchesDate = entryDate === dateKey;
            const matchesTrainer = !selectedTrainer || entry.trainerName === selectedTrainer;
            return matchesDate && matchesTrainer;
        });
        
        if (filtered.length > 0) {
            console.log(`Events for ${dateKey}:`, filtered);
        }
        
        return filtered;
    };

    const getEventColor = (eventType: string) => {
        switch (eventType.toLowerCase()) {
            case 'store':
                return 'bg-blue-500 text-white';
            case 'campus':
                return 'bg-green-500 text-white';
            case 'outdoor':
                return 'bg-amber-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const renderCalendarDays = () => {
        const days = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const blanks = Array(firstDay).fill(null);
        const allDays = [...blanks, ...days];

        return allDays.map((day, index) => {
            if (!day) {
                return <div key={`blank-${index}`} className="aspect-square" />;
            }

            const dateKey = formatDateKey(day);
            const dayEvents = getEventsForDate(day);
            const isToday = formatDateKey(new Date()) === dateKey;

            return (
                <div
                    key={dateKey}
                    className={`
                        aspect-square p-1 sm:p-2 rounded-xl border-2
                        ${isToday ? 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-transparent'}
                        bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all
                    `}
                >
                    <div className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        {day.getDate()}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-20">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                            <div
                                key={idx}
                                className={`text-[10px] sm:text-xs px-1 py-0.5 rounded truncate ${getEventColor(event.eventType)}`}
                                title={`${event.task} - ${event.location}`}
                            >
                                {event.task || event.eventType}
                            </div>
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="text-[10px] text-gray-500 dark:text-slate-400">
                                +{dayEvents.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            );
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-slate-400">Loading calendar data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={fetchCalendarData}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl">
            {/* Header with Trainer Filter */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="text-gray-600 dark:text-slate-300" size={24} />
                    </button>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                            {entries.length} total entries loaded
                        </p>
                    </div>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ChevronRight className="text-gray-600 dark:text-slate-300" size={24} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select
                            value={selectedTrainer}
                            onChange={(e) => setSelectedTrainer(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="">All Trainers</option>
                            {trainers.map((trainer) => (
                                <option key={trainer} value={trainer}>{trainer}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={fetchCalendarData}
                        disabled={loading}
                        className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 dark:text-slate-400 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
                {renderCalendarDays()}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Event Types:</span>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-xs text-gray-600 dark:text-slate-400">Store</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-xs text-gray-600 dark:text-slate-400">Campus</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                    <span className="text-xs text-gray-600 dark:text-slate-400">Outdoor</span>
                </div>
                {selectedTrainer && (
                    <div className="ml-auto">
                        <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                            Showing: {selectedTrainer}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainerCalendarDashboard;