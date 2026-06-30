import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Send, 
  Copy, 
  RefreshCw, 
  X, 
  Check, 
  MessageSquare, 
  Bot, 
  User as UserIcon, 
  Calendar, 
  CheckSquare, 
  Flame, 
  Lightbulb, 
  Compass,
  CornerDownLeft,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProposalCardProps {
  msgId: string;
  actionProposal: {
    type: 'proposeCreateTask' | 'proposeCreateEvent' | 'proposeCreateNote' | 'proposeCreateHabit';
    data: any;
    status?: 'pending' | 'confirmed' | 'cancelled';
  };
  updateMessageActionStatus: (chatId: string, messageId: string, status: 'pending' | 'confirmed' | 'cancelled', updatedData?: any) => void;
  activeChatId: string;
  addTask: (task: any) => Promise<void>;
  addEvent: (event: any) => Promise<void>;
  addNote: (note: any) => Promise<string>;
  addHabit: (habit: any) => Promise<void>;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  msgId,
  actionProposal,
  updateMessageActionStatus,
  activeChatId,
  addTask,
  addEvent,
  addNote,
  addHabit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...actionProposal.data });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({ ...actionProposal.data });
  }, [actionProposal.data]);

  const status = actionProposal.status || 'pending';

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      if (actionProposal.type === 'proposeCreateTask') {
        await addTask({
          title: formData.title || 'Untitled Task',
          dueDate: formData.dueDate || '',
          priority: formData.priority || 'medium',
          category: formData.category || 'General',
          description: formData.description || '',
          isCompleted: false
        });
      } else if (actionProposal.type === 'proposeCreateEvent') {
        await addEvent({
          title: formData.title || 'Untitled Event',
          date: formData.date || new Date().toISOString().split('T')[0],
          startTime: formData.startTime || '12:00',
          endTime: formData.endTime || '13:00',
          category: formData.category || 'Personal',
          description: formData.description || '',
          color: '#4f46e5'
        });
      } else if (actionProposal.type === 'proposeCreateNote') {
        await addNote({
          title: formData.title || 'Untitled Note',
          content: formData.content || '',
          category: formData.category || 'General',
          isPinned: false,
          tags: []
        });
      } else if (actionProposal.type === 'proposeCreateHabit') {
        await addHabit({
          name: formData.name || 'Untitled Habit',
          description: formData.description || '',
          frequency: formData.frequency || 'daily',
          category: formData.category || 'General',
          reminderTime: formData.reminderTime || ''
        });
      }
      updateMessageActionStatus(activeChatId, msgId, 'confirmed', formData);
    } catch (err: any) {
      console.error("Failed to confirm action:", err);
      let errMsg = "An error occurred while saving the item.";
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            errMsg = parsed.error;
          }
        } catch (_) {
          errMsg = err.message;
        }
      }
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    updateMessageActionStatus(activeChatId, msgId, 'cancelled');
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    updateMessageActionStatus(activeChatId, msgId, 'pending', formData);
  };

  if (status === 'confirmed') {
    return (
      <div id={`confirmed-proposal-${msgId}`} className="mt-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl flex items-start space-x-2.5 text-xs w-full">
        <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
          <Check className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-emerald-800 dark:text-emerald-400">Successfully Created!</div>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 font-mono text-[11px]">
            {actionProposal.type === 'proposeCreateTask' && `Task: ${formData.title}`}
            {actionProposal.type === 'proposeCreateEvent' && `Event: ${formData.title} (${formData.date} at ${formData.startTime})`}
            {actionProposal.type === 'proposeCreateNote' && `Note: ${formData.title}`}
            {actionProposal.type === 'proposeCreateHabit' && `Habit: ${formData.name}`}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div id={`cancelled-proposal-${msgId}`} className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 rounded-xl flex items-center space-x-2 text-xs text-slate-400 dark:text-slate-500 w-full">
        <X className="w-4 h-4" />
        <span>Draft discarded</span>
      </div>
    );
  }

  return (
    <div id={`proposal-${msgId}`} className="mt-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm w-full">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
          {actionProposal.type === 'proposeCreateTask' && (
            <>
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Draft Task</span>
            </>
          )}
          {actionProposal.type === 'proposeCreateEvent' && (
            <>
              <Calendar className="w-3.5 h-3.5" />
              <span>Draft Calendar Event</span>
            </>
          )}
          {actionProposal.type === 'proposeCreateNote' && (
            <>
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Draft Note</span>
            </>
          )}
          {actionProposal.type === 'proposeCreateHabit' && (
            <>
              <Flame className="w-3.5 h-3.5" />
              <span>Draft Habit</span>
            </>
          )}
        </div>
        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider scale-90">
          Requires Confirmation
        </span>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-3">
        {isEditing ? (
          <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            {/* Title / Name */}
            <div>
              <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1 font-sans">
                {actionProposal.type === 'proposeCreateHabit' ? 'Habit Name' : 'Title'}
              </label>
              <input
                type="text"
                value={(actionProposal.type === 'proposeCreateHabit' ? formData.name : formData.title) || ''}
                onChange={(e) => {
                  if (actionProposal.type === 'proposeCreateHabit') {
                    setFormData({ ...formData, name: e.target.value });
                  } else {
                    setFormData({ ...formData, title: e.target.value });
                  }
                }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Task Fields */}
            {actionProposal.type === 'proposeCreateTask' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Priority</label>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e: any) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            )}

            {/* Event Fields */}
            {actionProposal.type === 'proposeCreateEvent' && (
              <>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime || ''}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.endTime || ''}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Habit Fields */}
            {actionProposal.type === 'proposeCreateHabit' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Frequency</label>
                  <select
                    value={formData.frequency || 'daily'}
                    onChange={(e: any) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Reminder Time</label>
                  <input
                    type="time"
                    value={formData.reminderTime || ''}
                    onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Category / Description */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Work, Study..."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                />
              </div>
              {actionProposal.type !== 'proposeCreateNote' && (
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Note Content */}
            {actionProposal.type === 'proposeCreateNote' && (
              <div>
                <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Note Content</label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>
            )}

            <div className="flex justify-end space-x-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
              >
                Discard
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="font-semibold text-slate-900 dark:text-white text-sm">
              {actionProposal.type === 'proposeCreateHabit' ? formData.name : (formData.title || 'Untitled')}
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
              {formData.category && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                  {formData.category}
                </span>
              )}

              {actionProposal.type === 'proposeCreateTask' && (
                <>
                  {formData.dueDate && (
                    <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 rounded-full text-[10px] text-rose-600 dark:text-rose-400 font-medium font-sans">
                      Due: {formData.dueDate}
                    </span>
                  )}
                  {formData.priority && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase font-sans ${
                      formData.priority === 'high' 
                        ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' 
                        : formData.priority === 'medium'
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {formData.priority}
                    </span>
                  )}
                </>
              )}

              {actionProposal.type === 'proposeCreateEvent' && (
                <>
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-full text-[10px] text-indigo-600 dark:text-indigo-400 font-medium font-sans">
                    {formData.date}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] text-slate-500 dark:text-slate-400 font-medium font-sans">
                    {formData.startTime} - {formData.endTime || '1 Hour'}
                  </span>
                </>
              )}

              {actionProposal.type === 'proposeCreateHabit' && (
                <>
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-full text-[10px] text-indigo-600 dark:text-indigo-400 font-medium capitalize font-sans">
                    {formData.frequency || 'daily'}
                  </span>
                  {formData.reminderTime && (
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] text-slate-500 dark:text-slate-400 font-medium font-sans">
                      Reminder: {formData.reminderTime}
                    </span>
                  )}
                </>
              )}
            </div>

            {actionProposal.type === 'proposeCreateNote' && formData.content && (
              <p className="text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-2.5 rounded-lg whitespace-pre-line text-[11px] leading-relaxed max-h-36 overflow-y-auto">
                {formData.content}
              </p>
            )}

            {actionProposal.type !== 'proposeCreateNote' && formData.description && (
              <p className="text-slate-400 dark:text-slate-500 text-[11px] italic">
                "{formData.description}"
              </p>
            )}

            {error && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 rounded-lg text-red-600 dark:text-red-400 text-xs flex items-start space-x-1.5 font-sans leading-normal">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50">
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>

              <div className="flex space-x-1.5">
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center space-x-1 transition disabled:opacity-50"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm shadow-indigo-600/10 flex items-center space-x-1 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AICompanionModule: React.FC = () => {
  const { 
    chats, 
    activeChatId, 
    setActiveChatId, 
    createChat, 
    deleteChat, 
    renameChat, 
    clearChat, 
    clearAllChats, 
    addMessageToChat, 
    updateMessageActionStatus,
    regenerateResponse,
    profile,
    addTask,
    addEvent,
    addNote,
    addHabit
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isThinking]);

  // Set active chat automatically on mount if none selected
  useEffect(() => {
    if (chats.length > 0 && !activeChatId) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId, setActiveChatId]);

  // Suggested prompts
  const suggestedPrompts = [
    { text: "What tasks are on my list today?", icon: CheckSquare, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { text: "What is my calendar schedule?", icon: Calendar, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    { text: "Summarize my ideas and notes", icon: Lightbulb, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    { text: "Suggest a routine based on my habits", icon: Flame, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" }
  ];

  const handleSend = async (textToSend?: string) => {
    const finalMessage = (textToSend || inputMessage).trim();
    if (!finalMessage || isThinking) return;

    setInputMessage('');
    setIsThinking(true);

    let currentId = activeChatId;
    if (!currentId) {
      currentId = createChat();
    }

    try {
      await addMessageToChat(currentId, 'user', finalMessage);
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
      // Refocus input
      setTimeout(() => textInputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleStartRename = (id: string, title: string) => {
    setEditingChatId(id);
    setEditTitleValue(title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitleValue.trim()) {
      renameChat(id, editTitleValue.trim());
    }
    setEditingChatId(null);
  };

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div id="ai-companion-module" className="flex h-full w-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Chats Sidebar - Conversation History */}
      <aside className="hidden lg:flex flex-col w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-display font-bold text-slate-900 dark:text-white">AI Companion</h2>
            </div>
            <button 
              onClick={() => createChat()}
              className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search conversation history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-0 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Chats History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <AnimatePresence initial={false}>
            {filteredChats.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                No chats found
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isActive = chat.id === activeChatId;
                const isEditing = chat.id === editingChatId;
                return (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-200/60 dark:bg-slate-900 text-slate-900 dark:text-white' 
                        : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/30'
                    }`}
                    onClick={() => !isEditing && setActiveChatId(chat.id)}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          onBlur={() => handleSaveRename(chat.id)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveRename(chat.id)}
                          className="bg-white dark:bg-slate-800 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white w-full outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-xs font-medium truncate pr-2">
                          {chat.title}
                        </span>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1.5 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(chat.id, chat.title);
                          }}
                          className="p-1 hover:bg-slate-300 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          title="Rename Chat"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-between">
          <button
            onClick={() => {
              if(window.confirm("Are you sure you want to delete all chat history? This cannot be undone.")) {
                clearAllChats();
              }
            }}
            className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 text-2xs font-semibold uppercase tracking-wider text-rose-500 hover:bg-rose-500/5 rounded-lg border border-rose-500/15 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Chats</span>
          </button>
        </div>
      </aside>

      {/* Main Conversation Screen */}
      <section className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
        {/* Chat Screen Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Mobile History Drawer trigger */}
            <div className="lg:hidden p-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-650 dark:text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            
            <div className="min-w-0">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm truncate flex items-center space-x-1.5">
                <span>{activeChat ? activeChat.title : 'Tasko Companion'}</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {activeChat ? `${activeChat.messages.length} messages` : 'Google Gemini 3.5 Flash'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {activeChat && (
              <>
                <button
                  onClick={() => clearChat(activeChat.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-xs font-semibold flex items-center space-x-1"
                  title="Clear conversation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
                <button
                  onClick={() => deleteChat(activeChat.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button 
              onClick={() => createChat()}
              className="lg:hidden p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-1 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Conversation Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20">
          {!activeChat || activeChat.messages.length === 0 ? (
            /* Blank Conversation / Suggested Prompts layout */
            <div className="h-full flex flex-col justify-center items-center max-w-2xl mx-auto space-y-8 py-10">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-3"
              >
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/20">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h1 className="font-display font-extrabold text-xl md:text-2xl text-slate-800 dark:text-white tracking-tight">
                  Meet Your AI Companion
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                  Hi Somiya, I'm fully synchronized with your Tasks, Calendar, Notes, and Habits! Ask me anything to help orchestrate your day beautifully.
                </p>
              </motion.div>

              {/* Suggestions Grid */}
              <div className="w-full space-y-3">
                <div className="flex items-center space-x-1.5 text-slate-450 text-2xs font-bold uppercase tracking-wider">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Suggested Prompts</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  {suggestedPrompts.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        onClick={() => handleSend(prompt.text)}
                        className="flex items-start text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 hover:shadow-sm dark:hover:bg-slate-900/60 transition-all group"
                      >
                        <div className={`p-2 rounded-lg flex-shrink-0 mr-3 ${prompt.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 pr-2 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {prompt.text}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Query current context
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Message Thread */
            <div className="max-w-3xl mx-auto space-y-6">
              {activeChat.messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex items-start space-x-3.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                      isUser 
                        ? 'bg-indigo-600' 
                        : 'bg-gradient-to-tr from-violet-600 to-indigo-500'
                    }`}>
                      {isUser ? (
                        <img 
                          src={profile.photoURL} 
                          alt="Me" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>

                    {/* Message Bubble container */}
                    <div className={`flex flex-col max-w-[85%] space-y-1 ${isUser ? 'items-end' : ''}`}>
                      <div className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                        isUser 
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm shadow-indigo-600/10' 
                          : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-800 shadow-sm'
                      }`}>
                        {/* Render simple format with preserves whitespace/paragraphs */}
                        <div className="markdown-body select-text">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>

                      {/* Proposal confirmation card for action suggestions */}
                      {!isUser && msg.actionProposal && (
                        <ProposalCard
                          msgId={msg.id}
                          actionProposal={msg.actionProposal}
                          updateMessageActionStatus={updateMessageActionStatus}
                          activeChatId={activeChat.id}
                          addTask={addTask}
                          addEvent={addEvent}
                          addNote={addNote}
                          addHabit={addHabit}
                        />
                      )}

                      {/* Message Actions */}
                      <div className="flex items-center space-x-2 px-1 text-[10px] text-slate-400 font-mono">
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-0.5"
                          title="Copy message content"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        {!isUser && index === activeChat.messages.length - 1 && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => {
                                setIsThinking(true);
                                regenerateResponse(activeChat.id).finally(() => setIsThinking(false));
                              }}
                              className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center space-x-0.5"
                              title="Regenerate message"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Regenerate</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Thinking / Typing indicator */}
              {isThinking && (
                <div className="flex items-start space-x-3.5">
                  <div className="w-8.5 h-8.5 rounded-full flex items-center justify-center flex-shrink-0 text-white bg-gradient-to-tr from-violet-600 to-indigo-500">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className="p-4 rounded-2xl rounded-tl-none bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center space-x-1.5 py-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Textbox Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/40 p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50 transition-all">
              <textarea
                ref={textInputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me something about your tasks, schedule, or notes..."
                rows={1}
                className="flex-1 bg-transparent border-0 outline-none resize-none py-2 px-3 text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 max-h-32 focus:ring-0 focus:outline-none"
                style={{ height: 'auto' }}
              />

              <div className="flex items-center space-x-1.5 pr-1.5 pb-0.5">
                <button
                  onClick={() => handleSend()}
                  disabled={!inputMessage.trim() || isThinking}
                  className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                    inputMessage.trim() && !isThinking
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow shadow-indigo-600/10 cursor-pointer'
                      : 'text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-not-allowed'
                  }`}
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center px-1.5 mt-2">
              <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                <Bot className="w-3.5 h-3.5 text-indigo-500" />
                <span>Synchronized Workspace</span>
              </div>
              <span className="text-[10px] text-slate-450 hidden sm:block font-mono">
                Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Shift + Enter</kbd> for line break
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
