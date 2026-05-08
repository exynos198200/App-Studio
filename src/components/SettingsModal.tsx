import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { X, Moon, Sun, Languages, Cpu, Key, Save, Check } from 'lucide-react';
import { Theme, Language, AIProvider, AISettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme, language, setLanguage, aiSettings, setAISettings, t } = useSettings();
  const [localAI, setLocalAI] = useState<AISettings>(aiSettings);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setAISettings(localAI);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[4px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-3xl w-full max-w-lg overflow-hidden"
      >
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#262626] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{t('settings.title')}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-10 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Theme selection */}
          <section>
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              <Sun size={14} />
              {t('settings.theme')}
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(['light', 'dark'] as Theme[]).map(t_val => (
                <button
                  key={t_val}
                  onClick={() => setTheme(t_val)}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    theme === t_val 
                      ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-[#262626]' 
                      : 'border-transparent bg-gray-100 dark:bg-[#0d0d0d] hover:bg-gray-200 dark:hover:bg-[#1a1a1a]'
                  }`}
                >
                  {t_val === 'light' ? <Sun size={18} className={theme === 'light' ? 'text-black' : 'text-gray-400'} /> : <Moon size={18} className={theme === 'dark' ? 'text-white' : 'text-gray-400'} />}
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    theme === t_val ? 'text-black dark:text-white' : 'text-gray-500'
                  }`}>{t_val}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Language selection */}
          <section>
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              <Languages size={14} />
              {t('settings.language')}
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(['en', 'ru'] as Language[]).map(l_val => (
                <button
                  key={l_val}
                  onClick={() => setLanguage(l_val)}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    language === l_val 
                      ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-[#262626]' 
                      : 'border-transparent bg-gray-100 dark:bg-[#0d0d0d] hover:bg-gray-200 dark:hover:bg-[#1a1a1a]'
                  }`}
                >
                  <span className={`text-base font-bold ${
                    language === l_val ? 'text-black dark:text-white' : 'text-gray-500'
                  }`}>{l_val === 'en' ? '🇺🇸' : '🇷🇺'}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    language === l_val ? 'text-black dark:text-white' : 'text-gray-500'
                  }`}>{l_val === 'en' ? 'English' : 'Русский'}</span>
                </button>
              ))}
            </div>
          </section>

          {/* AI Settings */}
          <section className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <Cpu size={14} />
              AI Agent Configuration
            </label>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('settings.ai_provider')}</label>
                <div className="flex gap-2">
                  {(['google', 'openai', 'anthropic'] as AIProvider[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setLocalAI({ ...localAI, provider: p, model: p === 'google' ? 'gemini-1.5-flash' : p === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20240620' })}
                      className={`flex-1 p-3 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
                        localAI.provider === p 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                          : 'border-gray-200 dark:border-gray-800 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('settings.ai_model')}</label>
                  <input
                    type="text"
                    value={localAI.model}
                    onChange={(e) => setLocalAI({ ...localAI, model: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-[#0d0d0d] dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('settings.ai_key')}</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={localAI.apiKey}
                      onChange={(e) => setLocalAI({ ...localAI, apiKey: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-[#0d0d0d] dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 pl-9 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-[#262626] border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black dark:hover:text-white"
          >
            {t('dashboard.cancel')}
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${
              isSaved 
                ? 'bg-green-500 text-white shadow-green-500/20' 
                : 'bg-[#1a1a1a] dark:bg-white text-white dark:text-black hover:scale-105 shadow-gray-900/20'
            }`}
          >
            {isSaved ? <Check size={14} /> : <Save size={14} />}
            {isSaved ? 'SAVED' : t('settings.save')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
