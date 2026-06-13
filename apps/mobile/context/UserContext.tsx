import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  name: string | null;
  surname: string | null;
  email: string;
  role: string;
  username?: string | null;
  image?: string | null;
  profile?: {
    bio: string | null;
    location: string | null;
  } | null;
};

type UserContextType = {
  userId: string | null;
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  login: (data: { user: User; token?: string } | User) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from AsyncStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedUserJson = await AsyncStorage.getItem('@collabswipe_user');
        const savedToken = await AsyncStorage.getItem('@collabswipe_session_token');
        
        console.log('[UserContext load] user exists:', !!savedUserJson, '| token exists:', !!savedToken);
        
        if (savedUserJson && savedToken) {
          // Both user and token exist — valid session
          const parsedUser = JSON.parse(savedUserJson);
          setUserId(parsedUser.id);
          setUser(parsedUser);
          setSessionToken(savedToken);
        } else if (savedUserJson && !savedToken) {
          // User exists but no token — old session without bearer token, force re-login
          console.log('[UserContext load] Old session without token detected — clearing to force re-login');
          await AsyncStorage.removeItem('@collabswipe_user');
          await AsyncStorage.removeItem('@collabswipe_session_token');
        }
        // if neither exists, user is logged out — do nothing
      } catch (err) {
        console.error('Session loading failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (data: { user: User; token?: string } | User) => {
    try {
      const u = data && 'user' in data ? data.user : (data as User);
      const token = data && 'token' in data ? data.token : null;

      console.log('[UserContext login] token received:', token ? `${String(token).substring(0, 15)}...` : 'NULL');

      setUserId(u.id);
      setUser(u);
      setSessionToken(token || null);

      await AsyncStorage.setItem('@collabswipe_user', JSON.stringify(u));
      if (token) {
        await AsyncStorage.setItem('@collabswipe_session_token', token);
        console.log('[UserContext login] token saved to AsyncStorage ✓');
      } else {
        await AsyncStorage.removeItem('@collabswipe_session_token');
        console.log('[UserContext login] NO TOKEN - removing from AsyncStorage');
      }
    } catch (err) {
      console.error('Session save failed:', err);
    }
  };

  const logout = async () => {
    try {
      setUserId(null);
      setUser(null);
      setSessionToken(null);
      await AsyncStorage.removeItem('@collabswipe_user');
      await AsyncStorage.removeItem('@collabswipe_session_token');
    } catch (err) {
      console.error('Session clear failed:', err);
    }
  };

  return (
    <UserContext.Provider value={{ userId, user, sessionToken, isLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
