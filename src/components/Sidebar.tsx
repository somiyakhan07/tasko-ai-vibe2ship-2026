import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  FileText, 
  Flame, 
  BarChart3, 
  Bell, 
  User, 
  Settings as SettingsIcon,
  Moon, 
  Sun,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, settings, updateSettings, notifications, profile } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai_companion', label: 'AI Companion', icon: Sparkles },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badgeCount: notifications.filter(n => !n.isRead).length },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const currentItem = menuItems.find(item => item.id === activeTab);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 w-full transition-colors duration-300">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <span className="font-display font-bold text-lg text-slate-800 dark:text-white tracking-tight">Tasko AI</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleTheme} 
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-all"
            aria-label="Toggle theme"
          >
            {settings.theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (Permanent Sidebar) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 transition-colors duration-300 select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xl tracking-tight text-slate-800 dark:text-white">Tasko AI</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Productivity OS</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 hover:bg-indigo-700' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-900/50 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-bold leading-none ${isActive ? 'bg-indigo-800 text-white' : 'bg-rose-500 text-white'}`}>
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions / Profile Indicator */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={profile.photoURL} 
                alt={profile.displayName} 
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-800"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{profile.displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{profile.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-900/50">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">Theme</span>
            <button 
              onClick={toggleTheme}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-900 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
              title="Toggle system theme"
            >
              {settings.theme === 'dark' ? (
                <div className="flex items-center space-x-1">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-slate-400">Light</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-medium text-slate-600">Dark</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-xs bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col z-50 py-4"
            >
              <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-display font-bold text-lg text-slate-800 dark:text-white">Tasko AI</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-950 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-4.5 h-4.5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badgeCount !== undefined && item.badgeCount > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold leading-none ${isActive ? 'bg-indigo-800 text-white' : 'bg-rose-500 text-white'}`}>
                          {item.badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30">
                <div className="flex items-center space-x-3">
                  <img 
                    src={profile.photoURL} 
                    alt={profile.displayName} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{profile.displayName}</p>
                    <p className="text-2xs text-slate-400">{profile.email}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
export default Sidebar;
