import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  name: string | null;
  surname: string | null;
  email: string;
  role: string;
  profile?: {
    bio: string | null;
    location: string | null;
  } | null;
};

type UserContextType = {
  userId: string | null;
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from AsyncStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedUserJson = await AsyncStorage.getItem('@collabswipe_user');
        if (savedUserJson) {
          const parsedUser = JSON.parse(savedUserJson);
          setUserId(parsedUser.id);
          setUser(parsedUser);
        }
      } catch (err) {
        console.error('Session loading failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (userData: User) => {
    try {
      setUserId(userData.id);
      setUser(userData);
      await AsyncStorage.setItem('@collabswipe_user', JSON.stringify(userData));
    } catch (err) {
      console.error('Session save failed:', err);
    }
  };

  const logout = async () => {
    try {
      setUserId(null);
      setUser(null);
      await AsyncStorage.removeItem('@collabswipe_user');
    } catch (err) {
      console.error('Session clear failed:', err);
    }
  };

  return (
    <UserContext.Provider value={{ userId, user, isLoading, login, logout }}>
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
