import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task, SubTask, Attachment } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Check, 
  Calendar, 
  Edit3, 
  Tag, 
  AlertCircle,
  LayoutGrid, 
  List,
  ChevronDown,
  ChevronUp,
  X,
  PlusCircle,
  Paperclip,
  Clock,
  Repeat,
  Zap,
  Flame,
  CheckSquare,
  Square,
  Sparkles,
  ChevronRight,
  Download,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const TasksModule: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useApp();
  
  // States
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // all, active, completed, overdue
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'category' | 'title' | 'progress'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDueTime, setFormDueTime] = useState('12:00');
  const [formPriority, setFormPriority] = useState<Task['priority']>('medium');
  const [formCategory, setFormCategory] = useState('Work');
  const [formRecurring, setFormRecurring] = useState<Task['recurring']>('none');

  // Inline action states
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const categories = ['Work', 'Personal', 'Ideas', 'Fitness', 'Finance', 'Health'];

  // Priority helper mapping for sorting & icons
  const priorityWeight = {
    critical: 5,
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1
  };

  const getPriorityConfig = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-500 dark:bg-red-600 text-white font-extrabold shadow-sm shadow-red-500/20 animate-pulse',
          icon: <Flame className="w-3.5 h-3.5 stroke-[2.5]" />,
          label: 'Critical'
        };
      case 'urgent':
        return {
          bg: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450 border border-rose-200/60 dark:border-rose-900/60 font-bold',
          icon: <Zap className="w-3.5 h-3.5 stroke-[2.5]" />,
          label: 'Urgent'
        };
      case 'high':
        return {
          bg: 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-450 border border-orange-200/60 dark:border-orange-900/60 font-semibold',
          icon: <AlertCircle className="w-3.5 h-3.5 stroke-[2]" />,
          label: 'High'
        };
      case 'medium':
        return {
          bg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-450 border border-amber-200/60 dark:border-amber-900/60 font-semibold',
          icon: <AlertTriangle className="w-3.5 h-3.5 stroke-[2]" />,
          label: 'Medium'
        };
      case 'low':
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-850 font-medium',
          icon: <ChevronDown className="w-3.5 h-3.5 stroke-[2]" />,
          label: 'Low'
        };
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filters logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = !task.isCompleted;
    else if (statusFilter === 'completed') matchesStatus = task.isCompleted;
    else if (statusFilter === 'overdue') {
      matchesStatus = !task.isCompleted && task.dueDate < todayStr;
    }

    return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
  });

  // Sorting logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let result = 0;
    if (sortBy === 'dueDate') {
      result = a.dueDate.localeCompare(b.dueDate);
      if (result === 0 && a.dueTime && b.dueTime) {
        result = a.dueTime.localeCompare(b.dueTime);
      }
    } else if (sortBy === 'priority') {
      result = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    } else if (sortBy === 'category') {
      result = a.category.localeCompare(b.category);
    } else if (sortBy === 'title') {
      result = a.title.localeCompare(b.title);
    } else if (sortBy === 'progress') {
      result = (b.progress || 0) - (a.progress || 0);
    }
    return sortOrder === 'asc' ? result : -result;
  });

  const handleOpenAdd = () => {
    setFormTitle('');
    setFormDesc('');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormDueTime('12:00');
    setFormPriority('medium');
    setFormCategory('Work');
    setFormRecurring('none');
    setEditingTask(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormDueDate(task.dueDate);
    setFormDueTime(task.dueTime || '12:00');
    setFormPriority(task.priority);
    setFormCategory(task.category);
    setFormRecurring(task.recurring || 'none');
    setIsAddOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingTask) {
      updateTask({
        ...editingTask,
        title: formTitle,
        description: formDesc,
        dueDate: formDueDate,
        dueTime: formDueTime,
        priority: formPriority,
        category: formCategory,
        recurring: formRecurring,
      });
    } else {
      addTask({
        title: formTitle,
        description: formDesc,
        dueDate: formDueDate,
        dueTime: formDueTime,
        priority: formPriority,
        category: formCategory,
        recurring: formRecurring,
        isCompleted: false,
        subtasks: [],
        attachments: [],
        progress: 0,
      });
    }
    setIsAddOpen(false);
  };

  const toggleTaskExpand = (id: string) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  // Subtask Helpers
  const handleAddSubtask = (task: Task) => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: SubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      title: newSubtaskTitle.trim(),
      isCompleted: false
    };
    const subtasks = [...(task.subtasks || []), newSub];
    const completedCount = subtasks.filter(s => s.isCompleted).length;
    const progress = Math.round((completedCount / subtasks.length) * 100);

    updateTask({
      ...task,
      subtasks,
      progress
    });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (task: Task, subId: string) => {
    const subtasks = (task.subtasks || []).map(s => 
      s.id === subId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    const completedCount = subtasks.filter(s => s.isCompleted).length;
    const progress = Math.round((completedCount / subtasks.length) * 100);

    updateTask({
      ...task,
      subtasks,
      progress
    });
  };

  const handleDeleteSubtask = (task: Task, subId: string) => {
    const subtasks = (task.subtasks || []).filter(s => s.id !== subId);
    const progress = subtasks.length > 0 
      ? Math.round((subtasks.filter(s => s.isCompleted).length / subtasks.length) * 100) 
      : 0;

    updateTask({
      ...task,
      subtasks,
      progress
    });
  };

  // Attachment Simulation Helpers
  const handleAddAttachment = (task: Task) => {
    if (!attachmentName.trim()) return;
    const newAttach: Attachment = {
      id: `attach-${Date.now()}`,
      name: attachmentName.trim(),
      url: attachmentUrl.trim() || 'https://assets.tasko.ai/demo-file.pdf',
      size: '2.4 MB'
    };
    updateTask({
      ...task,
      attachments: [...(task.attachments || []), newAttach]
    });
    setAttachmentName('');
    setAttachmentUrl('');
  };

  const handleDeleteAttachment = (task: Task, attachId: string) => {
    updateTask({
      ...task,
      attachments: (task.attachments || []).filter(a => a.id !== attachId)
    });
  };

  // Handle simulated file uploads
  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>, task: Task) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fakeUrl = URL.createObjectURL(file);
    const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    
    const newAttach: Attachment = {
      id: `attach-${Date.now()}`,
      name: file.name,
      url: fakeUrl,
      size: sizeStr
    };

    updateTask({
      ...task,
      attachments: [...(task.attachments || []), newAttach]
    });
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Columns for Kanban
  const columns = [
    { id: 'todo', title: 'To Do', items: sortedTasks.filter(t => !t.isCompleted && t.dueDate >= todayStr) },
    { id: 'overdue', title: 'Overdue ⚠️', items: sortedTasks.filter(t => !t.isCompleted && t.dueDate < todayStr) },
    { id: 'completed', title: 'Completed ✓', items: sortedTasks.filter(t => t.isCompleted) }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-6"
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white">Workspace Backlog</h2>
          <p className="text-xs text-slate-400">Add, track, schedule, and organize key focus elements.</p>
        </div>
        <div className="flex items-center space-x-2">
          {/* View Toggles */}
          <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-1 flex border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-500' : 'text-slate-500'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-500' : 'text-slate-500'}`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/10 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Block */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search task titles, criteria or priorities..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Filtering selectors */}
          <div className="flex flex-wrap gap-2">
            {/* Priority filter */}
            <div className="relative">
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300"
              >
                <option value="all">Priority: All</option>
                <option value="critical">Critical ⚠️</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Category filter */}
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

            {/* Status filter */}
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none text-slate-700 dark:text-slate-300"
              >
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-850 text-2xs text-slate-400">
          <span className="font-mono uppercase font-bold text-slate-500">Sort By:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'dueDate', label: 'Due Date' },
              { id: 'priority', label: 'Priority' },
              { id: 'category', label: 'Category' },
              { id: 'title', label: 'Title' },
              { id: 'progress', label: 'Progress' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => toggleSort(f.id as any)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition-all ${
                  sortBy === f.id 
                    ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 text-indigo-600 dark:text-indigo-400 font-bold' 
                    : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600'
                }`}
              >
                <span>{f.label}</span>
                {sortBy === f.id && (
                  <ArrowUpDown className="w-3 h-3 text-indigo-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Task List/Board view */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
              <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No matching tasks found</p>
              <p className="text-2xs text-slate-400 max-w-xs mt-0.5">Change your search queries or add a brand-new task using the "Add Task" button.</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sortedTasks.map((task) => {
                const isOverdue = !task.isCompleted && task.dueDate < todayStr;
                const config = getPriorityConfig(task.priority);
                const isExpanded = expandedTaskId === task.id;
                
                // Calculate manual subtasks count
                const totalSubs = task.subtasks?.length || 0;
                const completedSubs = task.subtasks?.filter(s => s.isCompleted).length || 0;
                const progressVal = task.progress !== undefined ? task.progress : (task.isCompleted ? 100 : 0);

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={task.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all hover:shadow-sm ${
                      isExpanded 
                        ? 'border-indigo-500 ring-1 ring-indigo-500/20' 
                        : 'border-slate-150 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800'
                    }`}
                  >
                    {/* Primary Task Summary row */}
                    <div 
                      onClick={() => toggleTaskExpand(task.id)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center space-x-3.5 overflow-hidden flex-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTask({ ...task, isCompleted: !task.isCompleted });
                          }}
                          className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                            task.isCompleted 
                              ? 'bg-indigo-600 border-indigo-600 text-white' 
                              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500'
                          }`}
                        >
                          {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        
                        <div className="overflow-hidden flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`text-sm font-bold truncate text-slate-800 dark:text-slate-200 max-w-sm sm:max-w-md ${task.isCompleted ? 'line-through text-slate-400 dark:text-slate-500 font-medium' : ''}`}>
                              {task.title}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-3xs font-medium bg-slate-100 dark:bg-slate-800/60 text-slate-500">
                              {task.category}
                            </span>
                            {task.recurring && task.recurring !== 'none' && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-3xs font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                                <Repeat className="w-2.5 h-2.5" />
                                <span className="capitalize">{task.recurring}</span>
                              </span>
                            )}
                          </div>
                          <p className={`text-xs text-slate-400 dark:text-slate-500 truncate max-w-lg mt-1 ${task.isCompleted ? 'text-slate-300 dark:text-slate-600' : ''}`}>
                            {task.description || 'No description added'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-3.5 flex-shrink-0">
                        {/* Due Date & Time */}
                        <div className="flex items-center space-x-1.5 text-2xs text-slate-400 dark:text-slate-500 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={isOverdue ? 'text-rose-500 font-bold animate-pulse' : ''}>
                            {task.dueDate} {task.dueTime && `@ ${task.dueTime}`} {isOverdue && '(Overdue)'}
                          </span>
                        </div>

                        {/* Priority Badge */}
                        <span className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-3xs uppercase tracking-wider ${config.bg}`}>
                          {config.icon}
                          <span>{config.label}</span>
                        </span>

                        {/* Progress Indicator */}
                        {totalSubs > 0 && (
                          <span className="text-3xs text-indigo-500 font-mono font-bold">
                            {completedSubs}/{totalSubs} ({progressVal}%)
                          </span>
                        )}

                        <div className="flex items-center">
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable detailed drawer */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/30 rounded-b-2xl"
                        >
                          <div className="p-5 space-y-6">
                            {/* Description Block */}
                            {task.description && (
                              <div className="space-y-1.5">
                                <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Detailed Scope</h5>
                                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans max-w-3xl whitespace-pre-line">
                                  {task.description}
                                </p>
                              </div>
                            )}

                            {/* Subtask Panel */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Subtask Checklists</h5>
                                <span className="text-3xs text-slate-400 font-mono font-bold">
                                  Progress: {progressVal}% ({completedSubs} of {totalSubs} complete)
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressVal}%` }}
                                  className="h-full bg-indigo-500"
                                />
                              </div>

                              {/* Checklist Items */}
                              <div className="space-y-1.5 pt-1.5">
                                {task.subtasks?.map(sub => (
                                  <div 
                                    key={sub.id} 
                                    className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl"
                                  >
                                    <div className="flex items-center space-x-2.5">
                                      <button
                                        onClick={() => handleToggleSubtask(task, sub.id)}
                                        className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
                                          sub.isCompleted 
                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500'
                                        }`}
                                      >
                                        {sub.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                                      </button>
                                      <span className={`text-xs text-slate-700 dark:text-slate-300 ${sub.isCompleted ? 'line-through text-slate-400' : ''}`}>
                                        {sub.title}
                                      </span>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteSubtask(task, sub.id)}
                                      className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}

                                {/* Add subtask inline input */}
                                <div className="flex items-center gap-2 mt-2">
                                  <input 
                                    type="text"
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    placeholder="Add subtask item..."
                                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleAddSubtask(task);
                                    }}
                                  />
                                  <button
                                    onClick={() => handleAddSubtask(task)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Attachments Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100 dark:border-slate-850">
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Project Attachments</h5>
                                <div className="space-y-2">
                                  {(task.attachments || []).length === 0 ? (
                                    <p className="text-3xs text-slate-400 italic">No files attached to this task.</p>
                                  ) : (
                                    (task.attachments || []).map(file => (
                                      <div 
                                        key={file.id} 
                                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl text-xs text-slate-700 dark:text-slate-350"
                                      >
                                        <div className="flex items-center space-x-2 truncate">
                                          <Paperclip className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                          <span className="truncate text-2xs font-mono">{file.name}</span>
                                          {file.size && <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>}
                                        </div>
                                        <div className="flex items-center space-x-1.5">
                                          <a 
                                            href={file.url} 
                                            download={file.name}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500 transition-colors"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </a>
                                          <button 
                                            onClick={() => handleDeleteAttachment(task, file.id)}
                                            className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-rose-500 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>

                                {/* Drag-and-drop or simulated manual selector file uploads */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-3 pt-2">
                                  <label className="flex-1 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                                    <input 
                                      type="file"
                                      className="hidden"
                                      onChange={(e) => handleSimulatedUpload(e, task)}
                                    />
                                    <div className="flex items-center justify-center space-x-1.5 text-2xs text-slate-500">
                                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Upload Device File</span>
                                    </div>
                                  </label>
                                  
                                  <div className="flex items-center space-x-1.5 text-slate-400 text-2xs">Or link URL:</div>
                                  
                                  <div className="flex gap-1 flex-1">
                                    <input 
                                      type="text" 
                                      placeholder="File URL..."
                                      value={attachmentUrl}
                                      onChange={(e) => setAttachmentUrl(e.target.value)}
                                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2.5 py-1.5 rounded-xl text-xs focus:outline-none"
                                    />
                                    <input 
                                      type="text" 
                                      placeholder="Label..."
                                      value={attachmentName}
                                      onChange={(e) => setAttachmentName(e.target.value)}
                                      className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2.5 py-1.5 rounded-xl text-xs focus:outline-none"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddAttachment(task);
                                      }}
                                    />
                                    <button
                                      onClick={() => handleAddAttachment(task)}
                                      className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Task Metadata details */}
                              <div className="space-y-3 pl-0 md:pl-5 border-l-0 md:border-l border-slate-100 dark:border-slate-850">
                                <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">General Information</h5>
                                <div className="space-y-2.5 text-xs">
                                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                                    <span className="text-slate-400 font-mono">Date Scheduled</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{task.dueDate} {task.dueTime && `@ ${task.dueTime}`}</span>
                                  </div>
                                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                                    <span className="text-slate-400 font-mono">Priority Factor</span>
                                    <span className="font-bold capitalize text-slate-700 dark:text-slate-200">{task.priority}</span>
                                  </div>
                                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-850">
                                    <span className="text-slate-400 font-mono">Workstream</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{task.category}</span>
                                  </div>
                                  <div className="flex justify-between py-1">
                                    <span className="text-slate-400 font-mono">Completed</span>
                                    <span className={`font-bold ${task.isCompleted ? 'text-emerald-500' : 'text-slate-500'}`}>{task.isCompleted ? 'Finished ✓' : 'Active'}</span>
                                  </div>

                                  <div className="flex items-center space-x-2 pt-3">
                                    <button 
                                      onClick={() => handleOpenEdit(task)}
                                      className="flex-1 flex items-center justify-center space-x-1 border border-slate-200 dark:border-slate-800 py-1.5 rounded-xl font-bold hover:bg-slate-100 text-slate-600 dark:text-slate-350"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Edit Details</span>
                                    </button>
                                    <button 
                                      onClick={() => deleteTask(task.id)}
                                      className="flex-1 flex items-center justify-center space-x-1 border border-rose-200 dark:border-rose-950 py-1.5 rounded-xl font-bold hover:bg-rose-50 text-rose-500"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete Task</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      ) : (
        /* Board/Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {columns.map(column => (
            <div key={column.id} className="bg-slate-100/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-display">{column.title}</span>
                <span className="text-2xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-mono font-bold">
                  {column.items.length}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {column.items.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <p className="text-2xs text-slate-400">Empty column</p>
                  </div>
                ) : (
                  column.items.map(task => {
                    const config = getPriorityConfig(task.priority);
                    return (
                      <div 
                        key={task.id}
                        className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="px-1.5 py-0.5 rounded text-3xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {task.category}
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={(e) => handleOpenEdit(task, e)}
                              className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded transition-all"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <h5 className={`text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 truncate ${task.isCompleted ? 'line-through text-slate-400 dark:text-slate-500 font-medium' : ''}`}>
                          {task.title}
                        </h5>
                        <p className="text-3xs text-slate-400 dark:text-slate-500 line-clamp-2 mt-1">
                          {task.description || 'No description provided'}
                        </p>

                        {/* Progress slider if subtasks exist */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                              <span>Progress</span>
                              <span>{task.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${task.progress || 0}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2.5">
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {task.dueDate}
                          </span>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`flex items-center space-x-1 px-1.5 py-0.2 rounded text-[9px] ${config.bg}`}>
                              {config.icon}
                              <span>{config.label}</span>
                            </span>
                            <button 
                              onClick={() => updateTask({ ...task, isCompleted: !task.isCompleted })}
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                task.isCompleted 
                                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500'
                              }`}
                            >
                              {task.isCompleted && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Creation / Edit Modal popup */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Overlay background */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="fixed inset-0 bg-black"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsAddOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-600"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                <span>{editingTask ? 'Modify Focus Task' : 'Schedule Focus Task'}</span>
              </h3>
              <p className="text-2xs text-slate-400 mt-0.5 mb-5">
                {editingTask ? 'Revise details, due configurations and priority metadata.' : 'Add a brand-new focus item with advanced details, subtasks and recurrence options.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-200">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Title</label>
                  <input 
                    type="text" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    placeholder="e.g., Code user authentication layer"
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Description</label>
                  <textarea 
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={3}
                    placeholder="Detailed explanation, scope boundary and target milestones..."
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Due Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Due Date</label>
                    <input 
                      type="date" 
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white font-mono"
                    />
                  </div>

                  {/* Due Time */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Due Time</label>
                    <input 
                      type="time" 
                      value={formDueTime}
                      onChange={(e) => setFormDueTime(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Recurrence & Workstream */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Workstream Category</label>
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

                  {/* Recurrence Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Recurring Schedule</label>
                    <div className="relative">
                      <select 
                        value={formRecurring}
                        onChange={(e) => setFormRecurring(e.target.value as any)}
                        className="w-full appearance-none bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                      >
                        <option value="none">No Recurrence (None)</option>
                        <option value="daily">Daily Loop</option>
                        <option value="weekly">Weekly Loop</option>
                        <option value="monthly">Monthly Loop</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Five-Level Priority Selector buttons */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Task Urgency Factor</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: 'low', label: 'Low', colorClass: 'bg-slate-150 border-slate-300 dark:bg-slate-800 text-slate-500' },
                      { id: 'medium', label: 'Med', colorClass: 'bg-amber-500/10 border-amber-500 text-amber-500' },
                      { id: 'high', label: 'High', colorClass: 'bg-orange-500/10 border-orange-500 text-orange-500' },
                      { id: 'urgent', label: 'Urgent', colorClass: 'bg-rose-500/10 border-rose-500 text-rose-500' },
                      { id: 'critical', label: 'Crit', colorClass: 'bg-red-500 text-white border-red-600 shadow-sm' }
                    ].map(p => {
                      const isSelected = formPriority === p.id;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setFormPriority(p.id as any)}
                          className={`py-2 rounded-xl text-2xs font-extrabold border transition-all text-center ${
                            isSelected 
                              ? p.colorClass 
                              : 'bg-transparent border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subtasks initial list for editing if applicable */}
                {editingTask && (editingTask.subtasks || []).length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-850">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Checklist Items ({(editingTask.subtasks || []).length})</label>
                    <div className="max-h-28 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl">
                      {editingTask.subtasks?.map(sub => (
                        <div key={sub.id} className="flex justify-between items-center text-2xs">
                          <span className={sub.isCompleted ? 'line-through text-slate-400' : ''}>{sub.title}</span>
                          <span className="text-[9px] font-mono text-slate-400">{sub.isCompleted ? 'Checked' : 'Active'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 border border-slate-200 dark:border-slate-800 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/10 transition-all active:scale-95"
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
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

export default TasksModule;
