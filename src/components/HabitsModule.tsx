import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Habit, getLocalDateString } from '../types';
import { 
  Plus, 
  Flame, 
  Award, 
  Trash2, 
  TrendingUp, 
  X, 
  Check, 
  Sparkles,
  Info,
  Calendar,
  Clock,
  Search,
  Filter,
  ChevronDown,
  Edit3,
  CheckCircle,
  Tag,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HabitsModule: React.FC = () => {
  const { habits, addHabit, updateHabit, toggleHabitComplete, deleteHabit } = useApp();
  
  // States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');

  // Form States
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formFrequency, setFormFrequency] = useState<Habit['frequency']>('daily');
  const [formCategory, setFormCategory] = useState('Health');
  const [formReminderTime, setFormReminderTime] = useState('08:00');

  const categories = ['Work', 'Personal', 'Ideas', 'Fitness', 'Finance', 'Health'];

  // Days list for the last 7 days tracker
  const getPast7Days = () => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d);
    }
    return arr;
  };

  const past7Days = getPast7Days();
  const todayStr = getLocalDateString(new Date());

  const handleOpenAdd = () => {
    setEditingHabit(null);
    setFormName('');
    setFormDesc('');
    setFormFrequency('daily');
    setFormCategory('Health');
    setFormReminderTime('08:00');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormName(habit.name);
    setFormDesc(habit.description || '');
    setFormFrequency(habit.frequency);
    setFormCategory(habit.category || 'Health');
    setFormReminderTime(habit.reminderTime || '08:00');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingHabit) {
      updateHabit({
        ...editingHabit,
        name: formName,
        description: formDesc,
        frequency: formFrequency,
        category: formCategory,
        reminderTime: formReminderTime,
      });
    } else {
      addHabit({
        name: formName,
        description: formDesc,
        frequency: formFrequency,
        category: formCategory,
        reminderTime: formReminderTime,
      });
    }

    setIsFormOpen(false);
    setFormName('');
    setFormDesc('');
  };

  // Filtered habits list
  const filteredHabits = habits.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (h.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || h.category === categoryFilter;
    const matchesFrequency = frequencyFilter === 'all' || h.frequency === frequencyFilter;
    return matchesSearch && matchesCategory && matchesFrequency;
  });

  // Completion metrics
  const totalHabitsCount = filteredHabits.length;
  const completedTodayCount = filteredHabits.filter(h => !!h.history[todayStr]).length;
  const completionRatio = totalHabitsCount > 0 ? Math.round((completedTodayCount / totalHabitsCount) * 100) : 0;

  // Best streak calculation
  const overallBestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);
  const totalCompletedLogs = habits.reduce((sum, h) => sum + Object.keys(h.history || {}).length, 0);

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
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white">Continuous Habits</h2>
          <p className="text-xs text-slate-400">Lock in routines, hit consecutive streaks, and level up focus metrics.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/10 self-start md:self-auto transition-all active:scale-95"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>New Tracker</span>
        </button>
      </div>

      {/* Habits visual dashboard card with real stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-indigo-400 font-mono text-2xs uppercase tracking-wider">
              <Award className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
              <span>Habit Streak Analytics</span>
            </div>
            <h3 className="font-display font-extrabold text-xl md:text-2xl">
              Today's Completion Rate: <span className="text-indigo-400 font-mono">{completionRatio}%</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Daily consistency builds neural pathways. Complete your remaining trackers to maintain active streaks.
            </p>
          </div>

          {/* Circular Progress Display */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0 self-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="rgba(99, 102, 241, 0.1)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#6366f1"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - completionRatio / 100)}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-lg font-mono font-extrabold text-white">{completedTodayCount}/{totalHabitsCount}</p>
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">Logged</p>
            </div>
          </div>
        </div>

        {/* Bento Stats Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-mono font-bold uppercase text-slate-400 tracking-wider">Habit Consistency Metrics</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Best Streak</span>
              <div className="flex items-center space-x-1.5 text-slate-800 dark:text-white">
                <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                <span className="text-lg font-mono font-extrabold">{overallBestStreak} Days</span>
              </div>
            </div>
            <div className="space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Logs</span>
              <div className="flex items-center space-x-1.5 text-slate-800 dark:text-white">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-lg font-mono font-extrabold">{totalCompletedLogs} times</span>
              </div>
            </div>
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
            placeholder="Search habit routines or categories..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
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
              <option value="all">Workstream: All</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Frequency selection */}
          <div className="relative">
            <select 
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="all">Frequency: All</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Trackers list columns */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 space-y-4">
        {/* Helper Column row header */}
        <div className="grid grid-cols-1 md:grid-cols-12 text-xs font-bold text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-850 gap-4">
          <div className="md:col-span-5 uppercase tracking-wider font-mono">HABIT ROUTINE & WORKSTREAM</div>
          <div className="md:col-span-2 text-center uppercase tracking-wider font-mono">STREAK STATUS</div>
          <div className="md:col-span-4 text-center uppercase tracking-wider font-mono">7-DAY HISTORY LOGS</div>
          <div className="md:col-span-1 text-right uppercase tracking-wider font-mono">ACTIONS</div>
        </div>

        {filteredHabits.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
            <Info className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-500">No active trackers found</p>
            <p className="text-2xs text-slate-400">Click the "New Tracker" button to setup custom daily routines.</p>
          </div>
        ) : (
          filteredHabits.map((habit) => (
            <div 
              key={habit.id}
              className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 py-4 border-b border-slate-50 dark:border-slate-900 last:border-b-0"
            >
              {/* Profile Details */}
              <div className="md:col-span-5 overflow-hidden space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">{habit.name}</h4>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                    {habit.category || 'General'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 capitalize font-mono">
                    {habit.frequency}
                  </span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{habit.description || 'No description added'}</p>
                {habit.reminderTime && (
                  <div className="flex items-center space-x-1 text-4xs font-bold text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>Reminder set for {habit.reminderTime}</span>
                  </div>
                )}
              </div>

              {/* Streak info */}
              <div className="md:col-span-2 text-center flex items-center justify-center space-x-3 md:space-x-1">
                <div className="flex items-center space-x-1 bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-xl">
                  <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
                  <span className="text-xs font-mono font-extrabold">{habit.streak || 0}d</span>
                </div>
                <div className="text-4xs text-slate-400 font-bold block md:hidden">Streak</div>
                <div className="hidden md:flex items-center space-x-1 text-2xs text-slate-400 font-semibold pl-2 font-mono">
                  <span>Best: {habit.bestStreak || 0}d</span>
                </div>
              </div>

              {/* 7 Day check dots */}
              <div className="md:col-span-4 flex justify-between md:justify-center items-center gap-1.5 py-2 px-1">
                <span className="text-4xs text-slate-400 font-bold block md:hidden uppercase tracking-wider font-mono">7d Log:</span>
                <div className="flex items-center gap-1.5">
                  {past7Days.map((dayDate) => {
                    const dStr = getLocalDateString(dayDate);
                    const isDone = !!habit.history?.[dStr];
                    const isTodayCell = dStr === todayStr;

                    return (
                      <button
                        key={`${habit.id}-${dStr}`}
                        onClick={() => toggleHabitComplete(habit.id, dStr)}
                        className={`w-8 h-8 rounded-xl flex flex-col items-center justify-center border transition-all ${
                          isDone 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                            : isTodayCell
                              ? 'border-indigo-500 dark:border-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-950 text-indigo-500'
                              : 'border-slate-200 dark:border-slate-850 text-slate-400 hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-950'
                        }`}
                        title={`${dayDate.toLocaleDateString()} - Click to toggle log`}
                      >
                        <span className="text-[8px] font-bold uppercase font-mono tracking-tighter block leading-none">
                          {dayDate.toLocaleDateString([], { weekday: 'narrow' })}
                        </span>
                        {isDone ? (
                          <Check className="w-2.5 h-2.5 mt-0.5 stroke-[3]" />
                        ) : (
                          <span className="text-3xs font-mono font-bold mt-0.5">{dayDate.getDate()}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action column */}
              <div className="md:col-span-1 text-right flex items-center justify-end space-x-1">
                <button
                  onClick={() => handleOpenEdit(habit)}
                  className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-all"
                  title="Edit habit settings"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteHabit(habit.id)}
                  className="p-1.5 text-slate-350 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-all"
                  title="Delete habit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Habit Creation/Edit modal popup */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-black"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 text-slate-800 dark:text-slate-200"
            >
              <button 
                onClick={() => setIsFormOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <span>{editingHabit ? 'Modify Habit Routine' : 'Create Habit Tracker'}</span>
              </h3>
              <p className="text-2xs text-slate-400 mt-0.5 mb-5">
                {editingHabit ? 'Edit name, schedule, target category, and reminder configurations.' : 'Establish custom recurring routines to keep your production output continuous.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Habit Name</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g., Hydrate & Deep Breathing"
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white font-semibold"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Description / Objectives</label>
                  <textarea 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={2}
                    placeholder="e.g., 5-minute deep breathing sequence to re-engage cognitive concentration..."
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Category</label>
                    <div className="relative">
                      <select 
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Reminder Time */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Reminder Time</label>
                    <input 
                      type="time" 
                      value={formReminderTime}
                      onChange={(e) => setFormReminderTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Frequency selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Routine Frequency</label>
                  <div className="flex space-x-2">
                    {(['daily', 'weekly', 'monthly'] as const).map(freq => (
                      <button
                        type="button"
                        key={freq}
                        onClick={() => setFormFrequency(freq)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                          formFrequency === freq 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-3">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 border border-slate-200 dark:border-slate-800 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/10 transition-all active:scale-95"
                  >
                    {editingHabit ? 'Save Changes' : 'Establish Tracker'}
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

export default HabitsModule;
