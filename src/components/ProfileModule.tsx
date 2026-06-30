import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Award, 
  CheckSquare, 
  Flame, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  User, 
  Briefcase,
  Trophy,
  Activity,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';

export const ProfileModule: React.FC = () => {
  const { profile, tasks, habits, notes, updateProfile } = useApp();

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.isCompleted).length;
  const totalNotesCount = notes.length;
  
  // Count total habit completion logs
  let totalHabitLogs = 0;
  habits.forEach(h => {
    totalHabitLogs += Object.keys(h.history).filter(k => h.history[k]).length;
  });

  const bestStreak = habits.reduce((max, h) => h.streak > max ? h.streak : max, 0);

  // Avatar Options
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', // Default somiya khan portrait
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  ];

  // Dynamically checked achievements
  const achievements = [
    {
      id: 'ach-1',
      title: 'First Venture',
      desc: 'Log at least one task completion.',
      isUnlocked: completedTasksCount >= 1,
      icon: CheckSquare,
      color: '#6366f1'
    },
    {
      id: 'ach-2',
      title: 'Backlog Warden',
      desc: 'Create and map at least 3 custom tasks.',
      isUnlocked: totalTasksCount >= 3,
      icon: Briefcase,
      color: '#3b82f6'
    },
    {
      id: 'ach-3',
      title: 'Habit Maestro',
      desc: 'Reach a consecutive streak of 5 days on any habit.',
      isUnlocked: bestStreak >= 5,
      icon: Flame,
      color: '#f59e0b'
    },
    {
      id: 'ach-4',
      title: 'Archivist Master',
      desc: 'Compose and save at least 2 notes.',
      isUnlocked: totalNotesCount >= 2,
      icon: FileText,
      color: '#10b981'
    },
    {
      id: 'ach-5',
      title: 'Unstoppable Momentum',
      desc: 'Log a total of 10 cumulative habit completions.',
      isUnlocked: totalHabitLogs >= 10,
      icon: Trophy,
      color: '#8b5cf6'
    }
  ];

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto p-4 md:p-8 space-y-6"
    >
      {/* Upper Profile Banner card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="relative group shrink-0">
          <img 
            src={profile.photoURL} 
            alt={profile.displayName} 
            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-slate-800 ring-4 ring-indigo-500/30"
          />
        </div>

        <div className="text-center md:text-left flex-1 space-y-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h3 className="font-display font-extrabold text-xl md:text-2xl">{profile.displayName}</h3>
            <span className="bg-indigo-600/60 text-indigo-200 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-4xs font-bold uppercase tracking-wider self-center md:self-auto">
              PRO ACCOUNT
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-wide">{profile.email}</p>
          <p className="text-3xs text-slate-500 italic mt-1">Joined Tasko AI: {new Date(profile.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Select Avatar illustration section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3.5">
        <h4 className="font-display font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Select Persona Avatar</h4>
        <p className="text-2xs text-slate-400">Instantly switch up your visual dashboard avatar below.</p>
        <div className="flex items-center gap-3 pt-2">
          {avatars.map((url) => {
            const isSelected = profile.photoURL === url;
            return (
              <button
                key={url}
                onClick={() => updateProfile({ photoURL: url })}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden transition-all duration-200 border-2 relative shrink-0 active:scale-95 ${
                  isSelected ? 'border-indigo-600 scale-110 shadow-md ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={url} alt="User Avatar Option" className="w-full h-full object-cover" />
                {isSelected && (
                  <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white fill-indigo-600" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Statistics Columns */}
      <div className="grid grid-cols-3 gap-4">
        {/* Stat 1 */}
        <div className="bg-slate-50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-900/60 rounded-2xl text-center">
          <p className="text-3xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Tasks Logged</p>
          <p className="text-lg md:text-xl font-display font-extrabold text-slate-800 dark:text-white mt-1">{completedTasksCount}/{totalTasksCount}</p>
        </div>

        {/* Stat 2 */}
        <div className="bg-slate-50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-900/60 rounded-2xl text-center">
          <p className="text-3xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Habits Tracked</p>
          <p className="text-lg md:text-xl font-display font-extrabold text-slate-800 dark:text-white mt-1">{totalHabitLogs} logs</p>
        </div>

        {/* Stat 3 */}
        <div className="bg-slate-50 dark:bg-slate-950/20 p-4 border border-slate-100 dark:border-slate-900/60 rounded-2xl text-center">
          <p className="text-3xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Notes Authored</p>
          <p className="text-lg md:text-xl font-display font-extrabold text-slate-800 dark:text-white mt-1">{totalNotesCount} notes</p>
        </div>
      </div>

      {/* Achievements Milestones */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-display font-bold text-sm text-slate-800 dark:text-white">Continuous Milestones ({unlockedCount}/{achievements.length})</h4>
            <p className="text-2xs text-slate-400 mt-0.5">Unlocked dynamically based on real-time task backlog completions.</p>
          </div>
          <Award className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
        </div>

        <div className="space-y-3">
          {achievements.map(ach => {
            const IconComp = ach.icon;
            return (
              <div 
                key={ach.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  ach.isUnlocked 
                    ? 'bg-slate-50/60 dark:bg-slate-950/30 border-slate-150 dark:border-slate-850' 
                    : 'bg-transparent border-slate-100 dark:border-slate-900 opacity-50'
                }`}
              >
                <div className="flex items-center space-x-3.5 overflow-hidden">
                  <div 
                    className="p-2 rounded-xl text-white flex-shrink-0"
                    style={{ backgroundColor: ach.isUnlocked ? ach.color : '#94a3b8' }}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h5 className={`text-xs font-bold truncate ${ach.isUnlocked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                      {ach.title}
                    </h5>
                    <p className="text-3xs text-slate-400 truncate mt-0.5">{ach.desc}</p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {ach.isUnlocked ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
export default ProfileModule;
