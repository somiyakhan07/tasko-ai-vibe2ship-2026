import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarEvent, Task, Habit } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Trash2, 
  AlertCircle,
  X,
  CalendarDays,
  Search,
  Filter,
  Check,
  CheckSquare,
  Sparkles,
  Info,
  Calendar as CalendarIcon,
  PlusCircle,
  Zap,
  Flame,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CalendarModule: React.FC = () => {
  const { events, tasks, habits, addEvent, updateEvent, deleteEvent, addTask, updateTask } = useApp();
  
  // Date States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewTab, setViewTab] = useState<'month' | 'week' | 'day'>('month');

  // Search/Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modal configuration states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<'event' | 'task'>('event');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventColor, setEventColor] = useState('#6366f1');
  const [eventPriority, setEventPriority] = useState<CalendarEvent['priority']>('medium');
  const [eventCategory, setEventCategory] = useState('Work');

  // Task Quick-Add Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium');
  const [taskCategory, setTaskCategory] = useState('Work');

  const categories = ['Work', 'Personal', 'Ideas', 'Fitness', 'Finance', 'Health'];

  const colors = [
    { value: '#6366f1', label: 'Indigo' },
    { value: '#10b981', label: 'Emerald' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#ef4444', label: 'Rose' },
    { value: '#8b5cf6', label: 'Purple' }
  ];

  const priorityWeight = {
    critical: 5,
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  const getPriorityBadgeColor = (p: string | undefined) => {
    switch (p) {
      case 'critical': return 'bg-red-500 text-white font-extrabold';
      case 'urgent': return 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-200/50';
      case 'high': return 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-450 border border-orange-200/50';
      case 'medium': return 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-450 border border-amber-200/50';
      case 'low':
      default: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  // Helper date calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(new Date(year, month, i));
  }

  // Get start of the current week for week view
  const getStartOfWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 0); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const weekDays: Date[] = [];
  const weekStart = getStartOfWeek(new Date(selectedDate));
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDays.push(d);
  }

  // Fetch lists for specific dates
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => {
      const matchesDate = e.date === dateStr;
      const matchesSearch = searchQuery === '' || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || e.priority === priorityFilter;
      return matchesDate && matchesSearch && matchesCategory && matchesPriority;
    });
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => {
      const matchesDate = t.dueDate === dateStr;
      const matchesSearch = searchQuery === '' || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return matchesDate && matchesSearch && matchesCategory && matchesPriority;
    });
  };

  const getHabitsForDate = (date: Date) => {
    // Habits are continuous, we display active habits on this weekday
    const dayOfWeek = date.toLocaleDateString([], { weekday: 'long' }).toLowerCase(); // 'monday', 'tuesday', etc.
    const dateStr = date.toISOString().split('T')[0];
    return habits.filter(h => {
      const matchesSearch = searchQuery === '' || h.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || h.category === categoryFilter;
      
      // Filter out if frequency doesn't match roughly
      let matchesFrequency = true;
      if (h.frequency === 'weekly' && h.createdAt) {
        // Simple logic: check if the creation weekday matches the date weekday
        const createdDay = new Date(h.createdAt).getDay();
        matchesFrequency = date.getDay() === createdDay;
      } else if (h.frequency === 'monthly' && h.createdAt) {
        matchesFrequency = date.getDate() === new Date(h.createdAt).getDate();
      }
      return matchesSearch && matchesCategory && matchesFrequency;
    });
  };

  // Selected Day summary listings
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const selectedDateEvents = getEventsForDate(selectedDate);
  const selectedDateTasks = getTasksForDate(selectedDate);
  const selectedDateHabits = getHabitsForDate(selectedDate);

  // Total activities count
  const hasSelectedDayActivities = selectedDateEvents.length > 0 || selectedDateTasks.length > 0 || selectedDateHabits.length > 0;

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'prev' ? -7 : 7));
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'prev' ? -1 : 1));
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  };

  const handleOpenAdd = (mode: 'event' | 'task') => {
    setAddMode(mode);
    setEventTitle('');
    setEventDesc('');
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setEventColor('#6366f1');
    setEventPriority('medium');
    setEventCategory('Work');
    setTaskTitle('');
    setTaskPriority('medium');
    setTaskCategory('Work');
    setEditingEvent(null);
    setIsAddOpen(true);
  };

  const handleOpenEditEvent = (event: CalendarEvent) => {
    setAddMode('event');
    setEditingEvent(event);
    setEventTitle(event.title);
    setEventDesc(event.description || '');
    setEventStartTime(event.startTime);
    setEventEndTime(event.endTime);
    setEventColor(event.color);
    setEventPriority(event.priority || 'medium');
    setEventCategory(event.category || 'Work');
    setIsAddOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (addMode === 'event') {
      if (!eventTitle.trim()) return;
      if (editingEvent) {
        updateEvent({
          ...editingEvent,
          title: eventTitle.trim(),
          description: eventDesc.trim(),
          startTime: eventStartTime,
          endTime: eventEndTime,
          color: eventColor,
          priority: eventPriority,
          category: eventCategory,
        });
      } else {
        addEvent({
          title: eventTitle.trim(),
          description: eventDesc.trim(),
          date: selectedDateStr,
          startTime: eventStartTime,
          endTime: eventEndTime,
          color: eventColor,
          priority: eventPriority,
          category: eventCategory,
        });
      }
    } else {
      if (!taskTitle.trim()) return;
      addTask({
        title: taskTitle.trim(),
        description: '',
        dueDate: selectedDateStr,
        dueTime: '12:00',
        priority: taskPriority,
        category: taskCategory,
        isCompleted: false,
        subtasks: [],
        attachments: [],
        progress: 0,
      });
    }

    setIsAddOpen(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 text-slate-800 dark:text-slate-200"
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white">Productivity Calendar</h2>
          <p className="text-xs text-slate-400">Map out deadlines, core meetings, continuous habits, and focus schedules.</p>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-1 flex border border-slate-200 dark:border-slate-800">
            {(['month', 'week', 'day'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setViewTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  viewTab === tab 
                    ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => handleOpenAdd('event')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl text-2xs font-bold flex items-center space-x-1 shadow-lg shadow-indigo-600/10 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Event</span>
            </button>
            <button
              onClick={() => handleOpenAdd('task')}
              className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-2xs font-bold flex items-center space-x-1 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search calendar events, scope or descriptions..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {/* Category selection */}
          <div className="relative">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="all">Category: All</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Priority selection */}
          <div className="relative">
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="all">Priority: All</option>
              <option value="critical">Critical</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Grid: month, week, day */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          
          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-white">
              {viewTab === 'month' && `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`}
              {viewTab === 'week' && `Week of ${weekDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
              {viewTab === 'day' && selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={() => {
                  if (viewTab === 'month') navigateMonth('prev');
                  else if (viewTab === 'week') navigateWeek('prev');
                  else navigateDay('prev');
                }}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <button 
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setCurrentDate(today);
                }}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors uppercase font-mono tracking-wider"
              >
                Today
              </button>
              <button 
                onClick={() => {
                  if (viewTab === 'month') navigateMonth('next');
                  else if (viewTab === 'week') navigateWeek('next');
                  else navigateDay('next');
                }}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* MONTH VIEW MATRIX */}
          {viewTab === 'month' && (
            <div className="space-y-1">
              <div className="grid grid-cols-7 text-center gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <span key={day} className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest py-1">
                    {day}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {daysArray.map((date, index) => {
                  if (date === null) {
                    return <div key={`empty-${index}`} className="aspect-square bg-transparent" />;
                  }

                  const cellEvents = getEventsForDate(date);
                  const cellTasks = getTasksForDate(date);
                  const cellHabits = getHabitsForDate(date);
                  const cellCount = cellEvents.length + cellTasks.length + cellHabits.length;
                  
                  const isCellToday = isToday(date);
                  const isCellSelected = isSelected(date);

                  return (
                    <button
                      key={`day-${date.getDate()}`}
                      onClick={() => setSelectedDate(date)}
                      className={`aspect-square p-2 rounded-xl border flex flex-col justify-between text-left transition-all relative group ${
                        isCellSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                          : isCellToday
                            ? 'bg-indigo-50 dark:bg-indigo-950/25 border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold'
                            : cellCount > 0
                              ? 'bg-indigo-50/20 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-400 hover:border-indigo-500'
                              : 'bg-slate-50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900/50 text-slate-700 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-850'
                      }`}
                    >
                      <span className="text-2xs font-bold font-mono">{date.getDate()}</span>
                      
                      {/* Active count marker */}
                      {cellCount > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-auto">
                          {cellEvents.slice(0, 2).map(e => (
                            <span 
                              key={e.id} 
                              className="w-1.5 h-1.5 rounded-full" 
                              style={{ backgroundColor: isCellSelected ? '#ffffff' : e.color }} 
                            />
                          ))}
                          {cellTasks.slice(0, 2).map(t => (
                            <span 
                              key={t.id} 
                              className={`w-1.5 h-1.5 rounded-sm ${isCellSelected ? 'bg-white' : 'bg-amber-400'}`} 
                            />
                          ))}
                          {cellHabits.length > 0 && (
                            <span className={`w-1.5 h-1.5 rounded-sm rotate-45 ${isCellSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW MATRIX */}
          {viewTab === 'week' && (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => {
                const cellEvents = getEventsForDate(day);
                const cellTasks = getTasksForDate(day);
                const isCellToday = isToday(day);
                const isCellSelected = isSelected(day);

                return (
                  <div 
                    key={`week-${day.getDate()}`}
                    className={`border p-3 rounded-2xl min-h-[300px] flex flex-col justify-between transition-all ${
                      isCellSelected 
                        ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10' 
                        : isCellToday
                          ? 'border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/5'
                          : 'border-slate-150 dark:border-slate-850 bg-slate-50/30'
                    }`}
                  >
                    <div>
                      <button 
                        onClick={() => setSelectedDate(day)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs mx-auto ${
                          isCellSelected 
                            ? 'bg-indigo-600 text-white' 
                            : isCellToday
                              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                              : 'text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        {day.getDate()}
                      </button>
                      <p className="text-[10px] text-center font-mono uppercase font-bold text-slate-400 tracking-wider mt-1.5">
                        {day.toLocaleDateString([], { weekday: 'short' })}
                      </p>
                    </div>

                    <div className="flex-1 space-y-2 mt-4 overflow-y-auto max-h-[220px]">
                      {/* Miniature cards for week events */}
                      {cellEvents.map(e => (
                        <div 
                          key={e.id} 
                          onClick={() => { setSelectedDate(day); handleOpenEditEvent(e); }}
                          className="p-1.5 rounded text-[10px] font-bold text-white truncate cursor-pointer shadow-sm hover:scale-95 transition-transform"
                          style={{ backgroundColor: e.color }}
                          title={e.title}
                        >
                          {e.startTime} {e.title}
                        </div>
                      ))}

                      {cellTasks.map(t => (
                        <div 
                          key={t.id} 
                          className={`p-1 rounded text-[10px] border truncate text-slate-600 dark:text-slate-300 font-medium ${
                            t.isCompleted ? 'bg-slate-100/60 line-through dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50'
                          }`}
                        >
                          ⚠️ {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DAY VIEW DETAILED */}
          {viewTab === 'day' && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block border-b pb-1.5 border-slate-100 dark:border-slate-850">Hourly Events Timeline</span>
              {selectedDateEvents.length === 0 ? (
                <p className="text-2xs text-slate-400 italic py-6 text-center">No hourly schedule planned for this day.</p>
              ) : (
                <div className="relative pl-6 border-l-2 border-indigo-100 dark:border-indigo-950 space-y-5">
                  {selectedDateEvents.map(e => (
                    <div key={e.id} className="relative group bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850">
                      <span className="absolute -left-[31px] top-4 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900" style={{ backgroundColor: e.color }} />
                      
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">{e.title}</h4>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {e.category || 'General'}
                            </span>
                            {e.priority && (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${getPriorityBadgeColor(e.priority)}`}>
                                {e.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{e.description || 'No additional details provided.'}</p>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button 
                            onClick={() => handleOpenEditEvent(e)}
                            className="p-1 text-slate-400 hover:text-indigo-500 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => deleteEvent(e.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-2xs text-indigo-500 font-mono font-bold mt-2.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{e.startTime} - {e.endTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Selected Agenda Column Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col space-y-6">
          <div>
            <span className="text-[10px] font-bold font-mono text-indigo-500 uppercase tracking-widest block">Selected Agenda</span>
            <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-white mt-1">
              {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto max-h-[500px] pr-1">
            
            {/* Events Sub-block */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Calendar Events ({selectedDateEvents.length})</span>
              {selectedDateEvents.length === 0 ? (
                <p className="text-3xs text-slate-400 italic">No events or meetings scheduled.</p>
              ) : (
                selectedDateEvents.map(event => (
                  <div 
                    key={event.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950/40 border-l-4 rounded-r-xl border-transparent group relative flex items-start justify-between gap-2"
                    style={{ borderLeftColor: event.color }}
                  >
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{event.title}</h4>
                      <div className="flex items-center space-x-1 text-4xs text-slate-400 font-mono mt-1">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span>{event.startTime} - {event.endTime}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1 shrink-0">
                      <button 
                        onClick={() => handleOpenEditEvent(event)}
                        className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-500 transition-opacity"
                        title="Edit event"
                      >
                        <Clock className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity"
                        title="Delete event"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tasks Sub-block */}
            <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-850 pt-4">
              <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Deadlines & Tasks ({selectedDateTasks.length})</span>
              {selectedDateTasks.length === 0 ? (
                <p className="text-3xs text-slate-400 italic">No task deadlines schedule for today.</p>
              ) : (
                selectedDateTasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden pr-2">
                      <button 
                        onClick={() => updateTask({ ...task, isCompleted: !task.isCompleted })}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          task.isCompleted 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'border-slate-300 hover:border-indigo-500'
                        }`}
                      >
                        {task.isCompleted && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                      </button>
                      <p className={`text-xs text-slate-700 dark:text-slate-300 truncate font-semibold ${task.isCompleted ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                      </p>
                    </div>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono tracking-wider ${getPriorityBadgeColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Habits Sub-block */}
            <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-850 pt-4">
              <span className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Active Habits ({selectedDateHabits.length})</span>
              {selectedDateHabits.length === 0 ? (
                <p className="text-3xs text-slate-400 italic">No habits planned for this day.</p>
              ) : (
                selectedDateHabits.map(habit => {
                  const isDone = !!habit.history?.[selectedDateStr];
                  return (
                    <div 
                      key={habit.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-xl text-xs"
                    >
                      <span className="font-extrabold text-slate-700 dark:text-slate-200 truncate">{habit.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-850'
                      }`}>
                        {isDone ? 'Logged ✓' : 'Remaining'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Empty activities view */}
            {!hasSelectedDayActivities && (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-150 dark:border-slate-850">
                <AlertCircle className="w-7 h-7 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-2xs font-bold text-slate-500">No activities scheduled</p>
              </div>
            )}

          </div>

          {/* Quick Create block */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-2">
            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">Quick Add Scheduled Element</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenAdd('event')}
                className="py-2 px-3 border border-indigo-200 dark:border-indigo-900 rounded-xl text-xs font-bold text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/15 flex items-center justify-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
              <button
                onClick={() => handleOpenAdd('task')}
                className="py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-950 flex items-center justify-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Main Form Dialog Popup */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="fixed inset-0 bg-black"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10"
            >
              <button 
                onClick={() => setIsAddOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span>{addMode === 'event' ? (editingEvent ? 'Edit Event Details' : 'Schedule New Event') : 'Add Task Deadline'}</span>
              </h3>
              <p className="text-2xs text-slate-400 mt-0.5 mb-5">
                Target Date: <span className="font-bold text-slate-500 font-mono">{selectedDateStr}</span>
              </p>

              {/* Mode switch inside modal */}
              {!editingEvent && (
                <div className="bg-slate-100 dark:bg-slate-950 rounded-xl p-1 flex border border-slate-200 dark:border-slate-850 mb-4">
                  <button
                    type="button"
                    onClick={() => setAddMode('event')}
                    className={`flex-1 py-1.5 rounded-lg text-2xs font-bold capitalize transition-all ${
                      addMode === 'event' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    Calendar Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('task')}
                    className={`flex-1 py-1.5 rounded-lg text-2xs font-bold capitalize transition-all ${
                      addMode === 'task' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    Focus Task
                  </button>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {addMode === 'event' ? (
                  <>
                    {/* Event Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Event Name</label>
                      <input 
                        type="text" 
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        required
                        placeholder="e.g., Conduct client review sync"
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Description</label>
                      <textarea 
                        value={eventDesc}
                        onChange={(e) => setEventDesc(e.target.value)}
                        rows={2}
                        placeholder="Scope, online links, meeting codes..."
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    {/* Time fields */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Start Time */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Start Time</label>
                        <input 
                          type="time" 
                          value={eventStartTime}
                          onChange={(e) => setEventStartTime(e.target.value)}
                          required
                          className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs focus:outline-none font-mono"
                        />
                      </div>

                      {/* End Time */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">End Time</label>
                        <input 
                          type="time" 
                          value={eventEndTime}
                          onChange={(e) => setEventEndTime(e.target.value)}
                          required
                          className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Category & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Category</label>
                        <div className="relative">
                          <select 
                            value={eventCategory}
                            onChange={(e) => setEventCategory(e.target.value)}
                            className="w-full appearance-none bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs focus:outline-none text-slate-700 dark:text-slate-300 font-bold"
                          >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Priority Level</label>
                        <div className="relative">
                          <select 
                            value={eventPriority}
                            onChange={(e) => setEventPriority(e.target.value as any)}
                            className="w-full appearance-none bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs focus:outline-none text-slate-700 dark:text-slate-300 font-bold"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                            <option value="critical">Critical</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Color selection buttons */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider block">Theme Accent</label>
                      <div className="flex items-center space-x-3.5">
                        {colors.map(c => (
                          <button
                            type="button"
                            key={c.value}
                            onClick={() => setEventColor(c.value)}
                            className={`w-6 h-6 rounded-full transition-transform duration-200 relative ${
                              eventColor === c.value ? 'scale-125 ring-2 ring-slate-300 dark:ring-slate-700' : ''
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Task Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Task Title</label>
                      <input 
                        type="text" 
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        required
                        placeholder="e.g., Submit project final milestones"
                        className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    {/* Category & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Category</label>
                        <div className="relative">
                          <select 
                            value={taskCategory}
                            onChange={(e) => setTaskCategory(e.target.value)}
                            className="w-full appearance-none bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs focus:outline-none text-slate-700 dark:text-slate-300 font-bold"
                          >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Priority Level</label>
                        <div className="relative">
                          <select 
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value as any)}
                            className="w-full appearance-none bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs focus:outline-none text-slate-700 dark:text-slate-300 font-bold"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                            <option value="critical">Critical</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex space-x-3 pt-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 border border-slate-200 dark:border-slate-800 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/10 transition-all active:scale-95"
                  >
                    {editingEvent ? 'Save Changes' : (addMode === 'event' ? 'Create Event' : 'Schedule Task')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CalendarModule;
