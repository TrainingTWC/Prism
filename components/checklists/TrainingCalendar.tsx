import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Store, Calendar as CalendarIcon, X, Trash2, Edit2 } from 'lucide-react';
import compStoreMapping from '../../src/comprehensive_store_mapping.json';
import trainerMapping from '../../trainerMapping.json';

interface CalendarEvent {
    id: string;
    date: string; // YYYY-MM-DD
    type: 'store' | 'outdoor' | 'campus';
    storeId?: string;
    storeName?: string;
    campusName?: string;
    task?: string;
    details: string;
}

interface TrainingCalendarProps {
    trainerId: string;
    trainerName: string;
}

const TrainingCalendar: React.FC<TrainingCalendarProps> = ({ trainerId, trainerName }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<Record<string, CalendarEvent[]>>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    // Form State
    const [eventType, setEventType] = useState<'store' | 'outdoor' | 'campus'>('store');
    const [selectedStore, setSelectedStore] = useState('');
    const [selectedCampus, setSelectedCampus] = useState('');
    const [selectedTask, setSelectedTask] = useState('');
    const [eventDetails, setEventDetails] = useState('');
    const [storeSearch, setStoreSearch] = useState('');
    const [campusSearch, setCampusSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Predefined task types
    const TASK_TYPES = [
        'Store Visits',
        'Classroom session',
        'Induction',
        'TTT-LTO & New Launches',
        'Brew League',
        'NSO',
        'Weekly Off',
        'IDP Reviews',
        'Campus Interview',
        'SM Meet',
        'Admin Day',
        'External Championship',
        'BT Certification'
    ];
    
    const CAMPUS_TASK_TYPES = ['Campus placement'];
    
    // Campus list
    const CAMPUS_LIST = [
        'IHM Mumbai',
        'IHM Chennai',
        'ITM',
        'IHM Lucknow',
        'IHM Bangalore',
        'Shree shakthi IHM college',
        'AIHMCT-Bangalore',
        'IHM Shimla',
        'State Institute of Hotel Management, Bodhgaya',
        'IHM Ahmedabad',
        'IHM Pusa',
        'CIHM Chandigarh',
        'State Institute of Hotel Management ,Panipat',
        'State Institute of Hotel Management, Yamuna Nagar',
        'Institute of Hotel Management , Kurukshetra',
        'IHM Bhubaneswar',
        'IIHM Pune',
        'IHM Hyderabad',
        'AIHM Chandigarh',
        'IHM Goa',
        'IHM Kolkata',
        'IHM Silvasa',
        'IIHM Bangalore',
        'IHM Jaipur',
        'IHM Shillong',
        'IHM Gwalior',
        'State Institute of Hotel Management, Udaipur',
        'SIHM Jabalpur',
        'IHM pondicherry',
        'Institute of Hotel Management, Faridabad',
        'IHM guwahati',
        'Institute of Hotel Management, Dehradun'
    ];
    
    // Get actual trainer name from mapping
    const actualTrainerName = (() => {
        if (!trainerId) return trainerName || 'Trainer';
        const normalizedId = trainerId.toLowerCase();
        
        // Search for the ID in multiple fields
        const trainerEntry = (trainerMapping as any[]).find((entry: any) => 
            entry['Trainer ID']?.toLowerCase() === normalizedId ||
            entry['LMS Head ID']?.toLowerCase() === normalizedId ||
            entry['Area Manager ID']?.toLowerCase() === normalizedId ||
            entry['HRBP ID']?.toLowerCase() === normalizedId
        );
        
        // Return the appropriate name based on which field matched
        if (trainerEntry) {
            if (trainerEntry['Trainer ID']?.toLowerCase() === normalizedId) {
                return trainerEntry['Trainer'];
            } else if (trainerEntry['LMS Head ID']?.toLowerCase() === normalizedId) {
                return 'LMS Head'; // Or you could add a field for LMS Head name
            } else if (trainerEntry['Area Manager ID']?.toLowerCase() === normalizedId) {
                return trainerEntry['Area Manager'] || 'Area Manager';
            } else if (trainerEntry['HRBP ID']?.toLowerCase() === normalizedId) {
                return 'HRBP'; // Or you could add a field for HRBP name
            }
        }
        
        return trainerName || trainerId || 'Trainer';
    })();

    // Load events from localStorage
    useEffect(() => {
        const loadEvents = () => {
            try {
                const stored = localStorage.getItem('training_calendar_events');
                if (stored) {
                    const allEvents = JSON.parse(stored);
                    setEvents(allEvents[trainerId] || {});
                }
            } catch (e) {
                console.error("Failed to load calendar events", e);
            }
        };
        loadEvents();
    }, [trainerId]);

    // Save events to localStorage
    const saveEvents = (updatedEvents: Record<string, CalendarEvent[]>) => {
        try {
            const stored = localStorage.getItem('training_calendar_events');
            const allEvents = stored ? JSON.parse(stored) : {};
            allEvents[trainerId] = updatedEvents;
            localStorage.setItem('training_calendar_events', JSON.stringify(allEvents));
            setEvents(updatedEvents);
        } catch (e) {
            console.error("Failed to save calendar events", e);
        }
    };

    // Calendar Helpers
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

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
        setEditingEvent(null);
        setEventType('store');
        setSelectedStore('');
        setSelectedCampus('');
        setSelectedTask('');
        setEventDetails('');
        setStoreSearch('');
        setCampusSearch('');
    };

    const handleEditEvent = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDate(new Date(event.date));
        setEditingEvent(event);
        setEventType(event.type);
        setSelectedStore(event.storeId || '');
        setSelectedCampus(event.campusName || '');
        
        // Use the task field if available, otherwise try to extract from details
        if (event.task) {
            setSelectedTask(event.task);
            // Remove task from details if it was stored there
            const detailLines = event.details.split('\n');
            if (detailLines[0] === event.task) {
                setEventDetails(detailLines.slice(1).join('\n').trim());
            } else {
                setEventDetails(event.details);
            }
        } else {
            // Legacy: Try to extract task from details if it matches predefined tasks
            const detailLines = event.details.split('\n');
            const firstLine = detailLines[0];
            if (TASK_TYPES.includes(firstLine)) {
                setSelectedTask(firstLine);
                setEventDetails(detailLines.slice(1).join('\n').trim());
            } else {
                setSelectedTask('');
                setEventDetails(event.details);
            }
        }
        
        setIsModalOpen(true);
    };

    const handleDeleteEvent = (eventId: string) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            const updatedEvents = { ...events };
            // Find and remove the event from all dates
            Object.keys(updatedEvents).forEach(dateKey => {
                updatedEvents[dateKey] = updatedEvents[dateKey].filter(ev => ev.id !== eventId);
                if (updatedEvents[dateKey].length === 0) {
                    delete updatedEvents[dateKey];
                }
            });
            saveEvents(updatedEvents);
        }
    };

    const handleSaveEvent = () => {
        if (!selectedDate) return;
        
        // Validation: Store visits require a selected store
        if (eventType === 'store' && !selectedStore) {
            alert('Please select a store for the visit');
            return;
        }
        
        // Validation: Campus events require a selected campus
        if (eventType === 'campus' && !selectedCampus) {
            alert('Please select a campus for the event');
            return;
        }

        const dateKey = formatDateKey(selectedDate);

        let storeName = '';
        if (eventType === 'store' && selectedStore) {
            const store = (compStoreMapping as any[]).find((s: any) => s['Store ID'] === selectedStore);
            storeName = store ? store['Store Name'] : '';
        }
        
        // Combine selected task with additional details
        let finalDetails = eventDetails.trim();
        if (selectedTask) {
            finalDetails = selectedTask + (finalDetails ? '\n' + finalDetails : '');
        }

        const newEvent: CalendarEvent = {
            id: editingEvent ? editingEvent.id : Date.now().toString(),
            date: dateKey,
            type: eventType,
            storeId: eventType === 'store' ? selectedStore : undefined,
            storeName: eventType === 'store' ? storeName : undefined,
            campusName: eventType === 'campus' ? selectedCampus : undefined,
            task: selectedTask || undefined,
            details: finalDetails
        };

        const updatedEvents = { ...events };
        if (!updatedEvents[dateKey]) {
            updatedEvents[dateKey] = [];
        }

        if (editingEvent) {
            updatedEvents[dateKey] = updatedEvents[dateKey].map(ev => ev.id === editingEvent.id ? newEvent : ev);
        } else {
            updatedEvents[dateKey].push(newEvent);
        }

        saveEvents(updatedEvents);
        setIsModalOpen(false);
    };

    // Store List for Dropdown
    const uniqueStores = (() => {
        const stores = (compStoreMapping as any[]).map((row: any) => ({
            name: row['Store Name'],
            id: row['Store ID']
        }));
        return stores
            .filter(store => store.name && store.id)
            .sort((a, b) => a.name.localeCompare(b.name));
    })();

    const filteredStores = uniqueStores.filter(store =>
        store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
        store.id.toLowerCase().includes(storeSearch.toLowerCase())
    );

    // Submit calendar to Google Sheets
    const handleSubmitCalendar = async () => {
        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            // Prepare data for submission
            const calendarData = Object.entries(events).flatMap(([date, dayEvents]) =>
                dayEvents.map(event => ({
                    trainerId,
                    trainerName: actualTrainerName,
                    date,
                    eventType: event.type,
                    storeId: event.storeId || '',
                    storeName: event.storeName || '',
                    taskType: event.details.split('\n')[0] || '',
                    additionalNotes: event.details.split('\n').slice(1).join('\n') || '',
                    timestamp: new Date().toISOString()
                }))
            );

            // Get the Google Apps Script URL from environment or config
            const scriptUrl = import.meta.env.VITE_TRAINER_CALENDAR_SCRIPT_URL || 
                             'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

            const response = await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'submitCalendar',
                    data: calendarData
                })
            });

            setSubmitMessage({ type: 'success', text: 'Calendar submitted successfully!' });
            
            // Clear message after 3 seconds
            setTimeout(() => setSubmitMessage(null), 3000);
        } catch (error) {
            console.error('Failed to submit calendar:', error);
            setSubmitMessage({ type: 'error', text: 'Failed to submit calendar. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        // Adjust for Monday start (0 = Monday, 6 = Sunday)
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
        const blanks = Array.from({ length: adjustedFirstDay }, (_, i) => i);

        return (
            <>
                {blanks.map(blank => (
                    <div key={`blank-${blank}`} className="aspect-square rounded-2xl bg-gray-50 dark:bg-slate-800/30"></div>
                ))}  
                {daysInMonth.map(date => {
                    const dateKey = formatDateKey(date);
                    const dayEvents = events[dateKey] || [];
                    const isToday = formatDateKey(new Date()) === dateKey;
                    const isSelected = selectedDate && formatDateKey(selectedDate) === dateKey;

                    return (
                        <div
                            key={dateKey}
                            onClick={() => handleDateClick(date)}
                            className={`aspect-square rounded-2xl cursor-pointer transition-all group relative ${
                                isToday 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 dark:bg-indigo-600/30 dark:border-2 dark:border-indigo-500 dark:text-white' 
                                    : isSelected
                                    ? 'bg-gray-200 border-2 border-gray-300 dark:bg-slate-700/50 dark:border-2 dark:border-slate-600'
                                    : dayEvents.length > 0
                                    ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200 dark:bg-slate-700/40 dark:hover:bg-slate-700/60 dark:border dark:border-slate-600/30'
                                    : 'bg-white hover:bg-gray-50 border border-gray-200 dark:bg-slate-800/40 dark:hover:bg-slate-700/50 dark:border dark:border-slate-700/30'
                            }`}
                        >
                            <div className="p-2 h-full flex flex-col">
                                <div className={`text-sm font-semibold mb-1 ${
                                    isToday ? 'text-white' : 'text-gray-900 dark:text-slate-300'
                                }`}>
                                    {date.getDate()}
                                </div>
                                
                                {/* Event indicators */}
                                <div className="flex-1 flex flex-col gap-1.5 overflow-hidden mt-1">
                                    {dayEvents.slice(0, 2).map(event => (
                                        <div
                                            key={event.id}
                                            onClick={(e) => { e.stopPropagation(); }}
                                            className={`group/pill flex items-center justify-between gap-1 text-[10px] px-2 py-1 rounded-full font-medium transition-all ${
                                                event.type === 'store'
                                                    ? 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 hover:border-purple-300 dark:bg-purple-500/30 dark:text-purple-200 dark:border-purple-500/40 dark:hover:bg-purple-500/40'
                                                    : event.type === 'campus'
                                                    ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 hover:border-green-300 dark:bg-green-500/30 dark:text-green-200 dark:border-green-500/40 dark:hover:bg-green-500/40'
                                                    : 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 hover:border-orange-300 dark:bg-orange-500/30 dark:text-orange-200 dark:border-orange-500/40 dark:hover:bg-orange-500/40'
                                            }`}
                                        >
                                            <span className="truncate flex-1 font-semibold uppercase tracking-wide">
                                                {event.task || (event.type === 'store' ? 'Store' : event.type === 'campus' ? 'Campus' : 'Outdoor')}
                                            </span>
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover/pill:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setSelectedDate(date); setIsModalOpen(true); }}
                                                    className="w-4 h-4 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center shadow-sm"
                                                >
                                                    <Edit2 size={8} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                                                    className="w-4 h-4 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center shadow-sm"
                                                >
                                                    <Trash2 size={8} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {dayEvents.length > 2 && (
                                        <div className="text-[9px] text-gray-600 dark:text-slate-400 font-medium px-2">
                                            +{dayEvents.length - 2} more
                                        </div>
                                    )}
                                </div>
                                
                                {/* Hover actions */}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDateClick(date); }}
                                        className="w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center shadow-lg"
                                    >
                                        <Plus size={12} className="text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </>
        );
    };

    return (
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl shadow-xl dark:shadow-2xl flex flex-col p-4 sm:p-6 border border-gray-200 dark:border-transparent max-h-[calc(100vh-8rem)] overflow-hidden">
            {/* Header */}
            <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handlePrevMonth} 
                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 flex items-center justify-center transition-all border border-gray-200 dark:border-slate-700/50"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-slate-300" />
                        </button>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button 
                            onClick={handleNextMonth} 
                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 flex items-center justify-center transition-all border border-gray-200 dark:border-slate-700/50"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-slate-300" />
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 dark:text-slate-400 hidden sm:block">
                            Trainer: <span className="font-medium text-gray-900 dark:text-slate-200">{actualTrainerName}</span>
                        </div>
                        <button
                            onClick={handleSubmitCalendar}
                            disabled={isSubmitting || Object.keys(events).length === 0}
                            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-all shadow-lg hover:shadow-xl"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Calendar'}
                        </button>
                    </div>
                </div>
                
                {/* Success/Error Message */}
                {submitMessage && (
                    <div className={`p-3 rounded-xl text-sm ${
                        submitMessage.type === 'success' 
                            ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30'
                            : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30'
                    }`}>
                        {submitMessage.text}
                    </div>
                )}
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-slate-400">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 flex-1 min-h-0 overflow-auto">
                {renderCalendarDays()}
            </div>

            {/* Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900/50 dark:to-slate-800/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                                    <CalendarIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    {editingEvent ? 'Edit Event' : 'Add Event'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                                    {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-all"
                            >
                                <X size={20} className="text-gray-600 dark:text-slate-300" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                            {/* Event Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-3">Event Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setEventType('store')}
                                        className={`py-3 px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${eventType === 'store'
                                                ? 'bg-purple-100 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-500 dark:text-purple-300 shadow-lg'
                                                : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <Store size={20} />
                                        <span className="text-xs font-medium">Store</span>
                                    </button>
                                    <button
                                        onClick={() => { setEventType('campus'); setSelectedTask('Campus placement'); }}
                                        className={`py-3 px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${eventType === 'campus'
                                                ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 shadow-lg'
                                                : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-green-300 dark:hover:border-green-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <CalendarIcon size={20} />
                                        <span className="text-xs font-medium">Campus</span>
                                    </button>
                                    <button
                                        onClick={() => setEventType('outdoor')}
                                        className={`py-3 px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${eventType === 'outdoor'
                                                ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/30 dark:border-orange-500 dark:text-orange-300 shadow-lg'
                                                : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <MapPin size={20} />
                                        <span className="text-xs font-medium">Outdoor</span>
                                    </button>
                                </div>
                            </div>

                            {/* Store Selection (if Store Visit) */}
                            {eventType === 'store' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-3">Select Store</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search and select store..."
                                            value={storeSearch}
                                            onChange={(e) => setStoreSearch(e.target.value)}
                                            onFocus={() => document.getElementById('store-dropdown')?.classList.remove('hidden')}
                                            className="w-full p-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm"
                                        />
                                        <div 
                                            id="store-dropdown"
                                            className="hidden absolute z-10 w-full mt-2 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 max-h-48 overflow-y-auto shadow-lg"
                                        >
                                            {filteredStores.length === 0 ? (
                                                <div className="p-4 text-sm text-gray-500 dark:text-slate-400 text-center">
                                                    No stores found
                                                </div>
                                            ) : (
                                                filteredStores.map(store => (
                                                    <div
                                                        key={store.id}
                                                        onClick={() => {
                                                            setSelectedStore(store.id);
                                                            setStoreSearch(store.name);
                                                            document.getElementById('store-dropdown')?.classList.add('hidden');
                                                        }}
                                                        className={`p-3 cursor-pointer hover:bg-purple-50 dark:hover:bg-slate-600 transition-colors text-sm border-b border-gray-100 dark:border-slate-600 last:border-0 ${
                                                            selectedStore === store.id
                                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-300 font-semibold'
                                                                : 'text-gray-900 dark:text-slate-100'
                                                        }`}
                                                    >
                                                        {store.name} ({store.id})
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Campus Selection (if Campus Event) */}
                            {eventType === 'campus' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-3">Select Campus</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search and select campus..."
                                            value={campusSearch}
                                            onChange={(e) => setCampusSearch(e.target.value)}
                                            onFocus={() => document.getElementById('campus-dropdown')?.classList.remove('hidden')}
                                            className="w-full p-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                                        />
                                        <div 
                                            id="campus-dropdown"
                                            className="hidden absolute z-10 w-full mt-2 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 max-h-48 overflow-y-auto shadow-lg"
                                        >
                                            {CAMPUS_LIST.filter(campus => 
                                                campus.toLowerCase().includes(campusSearch.toLowerCase())
                                            ).length === 0 ? (
                                                <div className="p-4 text-sm text-gray-500 dark:text-slate-400 text-center">
                                                    No campuses found
                                                </div>
                                            ) : (
                                                CAMPUS_LIST.filter(campus => 
                                                    campus.toLowerCase().includes(campusSearch.toLowerCase())
                                                ).map(campus => (
                                                    <div
                                                        key={campus}
                                                        onClick={() => {
                                                            setSelectedCampus(campus);
                                                            setCampusSearch(campus);
                                                            document.getElementById('campus-dropdown')?.classList.add('hidden');
                                                        }}
                                                        className={`p-3 cursor-pointer hover:bg-green-50 dark:hover:bg-slate-600 transition-colors text-sm border-b border-gray-100 dark:border-slate-600 last:border-0 ${
                                                            selectedCampus === campus
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300 font-semibold'
                                                                : 'text-gray-900 dark:text-slate-100'
                                                        }`}
                                                    >
                                                        {campus}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Task Type Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-3">Task Type</label>
                                <select
                                    value={selectedTask}
                                    onChange={(e) => setSelectedTask(e.target.value)}
                                    className="w-full p-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-medium"
                                >
                                    <option value="">-- Select Task Type --</option>
                                    {(eventType === 'campus' ? CAMPUS_TASK_TYPES : TASK_TYPES).map(task => (
                                        <option key={task} value={task}>
                                            {task}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Details */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-3">
                                    Additional Notes {selectedTask && <span className="text-xs text-gray-500 font-normal">(Optional)</span>}
                                </label>
                                <textarea
                                    value={eventDetails}
                                    onChange={(e) => setEventDetails(e.target.value)}
                                    placeholder={selectedTask ? "Add any additional notes or details..." : "Enter task details, agenda, or notes..."}
                                    className="w-full p-4 border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[120px] resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-xl transition-all border-2 border-gray-200 dark:border-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEvent}
                                disabled={(eventType === 'store' && !selectedStore) || (eventType === 'campus' && !selectedCampus)}
                                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {editingEvent ? 'Update Event' : 'Save Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainingCalendar;
