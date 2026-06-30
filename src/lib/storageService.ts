import { Task, CalendarEvent, Note, Habit, AppNotification, UserProfile, AppSettings, ChatMessage, ChatSession, getLocalDateString } from '../types';

const STORAGE_KEYS = {
  TASKS: 'tasko_tasks',
  EVENTS: 'tasko_events',
  NOTES: 'tasko_notes',
  HABITS: 'tasko_habits',
  NOTIFICATIONS: 'tasko_notifications',
  PROFILE: 'tasko_profile',
  SETTINGS: 'tasko_settings',
  CHATS: 'tasko_chats',
};

// Seed Data
const DEFAULT_PROFILE: UserProfile = {
  uid: 'user_default',
  email: 'somiyakhan088@gmail.com',
  displayName: 'Somiya Khan',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  createdAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  notificationsEnabled: true,
  offlineMode: true,
  compactMode: false,
};

const DEFAULT_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Finalize Tasko AI Project Blueprint',
    description: 'Structure the database schemas, UI design components, and responsive workflows.',
    isCompleted: true,
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'high',
    category: 'Work',
    userId: 'user_default',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'task-2',
    title: 'Review weekly habits and analytics',
    description: 'Analyze weekly streak metrics and compile results in the notes tab.',
    isCompleted: false,
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
    category: 'Personal',
    userId: 'user_default',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'task-3',
    title: 'Design high-fidelity dashboard views',
    description: 'Ensure spacing, typography pairing, and responsive grids are ultra-clean.',
    isCompleted: false,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'high',
    category: 'Work',
    userId: 'user_default',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Grocery shopping',
    description: 'Pick up spinach, avocados, almond milk, and salmon for weekly meal prep.',
    isCompleted: false,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    priority: 'low',
    category: 'Personal',
    userId: 'user_default',
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-1',
    name: 'Diaphragmatic Breathing',
    description: '5 minutes of mindful breath control to reset focus.',
    frequency: 'daily',
    category: 'Mindfulness',
    streak: 8,
    bestStreak: 12,
    lastCompleted: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    history: {
      [new Date(Date.now() - 86400000).toISOString().split('T')[0]]: true,
      [new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]]: true,
      [new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0]]: true,
    },
    userId: 'user_default',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'habit-2',
    name: 'Hydrate 3 Liters',
    description: 'Keep a water flask at the desk and hydrate consistently.',
    frequency: 'daily',
    category: 'Health',
    streak: 4,
    bestStreak: 15,
    lastCompleted: new Date().toISOString().split('T')[0],
    history: {
      [new Date().toISOString().split('T')[0]]: true,
      [new Date(Date.now() - 86400000).toISOString().split('T')[0]]: true,
      [new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]]: true,
    },
    userId: 'user_default',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'habit-3',
    name: 'LeetCode Daily Challenge',
    description: 'Solve one algorithmic puzzle to hone analytical thinking.',
    frequency: 'daily',
    category: 'Learning',
    streak: 0,
    bestStreak: 5,
    lastCompleted: null,
    history: {},
    userId: 'user_default',
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_NOTES: Note[] = [
  {
    id: 'note-1',
    title: '🚀 Tasko AI Product Roadmap',
    content: `## Vision\nBuild the absolute cleanest, most productive companion app for creators.\n\n### Core Philosophy\n- **Typography matters**: Elegant headers, tight spacing, clean negative space.\n- **Keyboard-first focus**: Swift layouts, predictable transitions.\n- **Zero Friction**: Single-view elements when possible, instant updates.\n\n### Upcoming Phases\n1. Complete offline core (done)\n2. Add Firebase Auth & database sync (done)\n3. Introduce premium generative AI widgets (phase 2)`,
    category: 'Ideas',
    isPinned: true,
    tags: ['tasko', 'roadmap', 'design'],
    userId: 'user_default',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'note-2',
    title: '💡 Content Creation Hooks',
    content: `- "The exact micro-routine that saved my product timeline..."\n- "Stop using calendars. Use responsive priority queues instead."\n- "Aesthetic minimalism is not about doing less; it is about feeling more in what you do."`,
    category: 'Work',
    isPinned: false,
    tags: ['creative', 'writing'],
    userId: 'user_default',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const DEFAULT_EVENTS: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Product Strategy Review',
    description: 'Sync with core team to finalize Q3 product release metrics.',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    color: '#3B82F6', // Blue
    userId: 'user_default',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'event-2',
    title: 'Deep Work Session: Design',
    description: 'Design mockups and transitions for the habit completions state.',
    date: new Date().toISOString().split('T')[0],
    startTime: '13:00',
    endTime: '15:30',
    color: '#8B5CF6', // Purple
    userId: 'user_default',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'event-3',
    title: 'Daily Standup Sync',
    description: 'Short sync to map tasks and unblock features.',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '09:30',
    endTime: '10:00',
    color: '#10B981', // Green
    userId: 'user_default',
    createdAt: new Date().toISOString(),
  }
];

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Streak Milestones!',
    content: 'Awesome job! Your habit "Diaphragmatic Breathing" reached an 8-day streak.',
    type: 'habit',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Task Due: Tasko AI Blueprint',
    content: 'Your priority task is marked due for today.',
    type: 'task',
    isRead: true,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  }
];

