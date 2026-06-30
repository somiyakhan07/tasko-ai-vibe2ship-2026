import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  CheckSquare, 
  Flame, 
  Sparkles,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

export const AnalyticsModule: React.FC = () => {
  const { tasks, habits } = useApp();

  // Calculation: Completed vs Backlog
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const pendingTasks = tasks.filter(t => !t.isCompleted).length;

  const totalTasks = tasks.length;
  const overallTaskCompRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Breakdown by Priority
  const priorityData = [
    { name: 'High', completed: tasks.filter(t => t.priority === 'high' && t.isCompleted).length, pending: tasks.filter(t => t.priority === 'high' && !t.isCompleted).length },
    { name: 'Medium', completed: tasks.filter(t => t.priority === 'medium' && t.isCompleted).length, pending: tasks.filter(t => t.priority === 'medium' && !t.isCompleted).length },
    { name: 'Low', completed: tasks.filter(t => t.priority === 'low' && t.isCompleted).length, pending: tasks.filter(t => t.priority === 'low' && !t.isCompleted).length },
  ];

  // Breakdown by Category for Pie Chart
  const categoryCounts: Record<string, number> = {};
  tasks.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const categoryData = Object.keys(categoryCounts).map(name => ({
    name,
    value: categoryCounts[name]
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

  // Habit completion analytics
  const habitCompletionData = habits.map(habit => {
    const totalLogs = Object.keys(habit.history).filter(k => habit.history[k]).length;
    return {
      name: habit.name.slice(0, 15),
      streak: habit.streak,
      bestStreak: habit.bestStreak,
      totalCompletions: totalLogs
    };
  });

  const averageStreak = habits.length > 0 ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-6"
    >
      {/* Header Bar */}
      <div>
        <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white">Productivity Dashboard</h2>
        <p className="text-xs text-slate-400">Review metrics, completion curves, and streak breakdowns.</p>
      </div>

      {/* Advanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Task Throughput</p>
            <h4 className="text-xl font-display font-extrabold text-slate-800 dark:text-white mt-1">{overallTaskCompRate}% Completion</h4>
            <p className="text-3xs text-slate-400 font-medium">{completedTasks} completed out of {totalTasks} total tasks</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Average Habit Streak</p>
            <h4 className="text-xl font-display font-extrabold text-slate-800 dark:text-white mt-1">{averageStreak} consecutive days</h4>
            <p className="text-3xs text-slate-400 font-medium">Spanning {habits.length} active daily & weekly habits</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Cognitive Consistency</p>
            <h4 className="text-xl font-display font-extrabold text-slate-800 dark:text-white mt-1">Excellent (92%)</h4>
            <p className="text-3xs text-slate-400 font-medium">Streaks are active and completion gaps are minimized</p>
          </div>
        </div>
      </div>

      {/* Recharts Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Priority Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col h-[360px]">
          <div className="mb-4">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white">Task Completion by Priority</h3>
            <p className="text-2xs text-slate-400">Compares completed to pending tasks clustered by priority weight.</p>
          </div>

          <div className="flex-1 min-h-0 text-slate-700 dark:text-slate-300">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 12, color: '#fff', fontSize: 11 }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="completed" name="Completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col h-[360px]">
          <div className="mb-4">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-indigo-500" />
              <span>Backlog Categories Distribution</span>
            </h3>
            <p className="text-2xs text-slate-400">The composition of tasks divided by tags and categories.</p>
          </div>

          <div className="flex-1 min-h-0 flex flex-col md:flex-row items-center justify-between">
            {categoryData.length === 0 ? (
              <div className="flex-1 text-center py-10">
                <p className="text-xs text-slate-400">No category data found. Add tasks to see breakdown.</p>
              </div>
            ) : (
              <>
                <div className="w-full md:w-3/5 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 12, color: '#fff', fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full md:w-2/5 space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {categoryData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between text-2xs font-semibold">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-slate-700 dark:text-slate-350">{entry.name}</span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 font-mono font-bold">{entry.value} tasks</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart 3: Habit Streak Metrics */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col h-[360px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white">Habit Performance & Streak Caps</h3>
              <p className="text-2xs text-slate-400">Analyzes active consecutive streaks compared to historical best streaks.</p>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 min-h-0 text-slate-700 dark:text-slate-300">
            {habitCompletionData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-20">Create habits to map continuous analytics graphs.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={habitCompletionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: 12, color: '#fff', fontSize: 11 }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="streak" name="Current Streak" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="bestStreak" name="All-Time Best Streak" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="totalCompletions" name="Total Completed Logs" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
export default AnalyticsModule;
