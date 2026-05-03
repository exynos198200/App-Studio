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
import { InAppBrowser } from '@capgo/inappbrowser';
import { Capacitor } from '@capacitor/core';

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

    if (Capacitor.isNativePlatform()) {
      InAppBrowser.addListener('urlChangeEvent', async (data) => {
        console.log('WebView URL changed:', data.url);
        try {
          if (data.url.includes('appstudio://callback') || data.url.includes('code=')) {
            const url = new URL(data.url);
            const code = url.searchParams.get('code');
            
            await InAppBrowser.close();
            
            if (code) {
              await handleNativeGithubAuth(code);
            }
          }
        } catch (e) {
          console.error('Error handling WebView navigation', e);
        }
      });
    }

    return () => {
      unsubscribe();
      if (Capacitor.isNativePlatform()) {
        InAppBrowser.removeAllListeners();
      }
    };
  }, []);

  const handleNativeGithubAuth = async (code: string) => {
    try {
      setLoading(true);
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.error('GitHub Credentials missing in environment');
        return;
      }

      // Exchange code for access token
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: 'appstudio://callback'
        })
      });

      const data = await response.json();
      const token = data.access_token;

      if (!token) {
        throw new Error('No access token received from GitHub');
      }

      // Sign in to Firebase with the GitHub token
      const credential = GithubAuthProvider.credential(token);
      const result = await signInWithCredential(auth, credential);

      if (result.user) {
        // Fetch user profile to get username (owner)
        const userRes = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${token}`
          }
        });
        const profile = await userRes.json();
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

      if (Capacitor.isNativePlatform()) {
        await InAppBrowser.close();
      }
    } catch (error) {
      console.error('Native GitHub Auth failed', error);
      alert('Authentication failed. Please check logs.');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      if (!clientId) {
        alert('VITE_GITHUB_CLIENT_ID is not configured in environment variables.');
        return;
      }
      const redirectUri = 'appstudio://callback';
      const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,workflow`;
      
      if (Capacitor.isNativePlatform()) {
        await InAppBrowser.openWebView({ 
          url: githubUrl,
          title: 'GitHub Login'
        });
      } else {
        // Fallback for pure web if needed, though redirect will go to appstudio:// callback
        window.location.href = githubUrl;
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
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
