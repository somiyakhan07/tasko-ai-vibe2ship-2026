import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckSquare, 
  Flame, 
  Calendar, 
  FileText, 
  ArrowRight, 
  TrendingUp, 
  Plus, 
  Clock, 
  Sparkles,
  Award,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export const HomeDashboard: React.FC = () => {
  const { 
    tasks, 
    events, 
    notes, 
    habits, 
    profile, 
    setActiveTab, 
    toggleHabitComplete, 
    updateTask,
    addTask,
    addNote,
    setSelectedNoteId,
    setIsNoteEditing
  } = useApp();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [quickInput, setQuickInput] = useState('');
  const [quickType, setQuickType] = useState<'task' | 'note'>('task');

  // Keep time updated
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  
  const tasksDueToday = tasks.filter(t => t.dueDate === todayStr);
  const completedTodayCount = tasksDueToday.filter(t => t.isCompleted).length;
  const taskRatio = tasksDueToday.length > 0 ? (completedTodayCount / tasksDueToday.length) * 100 : 0;

  const activeHabitsCount = habits.length;
  const completedHabitsToday = habits.filter(h => !!h.history[todayStr]).length;
  
  const eventsToday = events.filter(e => e.date === todayStr);

  const bestStreak = habits.reduce((max, h) => h.streak > max ? h.streak : max, 0);

  const greetingMessage = () => {
    const hr = currentTime.getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    if (quickType === 'task') {
      addTask({
        title: quickInput,
        description: 'Quickly added from dashboard.',
        isCompleted: false,
        dueDate: todayStr,
        priority: 'medium',
        category: 'Personal'
      });
    } else {
      const newNoteId = await addNote({
        title: quickInput,
        content: 'Created quickly from dashboard view. Add details here...',
        category: 'Ideas',
        isPinned: false,
        tags: ['quick']
      });
      if (newNoteId) {
        setSelectedNoteId(newNoteId);
        setIsNoteEditing(true);
        setActiveTab('notes');
      }
    }

    setQuickInput('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-7xl mx-auto p-4 md:p-8"
    >
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-400 font-mono text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Welcome to your Productivity Hub</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight">
            {greetingMessage()}, <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-400 bg-clip-text text-transparent">{profile.displayName}</span>
          </h2>
          <p className="text-xs text-slate-400">
            Never Miss What Matters.
          </p>
        </div>
        
        {/* Live Clock / Date Card */}
        <div className="flex items-center space-x-3 bg-slate-800/60 backdrop-blur border border-slate-700/50 px-4 py-2.5 rounded-2xl self-start md:self-auto shadow-inner">
          <Clock className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="text-sm font-bold font-mono tracking-wider">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-2xs text-slate-400 uppercase tracking-widest font-semibold">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Tasks completion */}
        <div 
          onClick={() => setActiveTab('tasks')}
          className="group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tasks Done</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 dark:text-white">
              {completedTodayCount}/{tasksDueToday.length}
            </span>
            <span className="text-2xs text-slate-400">due today</span>
          </div>
          {/* Custom progress bar */}
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-500" 
              style={{ width: `${taskRatio || 0}%` }}
            />
          </div>
        </div>

        {/* Stat 2: Active Streaks */}
        <div 
          onClick={() => setActiveTab('habits')}
          className="group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Habits Logged</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Flame className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 dark:text-white">
              {completedHabitsToday}/{activeHabitsCount}
            </span>
            <span className="text-2xs text-slate-400">today</span>
          </div>
          <div className="mt-3 text-2xs text-amber-600 dark:text-amber-400 font-medium flex items-center space-x-1">
            <Award className="w-3.5 h-3.5" />
            <span>Best streak: {bestStreak} days</span>
          </div>
        </div>

        {/* Stat 3: Notes Saved */}
        <div 
          onClick={() => setActiveTab('notes')}
          className="group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Saved Notes</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 dark:text-white">
              {notes.length}
            </span>
            <span className="text-2xs text-slate-400">ideas & logs</span>
          </div>
          <div className="mt-3 text-2xs text-slate-400 font-medium truncate">
            Last update: {notes[0]?.title || 'none'}
          </div>
        </div>

        {/* Stat 4: Events Scheduled */}
        <div 
          onClick={() => setActiveTab('calendar')}
          className="group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Calendar</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-display font-extrabold text-slate-800 dark:text-white">
              {eventsToday.length}
            </span>
            <span className="text-2xs text-slate-400">scheduled today</span>
          </div>
          <div className="mt-3 text-2xs text-slate-400 font-medium truncate">
            {eventsToday[0] ? `${eventsToday[0].startTime} - ${eventsToday[0].title}` : 'No events remaining'}
          </div>
        </div>
      </div>

      {/* Main Grid: Checklist & Active Habits & Command center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Due Today Tasks */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Today's Focus Tasks</h3>
              <p className="text-2xs text-slate-400">Complete these to achieve maximum throughput.</p>
            </div>
            <button 
              onClick={() => setActiveTab('tasks')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-2.5">
            {tasksDueToday.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">All clear for today!</p>
                <p className="text-2xs text-slate-400 max-w-xs mt-0.5">You have no tasks scheduled due today. Add one below or review your general backlog.</p>
              </div>
            ) : (
              tasksDueToday.map(task => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl hover:bg-slate-100/70 dark:hover:bg-slate-900/60 border border-transparent dark:border-slate-900 transition-colors"
                >
                  <div className="flex items-center space-x-3.5 overflow-hidden">
                    <button 
                      onClick={() => updateTask({ ...task, isCompleted: !task.isCompleted })}
                      className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        task.isCompleted 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500'
                      }`}
                    >
                      {task.isCompleted && <span className="text-[10px]">✓</span>}
                    </button>
                    <div className="overflow-hidden">
                      <p className={`text-sm font-semibold truncate text-slate-800 dark:text-slate-200 ${task.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {task.title}
                      </p>
                      <p className="text-2xs text-slate-400 truncate max-w-xs">
                        {task.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-2xs font-bold font-mono tracking-wide uppercase ${
                      task.priority === 'high' ? 'bg-rose-500/10 text-rose-500' :
                      task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Habit Trackers list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Habit Trackers</h3>
              <p className="text-2xs text-slate-400">Lock in your continuous streaks.</p>
            </div>
            <button 
              onClick={() => setActiveTab('habits')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-3">
            {habits.map(habit => {
              const isCompleted = !!habit.history[todayStr];
              return (
                <div 
                  key={habit.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-transparent dark:border-slate-900 rounded-2xl flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-900/60 transition-colors"
                >
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{habit.name}</h4>
                    <p className="text-3xs text-slate-400 font-mono tracking-wide">Current Streak: {habit.streak} 🔥</p>
                  </div>
                  <button 
                    onClick={() => toggleHabitComplete(habit.id, todayStr)}
                    className={`px-3 py-1.5 rounded-xl text-2xs font-extrabold transition-all duration-200 active:scale-95 ${
                      isCompleted 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/10' 
                        : 'bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600'
                    }`}
                  >
                    {isCompleted ? 'Logged ✓' : 'Log Daily'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Grid Column: Quick Add Tool & Calendar Events Today */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Add Form Component */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center space-x-2">
            <Plus className="w-4.5 h-4.5 text-indigo-500" />
            <span>Dashboard Quick-Add Command</span>
          </h3>
          <p className="text-2xs text-slate-400 mt-1 mb-4">
            Instantly append tasks or draft notes straight to your backlog from here.
          </p>

          <form onSubmit={handleQuickAdd} className="space-y-4">
            <div className="flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-850">
              <button
                type="button"
                onClick={() => setQuickType('task')}
                className={`flex-1 py-1.5 rounded-lg text-2xs font-bold transition-all ${
                  quickType === 'task' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Task (due today)
              </button>
              <button
                type="button"
                onClick={() => setQuickType('note')}
                className={`flex-1 py-1.5 rounded-lg text-2xs font-bold transition-all ${
                  quickType === 'note' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Note Idea
              </button>
            </div>

            <div className="relative">
              <input 
                type="text" 
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder={quickType === 'task' ? 'e.g., File expense report' : 'e.g., Marketing ideas memo'}
                className="w-full bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 text-2xs font-bold py-2.5 rounded-xl transition-all"
            >
              Add Entry
            </button>
          </form>
        </div>

        {/* Calendar Events Today */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                <Calendar className="w-4.5 h-4.5 text-indigo-500" />
                <span>Today's Schedule</span>
              </h3>
              <p className="text-2xs text-slate-400 mt-0.5">Your calendar event schedule for today.</p>
            </div>
            <button 
              onClick={() => setActiveTab('calendar')}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>View Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-2">
            {eventsToday.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Free schedule today</p>
                <p className="text-2xs text-slate-400 max-w-xs mt-0.5">No agenda items mapped for today. Enjoy the focus blocks.</p>
              </div>
            ) : (
              eventsToday.map(event => (
                <div 
                  key={event.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border-l-4 rounded-r-2xl border-transparent"
                  style={{ borderLeftColor: event.color || '#6366f1' }}
                >
                  <div className="overflow-hidden pr-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{event.title}</h4>
                    <p className="text-2xs text-slate-400 truncate">{event.description || 'No description.'}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{event.startTime}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{event.endTime}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
export default HomeDashboard;
