import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, MapPin, Store, Calendar as CalendarIcon, X, Trash2, Edit2 } from 'lucide-react';
import compStoreMapping from '../../src/comprehensive_store_mapping.json';
import trainerMapping from '../../trainerMapping.json';

interface CalendarEvent {
    id: string;
    date: string; // YYYY-MM-DD
    type: 'store' | 'outdoor' | 'campus';
    trainerName: string;
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
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    // Form State
    const [selectedTrainerName, setSelectedTrainerName] = useState('');
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
    
    // Trainer ID to Name mapping
    const TRAINER_ID_MAPPING: Record<string, string> = {
        'H1761': 'Mahadev',
        'H701': 'Mallika',
        'H1697': 'Sheldon',
        'H3595': 'Bhawna',
        'H2595': 'Kailash',
        'H3252': 'Priyanka',
        'H1278': 'Viraj',
        'H3247': 'Sunil',
        'H2155': 'Jagruti'
    };
    
    // Trainer names list
    const TRAINER_NAMES = [
        'Kailash',
        'Bhawna',
        'Sunil',
        'Viraj',
        'Priyanka',
        'Sheldon',
        'Mallika',
        'Mahadev',
        'Jagruti',
        'Oviya'
    ];
    
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
        
        const trainerEntry = (trainerMapping as any[]).find((entry: any) => 
            entry['Trainer ID']?.toLowerCase() === normalizedId ||
            entry['LMS Head ID']?.toLowerCase() === normalizedId ||
            entry['Area Manager ID']?.toLowerCase() === normalizedId ||
            entry['HRBP ID']?.toLowerCase() === normalizedId
        );
        
