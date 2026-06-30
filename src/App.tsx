import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { HomeDashboard } from './components/HomeDashboard';
import { TasksModule } from './components/TasksModule';
import { CalendarModule } from './components/CalendarModule';
import { NotesModule } from './components/NotesModule';
import { HabitsModule } from './components/HabitsModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { NotificationsModule } from './components/NotificationsModule';
import { ProfileModule } from './components/ProfileModule';
import { SettingsModule } from './components/SettingsModule';
import { AICompanionModule } from './components/AICompanionModule';
import { AlertCircle, Loader2 } from 'lucide-react';

function AppContent() {
  const { activeTab, loading, error } = useApp();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-900 dark:bg-slate-950 flex flex-col items-center justify-center space-y-3.5 text-white">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs font-bold font-mono tracking-wider text-slate-450 uppercase">Loading Tasko AI...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-slate-900 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
        <h3 className="font-display font-extrabold text-lg">System Initialization Failed</h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{error}</p>
        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all"
        >
          Reset Application Data
        </button>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HomeDashboard />;
      case 'ai_companion':
        return <AICompanionModule />;
      case 'tasks':
        return <TasksModule />;
      case 'calendar':
        return <CalendarModule />;
      case 'notes':
        return <NotesModule />;
      case 'habits':
        return <HabitsModule />;
      case 'analytics':
        return <AnalyticsModule />;
      case 'notifications':
        return <NotificationsModule />;
      case 'profile':
        return <ProfileModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <HomeDashboard />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Permanent or mobile sidebar */}
      <Sidebar />
      
      {/* Scrollable primary focus module screen */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative">
        <div className="h-full w-full">
          {renderActiveTab()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
