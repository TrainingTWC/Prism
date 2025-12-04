/**
 * TRAINER CALENDAR DASHBOARD
 * 
 * Displays all trainer calendars in a consolidated view
 * Fetches data from Google Sheets via Apps Script
 */

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Users, MapPin, Store, RefreshCw } from 'lucide-react';

interface CalendarEvent {
    'Trainer ID': string;
    'Trainer Name': string;
    'Date': string;
    'Event Type': string;
    'Store ID': string;
    'Store Name': string;
    'Task Type': string;
    'Additional Notes': string;
    'Submitted At': string;
}

interface TrainerCalendarData {
    trainerId: string;
    trainerName: string;
    events: CalendarEvent[];
}

const TrainerCalendarDashboard: React.FC = () => {
    const [calendarData, setCalendarData] = useState<TrainerCalendarData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTrainer, setSelectedTrainer] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Get script URL from environment
    const scriptUrl = import.meta.env.VITE_TRAINER_CALENDAR_SCRIPT_URL || '';

    // Load calendar data
    const loadCalendarData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${scriptUrl}?action=getAllTrainerCalendars`, {
                method: 'GET',
            });

            const result = await response.json();

            if (result.success) {
                setCalendarData(result.data || []);
                setLastRefresh(new Date());
            } else {
                setError(result.message || 'Failed to load calendar data');
            }
        } catch (err) {
            console.error('Failed to load calendar data:', err);
            setError('Failed to connect to server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (scriptUrl) {
            loadCalendarData();
        } else {
            setError('Calendar configuration not found. Please contact administrator.');
            setLoading(false);
        }
    }, []);

    // Filter events
    const filteredData = calendarData.filter(trainer => {
        if (selectedTrainer !== 'all' && trainer.trainerId !== selectedTrainer) {
            return false;
        }
        return true;
    });

    const filteredEvents = filteredData.flatMap(trainer =>
        trainer.events.filter(event => {
            if (selectedMonth !== 'all') {
                const eventMonth = event.Date.substring(0, 7); // YYYY-MM
                return eventMonth === selectedMonth;
            }
            return true;
        }).map(event => ({ ...event, trainerData: trainer }))
    );

    // Get unique months from data
    const uniqueMonths = Array.from(
        new Set(
            calendarData.flatMap(t =>
                t.events.map(e => e.Date.substring(0, 7))
            )
        )
    ).sort().reverse();

    // Statistics
    const totalTrainers = calendarData.length;
    const totalEvents = calendarData.reduce((sum, t) => sum + t.events.length, 0);
    const storeVisits = calendarData.reduce(
        (sum, t) => sum + t.events.filter(e => e['Event Type'] === 'store').length,
        0
    );
    const outdoorActivities = totalEvents - storeVisits;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-slate-400">Loading calendar data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <p className="text-red-800 dark:text-red-300 font-medium mb-2">Error Loading Calendar</p>
                <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
                <button
                    onClick={loadCalendarData}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6" />
                            Trainer Calendar Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-slate-400 text-sm">
                            View and manage all trainer schedules and activities
                        </p>
                    </div>
                    <button
                        onClick={loadCalendarData}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{totalTrainers}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Total Trainers</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{totalEvents}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Total Events</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Store className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{storeVisits}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Store Visits</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{outdoorActivities}</p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Outdoor Activities</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Filter by Trainer
                        </label>
                        <select
                            value={selectedTrainer}
                            onChange={(e) => setSelectedTrainer(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        >
                            <option value="all">All Trainers</option>
                            {calendarData.map(trainer => (
                                <option key={trainer.trainerId} value={trainer.trainerId}>
                                    {trainer.trainerName} ({trainer.trainerId})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Filter by Month
                        </label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                        >
                            <option value="all">All Months</option>
                            {uniqueMonths.map(month => (
                                <option key={month} value={month}>
                                    {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Calendar Events Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Trainer
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Task
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                    Notes
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                                        No calendar events found
                                    </td>
                                </tr>
                            ) : (
                                filteredEvents
                                    .sort((a, b) => b.Date.localeCompare(a.Date))
                                    .map((event, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                                                {new Date(event.Date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium text-gray-900 dark:text-slate-100">
                                                    {event['Trainer Name']}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400">
                                                    {event['Trainer ID']}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    event['Event Type'] === 'store'
                                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                                }`}>
                                                    {event['Event Type'] === 'store' ? (
                                                        <><Store className="w-3 h-3 mr-1" /> Store</>
                                                    ) : (
                                                        <><MapPin className="w-3 h-3 mr-1" /> Outdoor</>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                                                {event['Event Type'] === 'store' ? (
                                                    <div>
                                                        <div className="font-medium">{event['Store Name']}</div>
                                                        <div className="text-xs text-gray-500 dark:text-slate-400">
                                                            {event['Store ID']}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 dark:text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100">
                                                {event['Task Type'] || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                                                {event['Additional Notes'] || '—'}
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Last Updated */}
            <div className="text-center text-xs text-gray-500 dark:text-slate-400">
                Last updated: {lastRefresh.toLocaleString()}
            </div>
        </div>
    );
};

export default TrainerCalendarDashboard;