        if (trainerEntry) {
            if (trainerEntry['Trainer ID']?.toLowerCase() === normalizedId) {
                return trainerEntry['Trainer'];
            } else if (trainerEntry['LMS Head ID']?.toLowerCase() === normalizedId) {
                return 'LMS Head';
            } else if (trainerEntry['Area Manager ID']?.toLowerCase() === normalizedId) {
                return trainerEntry['Area Manager'] || 'Area Manager';
            } else if (trainerEntry['HRBP ID']?.toLowerCase() === normalizedId) {
                return 'HRBP';
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
        setEditingEvent(null);
        resetForm();
        // Auto-populate trainer name based on trainerId from URL if available
        if (trainerId) {
            const normalizedTrainerId = trainerId.toUpperCase();
            const autoTrainerName = TRAINER_ID_MAPPING[normalizedTrainerId] || '';
            if (autoTrainerName) {
                setSelectedTrainerName(autoTrainerName);
            }
        }
    };

    const resetForm = () => {
        // Auto-populate trainer name based on trainerId from URL if available
        if (trainerId) {
            const normalizedTrainerId = trainerId.toUpperCase();
            const autoTrainerName = TRAINER_ID_MAPPING[normalizedTrainerId] || '';
            setSelectedTrainerName(autoTrainerName);
        } else {
            setSelectedTrainerName('');
        }
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
        setSelectedTrainerName(event.trainerName || '');
        setSelectedStore(event.storeId || '');
        setSelectedCampus(event.campusName || '');
        
        if (event.task) {
            setSelectedTask(event.task);
        } else if (event.details) {
            const taskMatch = event.details.match(/Task: (.+?)(?:,|$)/);
            if (taskMatch) {
                setSelectedTask(taskMatch[1]);
            }
        }
        
        setEventDetails(event.details || '');
    };

    const handleDeleteEvent = (eventId: string, date: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const dateEvents = events[date] || [];
        const updated = { ...events };
        updated[date] = dateEvents.filter(e => e.id !== eventId);
        if (updated[date].length === 0) {
            delete updated[date];
        }
        saveEvents(updated);
    };

    const handleSaveEvent = () => {
        if (!selectedDate) return;
        
        if (!selectedTrainerName) {
            alert('Please select a trainer name');
            return;
        }
        if (eventType === 'store' && !selectedStore) {
            alert('Please select a store');
            return;
        }
        if (eventType === 'campus' && !selectedCampus) {
            alert('Please select a campus');
            return;
        }
        
        const dateKey = formatDateKey(selectedDate);
        const storeObj = eventType === 'store' ? compStoreMapping[selectedStore as keyof typeof compStoreMapping] : null;
        const storeName = storeObj && typeof storeObj === 'object' && 'Store Name' in storeObj ? storeObj['Store Name'] : '';
        
        const newEvent: CalendarEvent = {
            id: editingEvent?.id || Date.now().toString(),
            date: dateKey,
            type: eventType,
            trainerName: selectedTrainerName,
            storeId: eventType === 'store' ? selectedStore : undefined,
            storeName: eventType === 'store' ? storeName : undefined,
            campusName: eventType === 'campus' ? selectedCampus : undefined,
            task: selectedTask,
            details: eventDetails
        };

        const updated = { ...events };
        const dateEvents = updated[dateKey] || [];
        
        if (editingEvent) {
            const index = dateEvents.findIndex(e => e.id === editingEvent.id);
            if (index !== -1) {
                dateEvents[index] = newEvent;
            }
        } else {
            dateEvents.push(newEvent);
        }
        
        updated[dateKey] = dateEvents;
        saveEvents(updated);
        
        setEditingEvent(null);
        resetForm();
    };

    const handleCancelEdit = () => {
        setSelectedDate(null);
        setEditingEvent(null);
        resetForm();
    };

    // Submit to Google Sheets
    const handleSubmitCalendar = async () => {
        const allEvents = Object.values(events).flat();
        if (allEvents.length === 0) {
            alert('No events to submit');
            return;
        }

        setIsSubmitting(true);
        setSubmitMessage(null);

        try {
            const scriptUrl = import.meta.env.VITE_TRAINER_CALENDAR_SCRIPT_URL;
            if (!scriptUrl) {
                throw new Error('Google Apps Script URL not configured');
            }

            const payload = {
                trainerId,
                trainerName: actualTrainerName,
                month: currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
                events: allEvents.map(event => ({
                    date: event.date,
                    type: event.type,
                    trainerName: event.trainerName,
                    location: event.type === 'store' ? (event.storeId || event.storeName) : 
                             event.type === 'campus' ? event.campusName : 'Outdoor',
                    task: event.task || '',
                    details: event.details || ''
                }))
            };

            console.log('Submitting calendar payload:', payload);
            console.log('Script URL:', scriptUrl);

            const response = await fetch(scriptUrl, {
                method: 'POST',
                redirect: 'follow',
                headers: { 
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Submission result:', result);

            if (result.status === 'success') {
                setSubmitMessage({
                    type: 'success',
                    text: `Calendar submitted successfully! (${result.entriesAdded || allEvents.length} events)`
                });
            } else {
                throw new Error(result.message || 'Submission failed');
            }

            setTimeout(() => setSubmitMessage(null), 5000);
        } catch (error) {
            console.error('Submission error:', error);
            setSubmitMessage({
                type: 'error',
                text: `Failed to submit calendar: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render calendar grid
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
            const dayEvents = events[dateKey] || [];
            const isToday = formatDateKey(new Date()) === dateKey;
            const isSelected = selectedDate && formatDateKey(selectedDate) === dateKey;

            return (
                <div
                    key={dateKey}
                    onClick={() => handleDateClick(day)}
                    className={`
                        aspect-square p-1 sm:p-2 rounded-xl cursor-pointer 
                        transition-all duration-200 border-2
                        ${isToday ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent'}
                        ${isSelected ? 'ring-2 ring-purple-500 dark:ring-purple-400 ring-offset-0' : ''}
                        hover:bg-gray-100 dark:hover:bg-slate-700/50
                    `}
                >
                    <div className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                        {day.getDate()}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-16 sm:max-h-20">
                        {dayEvents.map((event) => (
                            <div
                                key={event.id}
                                className={`
                                    text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg
                                    flex items-center justify-between gap-1 group
                                    ${event.type === 'store' 
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                                        : event.type === 'campus'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    }
                                `}
                            >
                                <span className="truncate flex-1 font-medium">
                                    {event.task || (event.type === 'store' ? event.storeName : event.type === 'campus' ? event.campusName : 'Outdoor')}
                                </span>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => handleEditEvent(event, e)}
                                        className="p-0.5 hover:bg-white/50 dark:hover:bg-black/20 rounded"
                                    >
                                        <Edit2 size={10} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteEvent(event.id, dateKey, e)}
                                        className="p-0.5 hover:bg-white/50 dark:hover:bg-black/20 rounded"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        });
    };

    const filteredStores = Object.entries(compStoreMapping)
        .filter(([id, store]) => {
            const storeName = typeof store === 'object' && store && 'Store Name' in store ? store['Store Name'] : '';
            return storeName.toLowerCase().includes(storeSearch.toLowerCase()) ||
                   id.toLowerCase().includes(storeSearch.toLowerCase());
        });

    const filteredCampuses = CAMPUS_LIST.filter(campus =>
        campus.toLowerCase().includes(campusSearch.toLowerCase())
    );

    return (
        <div className="flex gap-4 h-[calc(100vh-8rem)] overflow-hidden">
            {/* Left Side - Calendar */}
            <div className="flex-1 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl shadow-xl dark:shadow-2xl flex flex-col p-4 sm:p-6 border border-gray-200 dark:border-transparent overflow-hidden">
                {/* Header */}
                <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                <ChevronLeft className="text-gray-600 dark:text-slate-300" size={20} />
                            </button>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                <ChevronRight className="text-gray-600 dark:text-slate-300" size={20} />
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
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 p-1">
                        {renderCalendarDays()}
                    </div>
                </div>
            </div>

            {/* Right Side - Event Form */}
            <div className="w-96 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl shadow-xl dark:shadow-2xl flex flex-col p-6 border border-gray-200 dark:border-transparent overflow-y-auto">
                {selectedDate ? (
                    <>
                        {/* Form Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <CalendarIcon className="text-purple-500 dark:text-purple-400" size={24} />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                {editingEvent ? 'Edit Event' : 'Add Event'}
                            </h3>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-slate-400 mb-6">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>

                        {/* Trainer Name Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                Trainer Name
                            </label>
                            {trainerId && TRAINER_ID_MAPPING[trainerId.toUpperCase()] ? (
                                <input
                                    type="text"
                                    value={selectedTrainerName}
                                    readOnly
                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white cursor-not-allowed"
                                />
                            ) : (
                                <select
                                    value={selectedTrainerName}
                                    onChange={(e) => setSelectedTrainerName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:border-purple-500 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 transition-all"
                                >
                                    <option value="">Select Trainer</option>
                                    {TRAINER_NAMES.map((name) => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Event Type Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                                Event Type
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => { setEventType('store'); setSelectedTask(''); }}
                                    className={`py-3 px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                        eventType === 'store'
                                            ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300 shadow-lg'
                                            : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <Store size={20} />
                                    <span className="text-xs font-medium">Store</span>
                                </button>
                                <button
                                    onClick={() => { setEventType('campus'); setSelectedTask('Campus placement'); }}
                                    className={`py-3 px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                        eventType === 'campus'
                                            ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 shadow-lg'
                                            : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-green-300 dark:hover:border-green-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <CalendarIcon size={20} />
                                    <span className="text-xs font-medium">Campus</span>
                                </button>
                                <button
                                    onClick={() => { setEventType('outdoor'); setSelectedTask(''); }}
                                    className={`py-3 px-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                                        eventType === 'outdoor'
                                            ? 'bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-300 shadow-lg'
                                            : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <MapPin size={20} />
                                    <span className="text-xs font-medium">Outdoor</span>
                                </button>
                            </div>
                        </div>

                        {/* Store Selection */}
                        {eventType === 'store' && (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                    Select Store
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search stores..."
                                    value={storeSearch}
                                    onChange={(e) => setStoreSearch(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white mb-2"
                                />
                                <select
                                    value={selectedStore}
                                    onChange={(e) => setSelectedStore(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                                >
                                    <option value="">Choose a store</option>
                                    {filteredStores.map(([id, store]) => {
                                        const storeName = typeof store === 'object' && store && 'Store Name' in store ? store['Store Name'] : id;
                                        return <option key={id} value={id}>{storeName} ({id})</option>;
                                    })}
                                </select>
                            </div>
                        )}

                        {/* Campus Selection */}
                        {eventType === 'campus' && (
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                    Select Campus
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search campuses..."
                                    value={campusSearch}
                                    onChange={(e) => setCampusSearch(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white mb-2"
                                />
                                <select
                                    value={selectedCampus}
                                    onChange={(e) => setSelectedCampus(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                                >
                                    <option value="">Choose a campus</option>
                                    {filteredCampuses.map((campus) => (
                                        <option key={campus} value={campus}>{campus}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Task Type Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                Task Type
                            </label>
                            <select
                                value={selectedTask}
                                onChange={(e) => setSelectedTask(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                                disabled={eventType === 'campus'}
                            >
                                <option value="">Select task</option>
                                {(eventType === 'campus' ? CAMPUS_TASK_TYPES : TASK_TYPES).map((task) => (
                                    <option key={task} value={task}>{task}</option>
                                ))}
                            </select>
                        </div>

                        {/* Additional Details */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                                Additional Notes
                            </label>
                            <textarea
                                value={eventDetails}
                                onChange={(e) => setEventDetails(e.target.value)}
                                placeholder="Add any additional details..."
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white resize-none"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mb-6">
                            <button
                                onClick={handleSaveEvent}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg"
                            >
                                {editingEvent ? 'Update' : 'Add Event'}
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="px-6 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Submit Calendar Button */}
                        <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
                            <button
                                onClick={handleSubmitCalendar}
                                disabled={isSubmitting || Object.keys(events).length === 0}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all shadow-lg disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : `Submit Calendar (${Object.values(events).flat().length} events)`}
                            </button>
                            {submitMessage && (
                                <div className={`mt-3 p-3 rounded-lg text-sm ${
                                    submitMessage.type === 'success' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                    {submitMessage.text}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <CalendarIcon size={64} className="text-gray-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 dark:text-slate-400 mb-2">
                            Select a Date
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-slate-500">
                            Click on any date in the calendar to add or view events
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainingCalendar;