// Helper to get or initialize localStorage item
function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error parsing localStorage key ${key}`, e);
    return defaultValue;
  }
}

function setLocalStorageItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const StorageService = {
  // GET ALL
  getTasks: (): Task[] => getLocalStorageItem(STORAGE_KEYS.TASKS, DEFAULT_TASKS),
  getEvents: (): CalendarEvent[] => getLocalStorageItem(STORAGE_KEYS.EVENTS, DEFAULT_EVENTS),
  getNotes: (): Note[] => getLocalStorageItem(STORAGE_KEYS.NOTES, DEFAULT_NOTES),
  getHabits: (): Habit[] => getLocalStorageItem(STORAGE_KEYS.HABITS, DEFAULT_HABITS),
  getNotifications: (): AppNotification[] => getLocalStorageItem(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS),
  getProfile: (): UserProfile => getLocalStorageItem(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE),
  getSettings: (): AppSettings => getLocalStorageItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  getChats: (): ChatSession[] => getLocalStorageItem(STORAGE_KEYS.CHATS, []),

  // SET ALL
  setTasks: (tasks: Task[]): void => setLocalStorageItem(STORAGE_KEYS.TASKS, tasks),
  setEvents: (events: CalendarEvent[]): void => setLocalStorageItem(STORAGE_KEYS.EVENTS, events),
  setNotes: (notes: Note[]): void => setLocalStorageItem(STORAGE_KEYS.NOTES, notes),
  setHabits: (habits: Habit[]): void => setLocalStorageItem(STORAGE_KEYS.HABITS, habits),
  setNotifications: (notifs: AppNotification[]): void => setLocalStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifs),
  setProfile: (profile: UserProfile): void => setLocalStorageItem(STORAGE_KEYS.PROFILE, profile),
  setSettings: (settings: AppSettings): void => setLocalStorageItem(STORAGE_KEYS.SETTINGS, settings),
  setChats: (chats: ChatSession[]): void => setLocalStorageItem(STORAGE_KEYS.CHATS, chats),

  // INDIVIDUAL HELPERS FOR FASTER CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt'>): Task => {
    const tasks = StorageService.getTasks();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    StorageService.setTasks(tasks);
    return newTask;
  },

  updateTask: (updatedTask: Task): void => {
    const tasks = StorageService.getTasks();
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      StorageService.setTasks(tasks);
    }
  },

  deleteTask: (id: string): void => {
    const tasks = StorageService.getTasks();
    StorageService.setTasks(tasks.filter(t => t.id !== id));
  },

  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>): CalendarEvent => {
    const events = StorageService.getEvents();
    const newEvent: CalendarEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    events.push(newEvent);
    StorageService.setEvents(events);
    return newEvent;
  },

  updateEvent: (updatedEvent: CalendarEvent): void => {
    const events = StorageService.getEvents();
    const index = events.findIndex(e => e.id === updatedEvent.id);
    if (index !== -1) {
      events[index] = updatedEvent;
      StorageService.setEvents(events);
    }
  },

  deleteEvent: (id: string): void => {
    const events = StorageService.getEvents();
    StorageService.setEvents(events.filter(e => e.id !== id));
  },

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const notes = StorageService.getNotes();
    const newNote: Note = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notes.unshift(newNote);
    StorageService.setNotes(notes);
    return newNote;
  },

  updateNote: (updatedNote: Note): void => {
    const notes = StorageService.getNotes();
    const index = notes.findIndex(n => n.id === updatedNote.id);
    if (index !== -1) {
      notes[index] = {
        ...updatedNote,
        updatedAt: new Date().toISOString(),
      };
      StorageService.setNotes(notes);
    }
  },

  deleteNote: (id: string): void => {
    const notes = StorageService.getNotes();
    StorageService.setNotes(notes.filter(n => n.id !== id));
  },

  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'lastCompleted' | 'history' | 'createdAt'>): Habit => {
    const habits = StorageService.getHabits();
    const newHabit: Habit = {
      ...habit,
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      streak: 0,
      bestStreak: 0,
      lastCompleted: null,
      history: {},
      createdAt: new Date().toISOString(),
    };
    habits.unshift(newHabit);
    StorageService.setHabits(habits);
    return newHabit;
  },

  updateHabit: (updatedHabit: Habit): void => {
    const habits = StorageService.getHabits();
    const index = habits.findIndex(h => h.id === updatedHabit.id);
    if (index !== -1) {
      habits[index] = updatedHabit;
      StorageService.setHabits(habits);
    }
  },

  deleteHabit: (id: string): void => {
    const habits = StorageService.getHabits();
    StorageService.setHabits(habits.filter(h => h.id !== id));
  },

  toggleHabitComplete: (id: string, date: string): Habit => {
    const habits = StorageService.getHabits();
    const index = habits.findIndex(h => h.id === id);
    if (index === -1) throw new Error('Habit not found');

    const habit = { ...habits[index] };
    const completed = !!habit.history[date];

    if (completed) {
      // Untoggle habit
      delete habit.history[date];
      // Recalculate streak
      recalculateStreak(habit);
    } else {
      // Toggle complete
      habit.history[date] = true;
      habit.lastCompleted = date;
      // Recalculate streak
      recalculateStreak(habit);
    }

    habits[index] = habit;
    StorageService.setHabits(habits);
    return habit;
  },

  addNotification: (title: string, content: string, type: AppNotification['type']): AppNotification => {
    const notifs = StorageService.getNotifications();
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      content,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notifs.unshift(newNotif);
    StorageService.setNotifications(notifs);
    return newNotif;
  },

  markNotificationRead: (id: string): void => {
    const notifs = StorageService.getNotifications();
    const index = notifs.findIndex(n => n.id === id);
    if (index !== -1) {
      notifs[index].isRead = true;
      StorageService.setNotifications(notifs);
    }
  },

  markAllNotificationsRead: (): void => {
    const notifs = StorageService.getNotifications();
    notifs.forEach(n => n.isRead = true);
    StorageService.setNotifications(notifs);
  },

  clearNotifications: (): void => {
    StorageService.setNotifications([]);
  },

  exportUserData: (): string => {
    const data = {
      tasks: StorageService.getTasks(),
      events: StorageService.getEvents(),
      notes: StorageService.getNotes(),
      habits: StorageService.getHabits(),
      notifications: StorageService.getNotifications(),
      profile: StorageService.getProfile(),
      settings: StorageService.getSettings(),
      chats: StorageService.getChats(),
    };
    return JSON.stringify(data, null, 2);
  },

  importUserData: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks) StorageService.setTasks(data.tasks);
      if (data.events) StorageService.setEvents(data.events);
      if (data.notes) StorageService.setNotes(data.notes);
      if (data.habits) StorageService.setHabits(data.habits);
      if (data.notifications) StorageService.setNotifications(data.notifications);
      if (data.profile) StorageService.setProfile(data.profile);
      if (data.settings) StorageService.setSettings(data.settings);
      if (data.chats) StorageService.setChats(data.chats);
      return true;
    } catch (e) {
      console.error("Failed to import user data", e);
      return false;
    }
  }
};

// Simple helper to count streak based on daily history consecutive days
function recalculateStreak(habit: Habit): void {
  const history = habit.history;
  const dates = Object.keys(history).filter(d => history[d]).sort();
  if (dates.length === 0) {
    habit.streak = 0;
    return;
  }

  const today = getLocalDateString(new Date());
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

  // If last completed is neither today nor yesterday, streak is broken
  const hasCompletedRecent = history[today] || history[yesterday];
  if (!hasCompletedRecent) {
    habit.streak = 0;
    return;
  }

  // Count backwards from current active completion date
  let currentStreak = 0;
  let checkDate = history[today] ? new Date() : new Date(Date.now() - 86400000);

  while (true) {
    const dateStr = getLocalDateString(checkDate);
    if (history[dateStr]) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  habit.streak = currentStreak;
  if (currentStreak > habit.bestStreak) {
    habit.bestStreak = currentStreak;
  }
}
