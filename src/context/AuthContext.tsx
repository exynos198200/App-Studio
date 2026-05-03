import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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

interface DeviceFlowData {
  user_code: string;
  device_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  deviceFlow: DeviceFlowData | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  cancelDeviceFlow: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceFlow, setDeviceFlow] = useState<DeviceFlowData | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
    };
  }, []);

  const cancelDeviceFlow = () => {
    setDeviceFlow(null);
    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const startPolling = (deviceCode: string, interval: number) => {
    if (pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('device_code', deviceCode);
        params.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');

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
          window.clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          await handleSuccessfulAuth(data.access_token);
        } else if (data.error === 'authorization_pending') {
          // Keep polling
        } else if (data.error === 'slow_down') {
          // GitHub asks to slow down, adjust polling if needed
        } else {
          // Other errors (expired, access_denied)
          cancelDeviceFlow();
          if (data.error !== 'authorization_pending') {
             console.error('Auth error:', data.error_description || data.error);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, (interval || 5) * 1000);
  };

  const handleSuccessfulAuth = async (token: string) => {
    try {
      setLoading(true);
      setDeviceFlow(null);

      // Sign in to Firebase with the GitHub token
      const credential = GithubAuthProvider.credential(token);
      const result = await signInWithCredential(auth, credential);

      if (result.user) {
        // Fetch user profile to get username (owner)
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
      console.error('GitHub Auth handling failed', error);
      alert('Failed to finalize authentication.');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      if (!clientId) {
        alert('VITE_GITHUB_CLIENT_ID is not configured.');
        return;
      }

      // Request device/user code
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('scope', 'repo workflow');

      const response = await CapacitorHttp.request({
        url: 'https://github.com/login/device/code',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params.toString()
      });
      
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`GitHub API error (${response.status}): ${JSON.stringify(response.data)}`);
      }
      
      const data = response.data;
      
      if (data.user_code) {
        setDeviceFlow(data);
        startPolling(data.device_code, data.interval || 5);
      } else {
        throw new Error(data.error_description || 'Failed to start device flow');
      }
    } catch (error) {
      console.error('Login failed', error);
      const message = error instanceof Error ? error.message : String(error);
      alert(`Login failed: ${message}`);
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
    <AuthContext.Provider value={{ user, loading, deviceFlow, login, logout, cancelDeviceFlow }}>
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
