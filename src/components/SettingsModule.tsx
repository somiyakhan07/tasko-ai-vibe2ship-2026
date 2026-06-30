import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StorageService } from '../lib/storageService';
import { isFirebaseConfigured } from '../lib/firebase';
import { 
  Settings, 
  User, 
  Bell, 
  Trash2, 
  Download, 
  Upload, 
  Moon, 
  Sun, 
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Info,
  Cloud,
  CloudOff,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';

export const SettingsModule: React.FC = () => {
  const { 
    settings, 
    profile, 
    updateSettings, 
    updateProfile, 
    importUserData,
    firebaseUser,
    signInWithGoogle,
    signOutUser
  } = useApp();

  // Form states
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [email, setEmail] = useState(profile.email);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      displayName,
      email,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Export local backup file
  const handleExportBackup = () => {
    try {
      const dataStr = StorageService.exportUserData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `tasko-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error("Export backup failed", err);
    }
  };

  // Import local backup file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const success = importUserData(fileContent);
        if (success) {
          setImportStatus({ success: true, msg: "Backup file imported and restored successfully!" });
        } else {
          setImportStatus({ success: false, msg: "Failed to parse backup file. Please check file formatting." });
        }
      } catch (err) {
        setImportStatus({ success: false, msg: "An unexpected error occurred during import." });
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Reset database entirely
  const handleResetDatabase = () => {
    if (confirm("Are you absolutely sure you want to restore default values? All custom habits, tasks, and notes will be permanently deleted.")) {
      localStorage.clear();
      window.location.reload();
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
      <div>
        <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-800 dark:text-white">OS Configuration</h2>
        <p className="text-xs text-slate-400">Configure theme, account details, alerts, and backup data blocks.</p>
      </div>

      {/* Grid of settings items */}
      <div className="space-y-6">

        {/* Firebase Cloud Synchronization Section */}
        {isFirebaseConfigured && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <Cloud className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
              <span>Real-Time Cloud Sync</span>
            </h3>
            
            {firebaseUser ? (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white">Connected to Firebase</span>
                  </div>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 font-mono">
                    Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{firebaseUser.email}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={signOutUser}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl text-2xs font-bold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Sync</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Local-First / Offline Mode</span>
                  </div>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">
                    Connect your account to sync your notes, habits, tasks, and calendar events securely to the cloud.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/15 whitespace-nowrap active:scale-95"
                >
                  <span>Connect Google Account</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Account Details Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-indigo-500" />
            <span>Profile Credentials</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Full Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-3xs text-slate-400">Your email maps direct achievements locally.</p>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
              >
                Save Details
              </button>
            </div>
          </form>

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-2 text-emerald-600 text-2xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Display credentials updated successfully!</span>
            </div>
          )}
        </div>

        {/* Global UI settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-indigo-500" />
            <span>Preferences Configuration</span>
          </h3>

          <div className="space-y-3.5">
            {/* Theme switcher */}
            <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-900 last:border-b-0">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">System Theme</h4>
                <p className="text-3xs text-slate-400">Select your active aesthetic view mode.</p>
              </div>
              <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-850">
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold transition-all ${
                    settings.theme === 'light' 
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold transition-all ${
                    settings.theme === 'dark' 
                      ? 'bg-white dark:bg-slate-800 text-indigo-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Notifications toggle */}
            <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-900 last:border-b-0">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">In-App Notifications</h4>
                <p className="text-3xs text-slate-400">Enable banner alerts, streaks triggers, and deadline notices.</p>
              </div>
              <button
                onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  settings.notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 left-1 transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-5' : ''
                }`} />
              </button>
            </div>

            {/* Offline-First info display */}
            <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-900 last:border-b-0">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Offline Fallback Syncing</h4>
                <p className="text-3xs text-slate-400">Maintains data in localStorage for zero-latency, offline focus sessions.</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-3xs font-extrabold uppercase font-mono tracking-wider">
                Active (Local)
              </span>
            </div>
          </div>
        </div>

        {/* Database Backups manager */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <FileCode className="w-4.5 h-4.5 text-indigo-500" />
            <span>Local Backup & Sync Manager</span>
          </h3>
          <p className="text-2xs text-slate-400">
            Download your local productivity database as a `.json` backup file, or upload a backup file to restore historic tasks, habits, and notes logs instantly!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Download backup Button */}
            <button
              onClick={handleExportBackup}
              className="flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 p-4 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-350 transition-colors"
            >
              <Download className="w-4.5 h-4.5 text-indigo-500 animate-pulse" />
              <span>Export local JSON backup</span>
            </button>

            {/* Upload backup button */}
            <div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImportBackup}
                accept=".json"
                className="hidden" 
              />
              <button
                onClick={triggerFileInput}
                className="w-full flex items-center justify-center space-x-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 p-4 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-350 transition-colors"
              >
                <Upload className="w-4.5 h-4.5 text-indigo-500" />
                <span>Import JSON backup</span>
              </button>
            </div>
          </div>

          {importStatus && (
            <div className={`p-3 rounded-xl flex items-center space-x-2 text-2xs font-semibold border ${
              importStatus.success 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
            }`}>
              {importStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{importStatus.msg}</span>
            </div>
          )}
        </div>

        {/* Severe Destructive Reset */}
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-display font-bold text-sm text-rose-500 flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 animate-bounce" style={{ animationDuration: '3s' }} />
            <span>Danger Zone Reset</span>
          </h3>
          <p className="text-2xs text-rose-500/80">
            This action wipes your entire local storage database and restores all default template seed values. This process is irreversible.
          </p>
          <button
            onClick={handleResetDatabase}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-lg shadow-rose-500/10"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Local Database</span>
          </button>
        </div>

      </div>
    </motion.div>
  );
};
export default SettingsModule;
