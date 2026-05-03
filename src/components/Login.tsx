import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Github, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
      >
        <div className="bg-[#1a1a1a] p-12 flex flex-col items-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
            <Terminal className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">App Studio Cloud</h1>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-[0.2em] font-medium">Professional Hybrid IDE</p>
        </div>
        
        <div className="p-10 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-sm text-gray-500">Sign in with GitHub to sync projects and deploy</p>
          </div>

          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#24292e] text-white rounded-xl font-bold hover:bg-[#1b1f23] transition-all shadow-md active:scale-[0.98]"
          >
            <Github size={20} />
            Continue with GitHub
          </button>

          <div className="pt-4 border-t border-gray-50 flex items-center justify-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-blue-500" />
              Secure GitHub OAuth via Firebase
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
