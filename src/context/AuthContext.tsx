import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseService } from '../services/firebaseService';
import { CapacitorHttp } from '@capacitor/core';

export interface GitHubUser {
  uid: string; // This will be the GitHub ID for Firestore paths
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
      console.log('Verifying GitHub token...');
      
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
      console.log('GitHub user verified:', profile.login);

      const githubUser: GitHubUser = {
        uid: String(profile.id),
        login: profile.login,
        avatar_url: profile.avatar_url,
        token: token
      };

      // Save to state and localStorage
      localStorage.setItem('app_studio_user', JSON.stringify(githubUser));
      setUser(githubUser);

      // Sync settings to Firestore using GitHub ID
      await firebaseService.saveSettings(githubUser.uid, {
        token: token,
        owner: profile.login,
        repo: ''
      });

      window.dispatchEvent(new Event('github-auth-success'));
      
    } catch (error) {
      console.error('Login failed:', error);
      alert(error instanceof Error ? error.message : 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('app_studio_user');
    setUser(null);
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
