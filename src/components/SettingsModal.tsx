import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { X, Languages, Cpu, Key, Save, Check, Github, RefreshCw, FolderCode } from 'lucide-react';
import { Language, AIProvider, AISettings, GitHubConfig } from '../types';
import { motion } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubConfig: GitHubConfig | null;
  onSaveGithub: (config: GitHubConfig) => void;
  repos: any[];
  isLoadingRepos: boolean;
  onRefreshRepos: () => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  githubConfig, 
  onSaveGithub, 
  repos, 
  isLoadingRepos, 
  onRefreshRepos 
}: SettingsModalProps) {
  const { language, setLanguage, aiSettings, setAISettings, t } = useSettings();
  const [localAI, setLocalAI] = useState<AISettings>(aiSettings);
  const [isSaved, setIsSaved] = useState(false);
  const [isRepoListOpen, setIsRepoListOpen] = useState(false);

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
        className="bg-white border border-gray-200 rounded-2xl shadow-3xl w-full max-w-lg overflow-hidden"
      >
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">{t('settings.title')}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-black transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-10 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* GitHub Settings */}
          <section className="space-y-6">
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <Github size={14} />
              GitHub Integration
            </label>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 text-blue-600">Target Repository</label>
                {isLoadingRepos ? (
                  <div className="h-12 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center gap-3">
                    <RefreshCw size={14} className="animate-spin text-gray-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fetching Repositories...</span>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setIsRepoListOpen(!isRepoListOpen)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <FolderCode size={18} className="text-gray-400" />
                        <span className="font-bold text-gray-700">
                          {githubConfig?.repo ? `${githubConfig.owner}/${githubConfig.repo}` : 'Select a repository'}
                        </span>
                      </div>
                      <RefreshCw size={14} className={`text-gray-400 transition-transform ${isRepoListOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isRepoListOpen && (
                      <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar p-2">
                        <button 
                          onClick={onRefreshRepos}
                          className="w-full text-center p-2 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-50 rounded-lg transition-colors mb-2"
                        >
                          Refresh Repositories
                        </button>
                        {repos.map((repo: any) => (
                          <button
                            key={repo.id}
                            onClick={() => {
                              onSaveGithub({
                                token: githubConfig?.token || '',
                                owner: repo.owner.login,
                                repo: repo.name
                              });
                              setIsRepoListOpen(false);
                            }}
                            className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <p className="text-xs font-bold text-gray-700">{repo.full_name}</p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-tight">{repo.description || 'No description'}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[9px] text-gray-400 mt-2 uppercase tracking-tight font-medium">This repository will receive project files and trigger GitHub Actions.</p>
              </div>
            </div>
          </section>

          {/* Language selection */}
          <section className="pt-6 border-t border-gray-100">
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
                      ? 'border-gray-900 bg-gray-50' 
                      : 'border-transparent bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <span className={`text-base font-bold ${
                    language === l_val ? 'text-black' : 'text-gray-500'
                  }`}>{l_val === 'en' ? '🇺🇸' : '🇷🇺'}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    language === l_val ? 'text-black' : 'text-gray-500'
                  }`}>{l_val === 'en' ? 'English' : 'Русский'}</span>
                </button>
              ))}
            </div>
          </section>

          {/* AI Settings */}
          <section className="space-y-6 pt-6 border-t border-gray-100">
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
                          ? 'border-blue-500 bg-blue-50 text-blue-600' 
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('settings.ai_key')}</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={localAI.apiKey}
                      onChange={(e) => setLocalAI({ ...localAI, apiKey: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pl-9 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black"
          >
            {t('dashboard.cancel')}
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${
              isSaved 
                ? 'bg-green-500 text-white shadow-green-500/20' 
                : 'bg-[#1a1a1a] text-white hover:scale-105 shadow-gray-900/20'
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
