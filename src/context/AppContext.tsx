import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, CalendarEvent, Note, Habit, AppNotification, UserProfile, AppSettings, ChatMessage, ChatSession } from '../types';
import { StorageService } from '../lib/storageService';
import { auth, db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tasks: Task[];
  events: CalendarEvent[];
  notes: Note[];
  habits: Habit[];
  notifications: AppNotification[];
  profile: UserProfile;
  settings: AppSettings;
  loading: boolean;
  error: string | null;

  // Firebase auth state & methods
  firebaseUser: any;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;

  // Chat/AI Operations
  chats: ChatSession[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  createChat: (title?: string) => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, newTitle: string) => void;
  clearChat: (id: string) => void;
  clearAllChats: () => void;
  addMessageToChat: (chatId: string, role: 'user' | 'model', content: string, actionProposal?: ChatMessage['actionProposal']) => Promise<void>;
  updateMessageActionStatus: (chatId: string, messageId: string, status: 'pending' | 'confirmed' | 'cancelled', updatedData?: any) => void;
  regenerateResponse: (chatId: string) => Promise<void>;

  // Task Operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;

  // Event Operations
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateEvent: (event: CalendarEvent) => void;
  deleteEvent: (id: string) => void;

  // Note Operations
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<string>;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;

  // Habit Operations
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'lastCompleted' | 'history' | 'createdAt' | 'userId'>) => Promise<void>;
  updateHabit: (habit: Habit) => void;
  deleteHabit: (id: string) => void;
  toggleHabitComplete: (id: string, date: string) => void;

  // Notification Operations
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Profile & Settings
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  importUserData: (jsonString: string) => boolean;

  // Selected Note States for Editor Navigation
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  isNoteEditing: boolean;
  setIsNoteEditing: (editing: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE_FALLBACK());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS_FALLBACK());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isNoteEditing, setIsNoteEditing] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  function DEFAULT_PROFILE_FALLBACK(): UserProfile {
    return {
      uid: 'user_default',
      email: 'somiyakhan088@gmail.com',
      displayName: 'Somiya Khan',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      createdAt: new Date().toISOString(),
    };
  }

  function DEFAULT_SETTINGS_FALLBACK(): AppSettings {
    return {
      theme: 'dark',
      notificationsEnabled: true,
      offlineMode: true,
      compactMode: false,
    };
  }

  // Initial load
  useEffect(() => {
    try {
      setTasks(StorageService.getTasks());
      setEvents(StorageService.getEvents());
      setNotes(StorageService.getNotes());
      setHabits(StorageService.getHabits());
      setNotifications(StorageService.getNotifications());
      setProfile(StorageService.getProfile());
      setChats(StorageService.getChats());
      
      const savedSettings = StorageService.getSettings();
      setSettings(savedSettings);

      // Apply theme class on body
      if (savedSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to load local app data:", err);
      setError("Failed to load data. Resetting storage may resolve the issue.");
      setLoading(false);
    }
  }, []);

  // Firebase auth sync
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = auth.onAuthStateChanged((user: any) => {
        setFirebaseUser(user);
        setAuthChecked(true);
        if (user) {
          const updatedProfile: UserProfile = {
            uid: user.uid,
            email: user.email || 'somiyakhan088@gmail.com',
            displayName: user.displayName || 'Somiya Khan',
            photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
            createdAt: profile.createdAt,
          };
          setProfile(updatedProfile);
          StorageService.setProfile(updatedProfile);
          console.log("Firebase User authenticated. Syncing is active.");
        } else {
          // Reset profile to default local profile
          const localProfile = StorageService.getProfile();
          setProfile(localProfile);
        }
      });
      return () => unsubscribe();
    } else {
      setAuthChecked(true);
    }
  }, [profile.createdAt]);

  // Real-time Firestore Sync
  useEffect(() => {
    if (isFirebaseConfigured && db && authChecked && firebaseUser) {
      const uid = firebaseUser.uid;
      // 1. Subscribe to Tasks
      const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', uid));
      const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const fetched: Task[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as Task);
        });
        if (fetched.length > 0) {
          setTasks(fetched);
          StorageService.setTasks(fetched);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, 'tasks'));

      // 2. Subscribe to Events
      const eventsQuery = query(collection(db, 'events'), where('userId', '==', uid));
      const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
        const fetched: CalendarEvent[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as CalendarEvent);
        });
        if (fetched.length > 0) {
          setEvents(fetched);
          StorageService.setEvents(fetched);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, 'events'));

      // 3. Subscribe to Notes
      const notesQuery = query(collection(db, 'notes'), where('userId', '==', uid));
      const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
        const fetched: Note[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as Note);
        });
        if (fetched.length > 0) {
          setNotes(fetched);
          StorageService.setNotes(fetched);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, 'notes'));

      // 4. Subscribe to Habits
      const habitsQuery = query(collection(db, 'habits'), where('userId', '==', uid));
      const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
        const fetched: Habit[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as Habit);
        });
        if (fetched.length > 0) {
          setHabits(fetched);
          StorageService.setHabits(fetched);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, 'habits'));

      // 5. Subscribe to Notifications
      const notifsQuery = query(collection(db, 'notifications'), where('userId', '==', uid));
      const unsubscribeNotifs = onSnapshot(notifsQuery, (snapshot) => {
        const fetched: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as AppNotification);
        });
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(fetched);
        StorageService.setNotifications(fetched);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'notifications'));

      // 6. Subscribe to Chats
      const chatsQuery = query(collection(db, 'chats'), where('userId', '==', uid));
      const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
        const fetched: ChatSession[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as ChatSession);
        });
        fetched.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setChats(fetched);
        StorageService.setChats(fetched);
      }, (err) => handleFirestoreError(err, OperationType.GET, 'chats'));

      return () => {
        unsubscribeTasks();
        unsubscribeEvents();
        unsubscribeNotes();
        unsubscribeHabits();
        unsubscribeNotifs();
        unsubscribeChats();
      };
    }
  }, [isFirebaseConfigured, authChecked, firebaseUser]);

  // Sign in with Google Popup
  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      setError("Firebase is not configured for authentication.");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setFirebaseUser(result.user);
      addSystemNotification('Connected 🚀', `Signed in successfully as ${result.user.displayName}`, 'system');
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(`Sign-in failed: ${err.message || err}`);
    }
  };

  // Sign out user
  const signOutUser = async () => {
    if (!isFirebaseConfigured || !auth) return;
    try {
      await signOut(auth);
      setFirebaseUser(null);
      // Fallback to local profile
      const localProfile = {
        uid: 'user_default',
        email: 'somiyakhan088@gmail.com',
        displayName: 'Somiya Khan',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        createdAt: new Date().toISOString(),
      };
      setProfile(localProfile);
      StorageService.setProfile(localProfile);
      // Re-load offline/local data
      setTasks(StorageService.getTasks());
      setEvents(StorageService.getEvents());
      setNotes(StorageService.getNotes());
      setHabits(StorageService.getHabits());
      setNotifications(StorageService.getNotifications());
      setChats(StorageService.getChats());
      addSystemNotification('Disconnected 🔌', "Signed out of online sync mode.", 'system');
    } catch (err: any) {
      console.error("Sign-out error:", err);
    }
  };

  // Chat Handlers
  const createChat = (title?: string): string => {
    const id = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newChat: ChatSession = {
      id,
      title: title || 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: profile.uid,
    };

    if (isFirebaseConfigured && db && firebaseUser) {
      setDoc(doc(db, 'chats', id), newChat).catch((e) => {
        handleFirestoreError(e, OperationType.CREATE, `chats/${id}`);
      });
    }

    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    StorageService.setChats(updatedChats);
    setActiveChatId(id);
    return id;
  };

  const deleteChat = (id: string) => {
    if (isFirebaseConfigured && db && firebaseUser) {
      deleteDoc(doc(db, 'chats', id)).catch((e) => {
        handleFirestoreError(e, OperationType.DELETE, `chats/${id}`);
      });
    }

    const updatedChats = chats.filter((c) => c.id !== id);
    setChats(updatedChats);
    StorageService.setChats(updatedChats);

    if (activeChatId === id) {
      setActiveChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }
  };

  const renameChat = (id: string, newTitle: string) => {
    const updatedChats = chats.map((c) => {
      if (c.id === id) {
        const updated = { ...c, title: newTitle, updatedAt: new Date().toISOString() };
        if (isFirebaseConfigured && db && firebaseUser) {
          setDoc(doc(db, 'chats', id), updated).catch((e) => {
            handleFirestoreError(e, OperationType.UPDATE, `chats/${id}`);
          });
        }
        return updated;
      }
      return c;
    });

    setChats(updatedChats);
    StorageService.setChats(updatedChats);
  };

  const clearChat = (id: string) => {
    const updatedChats = chats.map((c) => {
      if (c.id === id) {
        const updated = { ...c, messages: [], updatedAt: new Date().toISOString() };
        if (isFirebaseConfigured && db && firebaseUser) {
          setDoc(doc(db, 'chats', id), updated).catch((e) => {
            handleFirestoreError(e, OperationType.UPDATE, `chats/${id}`);
          });
        }
        return updated;
      }
      return c;
    });

    setChats(updatedChats);
    StorageService.setChats(updatedChats);
  };

  const clearAllChats = () => {
    if (isFirebaseConfigured && db && firebaseUser) {
      chats.forEach((c) => {
        deleteDoc(doc(db, 'chats', c.id)).catch((e) => {
          handleFirestoreError(e, OperationType.DELETE, `chats/${c.id}`);
        });
      });
    }

    setChats([]);
    StorageService.setChats([]);
    setActiveChatId(null);
  };

  const addMessageToChat = async (chatId: string, role: 'user' | 'model', content: string, actionProposal?: ChatMessage['actionProposal']) => {
    let targetChatId = chatId;
    if (!targetChatId) {
      // Create a chat automatically if none active
      targetChatId = createChat('New Conversation');
    }

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role,
      content,
      createdAt: new Date().toISOString(),
      actionProposal,
    };

    // Calculate updated messages array based on the latest state
    setChats(prevChats => {
      let chatToUpdate = prevChats.find((c) => c.id === targetChatId);
      let currentMessages: ChatMessage[] = [];

      if (chatToUpdate) {
        currentMessages = [...chatToUpdate.messages, newMessage];
      } else {
        currentMessages = [newMessage];
      }

      const updatedChats = prevChats.map((c) => {
        if (c.id === targetChatId) {
          return {
            ...c,
            messages: currentMessages,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      });

      StorageService.setChats(updatedChats);

      const updatedChatSession = updatedChats.find((c) => c.id === targetChatId);
      if (updatedChatSession && isFirebaseConfigured && db && firebaseUser) {
        setDoc(doc(db, 'chats', targetChatId), updatedChatSession).catch((e) => {
          handleFirestoreError(e, OperationType.UPDATE, `chats/${targetChatId}`);
        });
      }

      return updatedChats;
    });

    // Trigger AI model if this is a user message
    if (role === 'user') {
      try {
        const chatToUpdate = chats.find((c) => c.id === targetChatId);

        // Collect current workspace data as context
        const contextData = {
          tasks,
          events,
          notes,
          habits,
        };

        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            history: chatToUpdate?.messages || [],
            context: contextData,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to get AI response');
        }

        const data = await response.json();
        await addMessageToChat(targetChatId, 'model', data.reply, data.actionProposal);

        // Auto-generate title if this is the first message
        const currentChat = chats.find((c) => c.id === targetChatId);
        if (currentChat && currentChat.title === 'New Conversation' && currentChat.messages.length <= 1) {
          try {
            const titleRes = await fetch('/api/gemini/title', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ message: content }),
            });
            if (titleRes.ok) {
              const titleData = await titleRes.json();
              if (titleData.title) {
                renameChat(targetChatId, titleData.title);
              }
            }
          } catch (tErr) {
            console.error('Failed to auto-generate title:', tErr);
          }
        }

      } catch (err: any) {
        console.error('AI chat error:', err);
        await addMessageToChat(
          targetChatId,
          'model',
          `⚠️ Error: ${err.message || 'Unable to reach the AI companion right now. Make sure GEMINI_API_KEY is configured.'}`
        );
      }
    }
  };

  const updateMessageActionStatus = (chatId: string, messageId: string, status: 'pending' | 'confirmed' | 'cancelled', updatedData?: any) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map((c) => {
        if (c.id === chatId) {
          const updatedMessages = c.messages.map((m) => {
            if (m.id === messageId && m.actionProposal) {
              return {
                ...m,
                actionProposal: {
                  ...m.actionProposal,
                  status,
                  data: updatedData !== undefined ? updatedData : m.actionProposal.data
                }
              };
            }
            return m;
          });
          const updated = { ...c, messages: updatedMessages, updatedAt: new Date().toISOString() };
          if (isFirebaseConfigured && db && firebaseUser) {
            setDoc(doc(db, 'chats', chatId), updated).catch((e) => {
              handleFirestoreError(e, OperationType.UPDATE, `chats/${chatId}`);
            });
          }
          return updated;
        }
        return c;
      });

      StorageService.setChats(updatedChats);
      return updatedChats;
    });
  };

  const regenerateResponse = async (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat || chat.messages.length === 0) return;

    // Find the last user message
    const lastUserMsgIndex = [...chat.messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserMsgIndex === -1) return;

    const actualIndex = chat.messages.length - 1 - lastUserMsgIndex;
    const lastUserMessage = chat.messages[actualIndex];

    // Remove all messages after that user message
    const cleanMessages = chat.messages.slice(0, actualIndex + 1);

    const updatedChats = chats.map((c) => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: cleanMessages,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    setChats(updatedChats);
    StorageService.setChats(updatedChats);

    const updatedChatSession = updatedChats.find((c) => c.id === chatId);
    if (updatedChatSession && isFirebaseConfigured && db && firebaseUser) {
      setDoc(doc(db, 'chats', chatId), updatedChatSession).catch((e) => {
        handleFirestoreError(e, OperationType.UPDATE, `chats/${chatId}`);
      });
    }

    // Trigger AI call
    try {
      const contextData = {
        tasks,
        events,
        notes,
        habits,
      };

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: lastUserMessage.content,
          history: cleanMessages.slice(0, -1),
          context: contextData,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      await addMessageToChat(chatId, 'model', data.reply, data.actionProposal);
    } catch (err: any) {
      console.error('AI regeneration error:', err);
      await addMessageToChat(
        chatId,
        'model',
        `⚠️ Error: ${err.message || 'Unable to reach the AI companion right now.'}`
      );
    }
  };

  // Task Handlers
  const addTaskHandler = async (taskData: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTask: Task = {
      ...taskData,
      id,
      userId: profile.uid,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await setDoc(doc(db, 'tasks', id), newTask);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `tasks/${id}`);
      }
    }
    
    const tasksList = [newTask, ...tasks];
    setTasks(tasksList);
    StorageService.setTasks(tasksList);
    addSystemNotification('Task Added', `"${newTask.title}" is scheduled for ${newTask.dueDate}.`, 'task');
  };

  const updateTaskHandler = async (updatedTask: Task) => {
    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await setDoc(doc(db, 'tasks', updatedTask.id), updatedTask);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `tasks/${updatedTask.id}`);
      }
    }
    const updated = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(updated);
    StorageService.setTasks(updated);
  };

  const deleteTaskHandler = async (id: string) => {
    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `tasks/${id}`);
      }
    }
    const filtered = tasks.filter(t => t.id !== id);
    setTasks(filtered);
    StorageService.setTasks(filtered);
  };

  // Event Handlers
  const addEventHandler = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'userId'>) => {
    const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newEvent: CalendarEvent = {
      ...eventData,
      id,
      userId: profile.uid,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await setDoc(doc(db, 'events', id), newEvent);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `events/${id}`);
      }
    }
    const eventsList = [...events, newEvent];
    setEvents(eventsList);
    StorageService.setEvents(eventsList);
    addSystemNotification('Event Added', `"${eventData.title}" added to calendar.`, 'calendar');
  };

  const updateEventHandler = async (updatedEvent: CalendarEvent) => {
    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await setDoc(doc(db, 'events', updatedEvent.id), updatedEvent);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `events/${updatedEvent.id}`);
      }
    }
    const updated = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    setEvents(updated);
    StorageService.setEvents(updated);
  };

  const deleteEventHandler = async (id: string) => {
    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await deleteDoc(doc(db, 'events', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `events/${id}`);
      }
    }
    const filtered = events.filter(e => e.id !== id);
    setEvents(filtered);
    StorageService.setEvents(filtered);
  };

  // Note Handlers
  const addNoteHandler = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const id = `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNote: Note = {
      ...noteData,
      id,
      userId: profile.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await setDoc(doc(db, 'notes', id), newNote);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `notes/${id}`);
      }
    }
    const notesList = [newNote, ...notes];
    setNotes(notesList);
    StorageService.setNotes(notesList);
    return id;
  };

  const updateNoteHandler = async (updatedNote: Note) => {
    const noteWithTimestamp = {
      ...updatedNote,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await setDoc(doc(db, 'notes', updatedNote.id), noteWithTimestamp);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `notes/${updatedNote.id}`);
      }
    }
    const updated = notes.map(n => n.id === updatedNote.id ? noteWithTimestamp : n);
    setNotes(updated);
    StorageService.setNotes(updated);
  };

  const deleteNoteHandler = async (id: string) => {
    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await deleteDoc(doc(db, 'notes', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `notes/${id}`);
      }
    }
    const filtered = notes.filter(n => n.id !== id);
    setNotes(filtered);
    StorageService.setNotes(filtered);
  };

  // Habit Handlers
  const addHabitHandler = async (habitData: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'lastCompleted' | 'history' | 'createdAt' | 'userId'>) => {
    const id = `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newHabit: Habit = {
      ...habitData,
      id,
      streak: 0,
      bestStreak: 0,
      lastCompleted: null,
      history: {},
      userId: profile.uid,
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await setDoc(doc(db, 'habits', id), newHabit);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `habits/${id}`);
      }
    }
    const habitsList = [newHabit, ...habits];
    setHabits(habitsList);
    StorageService.setHabits(habitsList);
    addSystemNotification('New Habit', `"${habitData.name}" has been added to trackers.`, 'habit');
  };

  const updateHabitHandler = async (updatedHabit: Habit) => {
    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await setDoc(doc(db, 'habits', updatedHabit.id), updatedHabit);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `habits/${updatedHabit.id}`);
      }
    }
    const updated = habits.map(h => h.id === updatedHabit.id ? updatedHabit : h);
    setHabits(updated);
    StorageService.setHabits(updated);
  };

  const deleteHabitHandler = async (id: string) => {
    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await deleteDoc(doc(db, 'habits', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `habits/${id}`);
      }
    }
    const filtered = habits.filter(h => h.id !== id);
    setHabits(filtered);
    StorageService.setHabits(filtered);
  };

  const toggleHabitCompleteHandler = async (id: string, date: string) => {
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) return;

    const targetHabit = { ...habits[habitIndex] };
    const completed = !!targetHabit.history[date];

    if (completed) {
      delete targetHabit.history[date];
    } else {
      targetHabit.history[date] = true;
      targetHabit.lastCompleted = date;
    }

    recalculateLocalStreak(targetHabit);

    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await setDoc(doc(db, 'habits', id), targetHabit);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `habits/${id}`);
      }
    }

    const updated = habits.map(h => h.id === id ? targetHabit : h);
    setHabits(updated);
    StorageService.setHabits(updated);

    const isDone = !completed;
    if (isDone) {
      if (targetHabit.streak > 0 && targetHabit.streak % 3 === 0) {
        addSystemNotification(
          'Habit Streak 🔥',
          `You are on a ${targetHabit.streak}-day streak for "${targetHabit.name}"! Keep it up!`,
          'habit'
        );
      } else {
        addSystemNotification('Habit Done', `"${targetHabit.name}" logged as completed!`, 'habit');
      }
    }
  };

  function recalculateLocalStreak(habit: Habit): void {
    const history = habit.history;
    const dates = Object.keys(history).filter(d => history[d]).sort();
    if (dates.length === 0) {
      habit.streak = 0;
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const hasCompletedRecent = history[today] || history[yesterday];
    if (!hasCompletedRecent) {
      habit.streak = 0;
      return;
    }

    let currentStreak = 0;
    let checkDate = history[today] ? new Date() : new Date(Date.now() - 86400000);

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
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

  // Notification Helpers
  const addSystemNotification = async (title: string, content: string, type: AppNotification['type']) => {
    if (!settings.notificationsEnabled) return;

    const id = `notif-${Date.now()}`;
    const newNotif: AppNotification = {
      id,
      title,
      content,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
      userId: profile.uid,
    };

    if (isFirebaseConfigured && db && firebaseUser) {
      try {
        await setDoc(doc(db, 'notifications', id), newNotif);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `notifications/${id}`);
      }
    }

    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    StorageService.setNotifications(updated);
  };

  const markNotificationReadHandler = async (id: string) => {
    const updated = notifications.map(n => {
      if (n.id === id) {
        const updatedNotif = { ...n, isRead: true };
        if (isFirebaseConfigured && db && firebaseUser) {
          setDoc(doc(db, 'notifications', id), updatedNotif).catch(e => handleFirestoreError(e, OperationType.UPDATE, `notifications/${id}`));
        }
        return updatedNotif;
      }
      return n;
    });
    setNotifications(updated);
    StorageService.setNotifications(updated);
  };

  const markAllNotificationsReadHandler = async () => {
    const updated = notifications.map(n => {
      if (!n.isRead) {
        const updatedNotif = { ...n, isRead: true };
        if (isFirebaseConfigured && db && firebaseUser) {
          setDoc(doc(db, 'notifications', n.id), updatedNotif).catch(e => handleFirestoreError(e, OperationType.UPDATE, `notifications/${n.id}`));
        }
        return updatedNotif;
      }
      return n;
    });
    setNotifications(updated);
    StorageService.setNotifications(updated);
  };

  const clearNotificationsHandler = () => {
    StorageService.clearNotifications();
    setNotifications(StorageService.getNotifications());
  };

  // Settings & Profile
  const updateProfileHandler = (profileUpdates: Partial<UserProfile>) => {
    const updatedProfile = { ...profile, ...profileUpdates };
    setProfile(updatedProfile);
    StorageService.setProfile(updatedProfile);
  };

  const updateSettingsHandler = (settingsUpdates: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...settingsUpdates };
    setSettings(updatedSettings);
    StorageService.setSettings(updatedSettings);

    // Apply dark class
    if (updatedSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const importUserDataHandler = (jsonString: string): boolean => {
    const success = StorageService.importUserData(jsonString);
    if (success) {
      setTasks(StorageService.getTasks());
      setEvents(StorageService.getEvents());
      setNotes(StorageService.getNotes());
      setHabits(StorageService.getHabits());
      setNotifications(StorageService.getNotifications());
      setProfile(StorageService.getProfile());
      const savedSettings = StorageService.getSettings();
      setSettings(savedSettings);
      
      if (savedSettings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return true;
    }
    return false;
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        tasks,
        events,
        notes,
        habits,
        notifications,
        profile,
        settings,
        loading,
        error,
        addTask: addTaskHandler,
        updateTask: updateTaskHandler,
        deleteTask: deleteTaskHandler,
        addEvent: addEventHandler,
        updateEvent: updateEventHandler,
        deleteEvent: deleteEventHandler,
        addNote: addNoteHandler,
        updateNote: updateNoteHandler,
        deleteNote: deleteNoteHandler,
        addHabit: addHabitHandler,
        updateHabit: updateHabitHandler,
        deleteHabit: deleteHabitHandler,
        toggleHabitComplete: toggleHabitCompleteHandler,
        markNotificationRead: markNotificationReadHandler,
        markAllNotificationsRead: markAllNotificationsReadHandler,
        clearNotifications: clearNotificationsHandler,
        updateProfile: updateProfileHandler,
        updateSettings: updateSettingsHandler,
        importUserData: importUserDataHandler,
        selectedNoteId,
        setSelectedNoteId,
        isNoteEditing,
        setIsNoteEditing,
        firebaseUser,
        signInWithGoogle,
        signOutUser,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
