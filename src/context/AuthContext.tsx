import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signOut, 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firebaseService } from '../services/firebaseService';
import { CapacitorHttp } from '@capacitor/core';

export interface GitHubUser {
  uid: string; // GitHub ID stringified
  login: string;
  avatar_url: string;
  token: string;
}

interface AuthContextType {
  user: GitHubUser | null;
  loading: boolean;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('app_studio_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
        localStorage.removeItem('app_studio_user');
      }
    }
    setLoading(false);
  }, []);

  const loginWithToken = async (token: string) => {
    try {
      setLoading(true);
      
      const response = await CapacitorHttp.request({
        url: 'https://api.github.com/user',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.status !== 200) {
        throw new Error('Invalid token or GitHub API error');
      }

      const profile = response.data;
      const githubUser: GitHubUser = {
        uid: String(profile.id),
        login: profile.login,
        avatar_url: profile.avatar_url,
        token: token
      };

      // Save to state and localStorage
      setUser(githubUser);
      localStorage.setItem('app_studio_user', JSON.stringify(githubUser));

      // Sync settings to Firestore to ensure "owner" and "token" are updated for deployment tasks
      await firebaseService.saveSettings(githubUser.uid, {
        token: token,
        owner: profile.login,
        repo: ''
      });

      // Notify other components if needed
      window.dispatchEvent(new Event('github-auth-success'));
      
    } catch (error) {
      console.error('Token login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('app_studio_user');
      setUser(null);
      // We don't necessarily need to sign out of Firebase if we're not heavily using it for auth,
      // but let's keep it clean.
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
