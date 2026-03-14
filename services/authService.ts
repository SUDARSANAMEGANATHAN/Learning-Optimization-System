
import { User, UserAccount } from '../types';

const USERS_STORAGE_KEY = 'edu_ai_accounts';

// Helper to hash password using SHA-256
async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const authService = {
  getAccounts: (): UserAccount[] => {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const accounts = authService.getAccounts();
    
    if (accounts.find(a => a.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }

    const passwordHash = await hashPassword(password);
    const newUser: UserAccount = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email: email.toLowerCase(),
      passwordHash,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      createdAt: Date.now()
    };

    accounts.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(accounts));

    // Return User without the sensitive hash
    const { passwordHash: _, ...userResult } = newUser;
    return userResult;
  },

  login: async (email: string, password: string): Promise<User> => {
    const accounts = authService.getAccounts();
    const user = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const providedHash = await hashPassword(password);
    if (providedHash !== user.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    const { passwordHash: _, ...userResult } = user;
    return userResult;
  }
};
