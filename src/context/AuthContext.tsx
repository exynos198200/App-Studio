import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithCredential,
  signOut, 
  User,
  GithubAuthProvider
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { firebaseService } from '../services/firebaseService';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { App } from '@capacitor/app';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Handle incoming App Links (Deep Links)
    const setupDeepLinkListener = async () => {
      App.addListener('appUrlOpen', async (data: any) => {
        console.log('App URL opened:', data.url);
        const url = new URL(data.url);
        
        // Check if the URL matches our callback
        if (url.pathname === '/callback' || url.hostname === 'exynos198200.github.io') {
          const code = url.searchParams.get('code');
          if (code) {
            await handleNativeGithubAuth(code);
          }
        }
      });
    };

    setupDeepLinkListener();

    return () => {
      unsubscribe();
      App.removeAllListeners();
    };
  }, []);

  const handleNativeGithubAuth = async (code: string) => {
    try {
      setLoading(true);
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('GitHub Client ID or Secret not configured');
      }

      // Exchange code for token
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('code', code);
      params.append('redirect_uri', 'https://exynos198200.github.io/callback');

      const response = await CapacitorHttp.request({
        url: 'https://github.com/login/oauth/access_token',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params.toString()
      });

      const data = response.data;
      if (data.access_token) {
        await handleSuccessfulAuth(data.access_token);
      } else {
        throw new Error(data.error_description || 'Failed to get access token');
      }
    } catch (error) {
      console.error('Native GitHub Auth failed:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = async (token: string) => {
    try {
      // Sign in to Firebase with the GitHub token
      const credential = GithubAuthProvider.credential(token);
      const result = await signInWithCredential(auth, credential);

      if (result.user) {
        setUser(result.user);

        // Fetch user profile to get username
        const userRes = await CapacitorHttp.request({
          url: 'https://api.github.com/user',
          method: 'GET',
          headers: {
            'Authorization': `token ${token}`
          }
        });
        const profile = userRes.data;
        const username = profile.login;

        // Update Firestore
        const currentSettings = await firebaseService.getSettings(result.user.uid);
        await firebaseService.saveSettings(result.user.uid, {
          token,
          owner: currentSettings?.owner || username || '',
          repo: currentSettings?.repo || ''
        });
        
        // Refresh local state
        window.dispatchEvent(new Event('github-auth-success'));
      }
    } catch (error) {
      console.error('Finalizing auth failed:', error);
      alert('Failed to finalize authentication.');
    }
  };

  const login = async () => {
    try {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      if (!clientId) {
        alert('VITE_GITHUB_CLIENT_ID is not configured.');
        return;
      }

      const redirectUri = encodeURIComponent('https://exynos198200.github.io/callback');
      const scope = encodeURIComponent('repo workflow');
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

      // Open in system browser
      window.open(authUrl, '_system');
    } catch (error) {
      console.error('Login launch failed', error);
      alert('Could not launch GitHub login.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
