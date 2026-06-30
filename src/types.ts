export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  category: string;
  userId: string;
  createdAt: string;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  subtasks?: SubTask[];
  attachments?: Attachment[];
  progress?: number; // 0 to 100
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  color: string; // hex or tailwind class color representation
  userId: string;
  createdAt: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  category?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // HTML or structured content
  category: string;
  isPinned: boolean;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: string;
  streak: number;
  bestStreak: number;
  lastCompleted: string | null; // YYYY-MM-DD
  history: Record<string, boolean>; // YYYY-MM-DD -> completed
  userId: string;
  createdAt: string;
  reminderTime?: string; // HH:MM
}

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  type: 'task' | 'habit' | 'calendar' | 'system';
  isRead: boolean;
  createdAt: string;
  userId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  offlineMode: boolean;
  compactMode: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
  actionProposal?: {
    type: 'proposeCreateTask' | 'proposeCreateEvent' | 'proposeCreateNote' | 'proposeCreateHabit';
    data: any;
    status?: 'pending' | 'confirmed' | 'cancelled';
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

