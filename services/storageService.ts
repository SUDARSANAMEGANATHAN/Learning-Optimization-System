

import { User, Document, FlashcardSet, Quiz, Activity, ChatMessage, CommunityMessage } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'ai_learn_current_session',
  DOCS: 'ai_learn_docs',
  SETS: 'ai_learn_sets',
  QUIZZES: 'ai_learn_quizzes',
  ACTIVITY: 'ai_learn_activity',
  CHATS: 'ai_learn_chats',
  COMMUNITY: 'ai_learn_community'
};

export const storageService = {
  getCurrentSession: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentSession: (user: User | null) => {
    if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getDocuments: (): Document[] => {
    const user = storageService.getCurrentSession();
    if (!user) return [];
    const data = localStorage.getItem(STORAGE_KEYS.DOCS);
    const allDocs: Document[] = data ? JSON.parse(data) : [];
    return allDocs.filter(d => d.userId === user.id);
  },
  
  saveDocument: (doc: Document) => {
    const user = storageService.getCurrentSession();
    if (!user) return;
    const data = localStorage.getItem(STORAGE_KEYS.DOCS);
    const docs: Document[] = data ? JSON.parse(data) : [];
    docs.push({ ...doc, userId: user.id });
    localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(docs));
    storageService.addActivity({
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: 'upload',
      description: `Uploaded: ${doc.title}`,
      timestamp: Date.now()
    });
  },

  deleteDocument: (id: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.DOCS);
    const allDocs: Document[] = data ? JSON.parse(data) : [];
    const updated = allDocs.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(updated));
  },

  updateDocument: (id: string, updates: Partial<Document>) => {
    const docs = storageService.getDocuments();
    const index = docs.findIndex(d => d.id === id);
    if (index !== -1) {
      docs[index] = { ...docs[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(docs));
    }
  },

  getFlashcardSets: (): FlashcardSet[] => {
    const user = storageService.getCurrentSession();
    if (!user) return [];
    const data = localStorage.getItem(STORAGE_KEYS.SETS);
    const allSets: FlashcardSet[] = data ? JSON.parse(data) : [];
    return allSets.filter(s => s.userId === user.id);
  },

  saveFlashcardSet: (set: FlashcardSet) => {
    const user = storageService.getCurrentSession();
    if (!user) return;
    const data = localStorage.getItem(STORAGE_KEYS.SETS);
    const sets: FlashcardSet[] = data ? JSON.parse(data) : [];
    sets.push({ ...set, userId: user.id });
    localStorage.setItem(STORAGE_KEYS.SETS, JSON.stringify(sets));
    storageService.addActivity({
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      type: 'flashcard',
      description: `Created flashcards: ${set.title}`,
      timestamp: Date.now()
    });
  },

  // Added updateFlashcardSet to fix errors in DocumentDetail.tsx and GlobalFlashcards.tsx
  deleteFlashcardSet: (id: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.SETS);
    const allSets: FlashcardSet[] = data ? JSON.parse(data) : [];
    const updated = allSets.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SETS, JSON.stringify(updated));
  },

  updateFlashcardSet: (id: string, updates: Partial<FlashcardSet>) => {
    const sets = storageService.getFlashcardSets();
    const index = sets.findIndex(s => s.id === id);
    if (index !== -1) {
      sets[index] = { ...sets[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.SETS, JSON.stringify(sets));
    }
  },

  getQuizzes: (): Quiz[] => {
    const user = storageService.getCurrentSession();
    if (!user) return [];
    const data = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    const allQuizzes: Quiz[] = data ? JSON.parse(data) : [];
    return allQuizzes.filter(q => q.userId === user.id);
  },

  saveQuiz: (quiz: Quiz) => {
    const user = storageService.getCurrentSession();
    if (!user) return;
    const data = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    const quizzes: Quiz[] = data ? JSON.parse(data) : [];
    quizzes.push({ ...quiz, userId: user.id });
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
  },

  deleteQuiz: (id: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    const allQuizzes: Quiz[] = data ? JSON.parse(data) : [];
    const updated = allQuizzes.filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(updated));
  },

  updateQuiz: (id: string, updates: Partial<Quiz>) => {
    const quizzes = storageService.getQuizzes();
    const index = quizzes.findIndex(q => q.id === id);
    if (index !== -1) {
      quizzes[index] = { ...quizzes[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    }
  },

  getChats: (docId: string): ChatMessage[] => {
    const user = storageService.getCurrentSession();
    if (!user) return [];
    const chatsData = localStorage.getItem(`${STORAGE_KEYS.CHATS}_${docId}`);
    const allChats: ChatMessage[] = chatsData ? JSON.parse(chatsData) : [];
    return allChats.filter(c => c.userId === user.id);
  },

  saveChatMessage: (docId: string, message: ChatMessage) => {
    const user = storageService.getCurrentSession();
    if (!user) return;
    const chatsData = localStorage.getItem(`${STORAGE_KEYS.CHATS}_${docId}`);
    const chats: ChatMessage[] = chatsData ? JSON.parse(chatsData) : [];
    chats.push({ ...message, userId: user.id });
    localStorage.setItem(`${STORAGE_KEYS.CHATS}_${docId}`, JSON.stringify(chats));
  },

  // Added getCommunityMessages to fix errors in CommunityChat.tsx
  getCommunityMessages: (): CommunityMessage[] => {
    const data = localStorage.getItem(STORAGE_KEYS.COMMUNITY);
    return data ? JSON.parse(data) : [];
  },

  // Added saveCommunityMessage to fix errors in CommunityChat.tsx
  saveCommunityMessage: (message: CommunityMessage) => {
    const messages = storageService.getCommunityMessages();
    messages.push(message);
    // Keep only the last 50 messages to prevent LocalStorage bloat
    localStorage.setItem(STORAGE_KEYS.COMMUNITY, JSON.stringify(messages.slice(-50)));
  },

  getActivities: (): Activity[] => {
    const user = storageService.getCurrentSession();
    if (!user) return [];
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    const allActivities: Activity[] = data ? JSON.parse(data) : [];
    return allActivities.filter(a => a.userId === user.id);
  },

  addActivity: (activity: Activity) => {
    const user = storageService.getCurrentSession();
    if (!user) return;
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    const activities: Activity[] = data ? JSON.parse(data) : [];
    activities.unshift({ ...activity, userId: user.id });
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activities.slice(0, 50)));
  }
};
