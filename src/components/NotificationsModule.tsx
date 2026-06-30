import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bell, 
  Check, 
  Trash2, 
  Sparkles, 
  Flame, 
  CheckSquare, 
  Calendar,
  AlertCircle,
  BellOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationsModule: React.FC = () => {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    clearNotifications 
  } = useApp();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckSquare className="w-4 h-4 text-indigo-500" />;
      case 'habit': return <Flame className="w-4 h-4 text-amber-500 animate-bounce" style={{ animationDuration: '3s' }} />;
      case 'calendar': return <Calendar className="w-4 h-4 text-emerald-500" />;
      default: return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto p-4 md:p-8 space-y-6"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white">Alert Log</h2>
          <p className="text-xs text-slate-400">Track deadlines, consecutive habit milestones, and system updates.</p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={markAllNotificationsRead}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-xl text-2xs font-extrabold transition-all"
            >
              Mark all read
            </button>
            <button
              onClick={clearNotifications}
              className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-500 rounded-xl transition-all"
              title="Clear all alerts"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Alerts Feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <BellOff className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">All caught up!</p>
            <p className="text-2xs text-slate-400 max-w-xs mx-auto mt-0.5">Your alert board is completely clean. No pending reminders or habit prompts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {notifications.map((notif) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={notif.id}
                  className={`p-4 rounded-2xl flex items-start justify-between gap-4 border transition-all ${
                    notif.isRead 
                      ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900/60 opacity-75' 
                      : 'bg-indigo-50/40 dark:bg-indigo-950/10 border-indigo-100/70 dark:border-indigo-950 shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-3.5 overflow-hidden">
                    {/* Badge Icon */}
                    <div className="p-2 bg-white dark:bg-slate-950 rounded-xl shadow-inner border border-slate-100 dark:border-slate-900 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    
                    <div className="overflow-hidden">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{notif.title}</h4>
                        {!notif.isRead && (
                          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full flex-shrink-0 animate-ping" />
                        )}
                      </div>
                      <p className="text-2xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                        {notif.content}
                      </p>
                      <span className="text-[9px] font-mono font-medium text-slate-400 block mt-2.5">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={() => markNotificationRead(notif.id)}
                      className="p-1.5 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-900 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg shadow-sm transition-all flex-shrink-0 hover:scale-105"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default NotificationsModule;
