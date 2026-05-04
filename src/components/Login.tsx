import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Terminal, Key, Shield, ExternalLink, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { loginWithToken } = useAuth();
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await loginWithToken(token.trim());
    } catch (err) {
      setError('Invalid token. Please check and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className="bg-[#1a1a1a] p-12 flex flex-col items-center relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
            <Terminal className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">App Studio Cloud</h1>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-[0.2em] font-bold">Cloud-Native Hybrid IDE</p>
        </div>
        
        <div className="p-10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
            <p className="text-sm text-gray-500">Enter your GitHub Personal Access Token to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-mono text-sm"
                  disabled={isSubmitting}
                />
              </div>
              {error && (
                <p className="text-xs text-red-500 font-medium ml-1">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token.trim()}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1a1a1a] text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Connect with Token
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 space-y-3">
            <div className="flex items-center gap-2 text-blue-700">
              <Shield size={16} />
              <h3 className="text-xs font-black uppercase tracking-wider">How to generate</h3>
            </div>
            <ol className="text-xs text-blue-600/80 space-y-2 ml-1">
              <li className="flex gap-2">
                <span className="font-bold opacity-50">1.</span>
                <span>Go to <strong>github.com</strong> → Settings</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold opacity-50">2.</span>
                <span>Developer settings → Personal access tokens</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold opacity-50">3.</span>
                <span>Generate new token (classic)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold opacity-50">4.</span>
                <span>Select <strong>repo</strong> and <strong>workflow</strong> scopes</span>
              </li>
            </ol>
            <a 
              href="https://github.com/settings/tokens/new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 uppercase mt-2 hover:underline cursor-pointer"
            >
              Open Settings <ExternalLink size={10} />
            </a>
          </div>

          <div className="text-center pt-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black flex items-center justify-center gap-2">
              <span className="w-1 h-1 rounded-full bg-green-500" />
              Direct API Integration
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
