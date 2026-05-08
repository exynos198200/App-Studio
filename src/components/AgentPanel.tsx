import React, { useState, useRef, useEffect } from 'react';
import { Project, FileNode } from '../types';
import { aiService } from '../services/aiService';
import { useSettings } from '../context/SettingsContext';
import { Send, User, Bot, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface AgentPanelProps {
  project: Project;
  currentFile: FileNode | null;
  onUpdateProject: (project: Project) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AgentPanel({ project, currentFile, onUpdateProject }: AgentPanelProps) {
  const { aiSettings, t } = useSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!aiSettings.apiKey) {
      alert('Please set your AI API key in Settings');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await aiService.chat(
        userMessage,
        aiSettings,
        project,
        currentFile,
        messages
      );

      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);

      if (response.filesToUpdate && response.filesToUpdate.length > 0) {
        const updatedFiles = [...project.files];
        response.filesToUpdate.forEach(fileUpdate => {
          const index = updatedFiles.findIndex(f => f.path === fileUpdate.path);
          if (index !== -1) {
            updatedFiles[index] = { ...updatedFiles[index], content: fileUpdate.content };
          } else {
            // New file
            updatedFiles.push({
              id: Math.random().toString(36).substr(2, 9),
              name: fileUpdate.path.split('/').pop() || 'new-file',
              type: 'file',
              content: fileUpdate.content,
              parentId: null, // Simplification for now
              path: fileUpdate.path
            });
          }
        });
        onUpdateProject({ ...project, files: updatedFiles, updatedAt: Date.now() });
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: t('agent.error') }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f8f8] dark:bg-[#0d0d0d] border-l border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <Sparkles size={16} className="text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-widest dark:text-white">{t('ide.agent')}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
            <Bot size={48} className="text-gray-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest max-w-[160px]">
              {t('agent.placeholder')}
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-start gap-2 max-w-[90%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-1.5 rounded-lg ${m.role === 'user' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800'}`}>
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-[#1a1a1a] dark:text-gray-300 border border-gray-100 dark:border-gray-800 rounded-tl-none shadow-sm'
              }`}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 opacity-50">
            <div className="p-1.5 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800">
              <Bot size={14} className="animate-pulse" />
            </div>
            <Loader2 size={14} className="animate-spin" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!aiSettings.apiKey && (
        <div className="p-4 m-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <p className="text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-tight leading-relaxed">
            API key missing. Set it in settings to use the AI Agent.
          </p>
        </div>
      )}

      <div className="p-4 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-800">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('agent.placeholder')}
            rows={2}
            className="w-full bg-[#f3f3f3] dark:bg-[#0d0d0d] dark:text-white border-none rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all font-medium text-xs resize-none placeholder:text-gray-400 no-scrollbar"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2 bg-[#1a1a1a] dark:bg-white text-white dark:text-black rounded-lg hover:scale-105 transition-transform disabled:opacity-20"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
