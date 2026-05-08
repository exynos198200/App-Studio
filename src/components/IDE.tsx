/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Project, FileNode, GitHubConfig, BuildStatus } from '../types';
import FileTree from './FileTree';
import Editor from './Editor';
import { QRCodeSVG } from 'qrcode.react';
import { useSettings } from '../context/SettingsContext';
import SettingsModal from './SettingsModal';
import AgentPanel from './AgentPanel';
import { 
  ArrowLeft, 
  Play, 
  Github, 
  Settings, 
  Terminal,
  Cpu,
  CloudUpload,
  ChevronRight,
  File,
  X,
  RefreshCw,
  Layout,
  Trash2,
  LogOut,
  User as UserIcon,
  Download,
  Share2,
  Check,
  Folder,
  FolderCode,
  ChevronDown,
  MessageSquare,
  Bot
} from 'lucide-react';
import { githubService } from '../services/githubService';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';

// Memoized Repository List to prevent re-renders on scroll
const RepoList = React.memo(({ repos, githubConfig, onSelect }: { repos: any[], githubConfig: GitHubConfig | null, onSelect: (repo: any) => void }) => {
  return (
    <div className="space-y-1">
      {repos.map(repo => {
        const isSelected = githubConfig?.owner === repo.owner.login && githubConfig?.repo === repo.name;
        return (
          <button
            key={repo.id}
            onClick={() => onSelect(repo)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
              isSelected 
                ? 'bg-blue-50 border-2 border-blue-100' 
                : 'bg-white hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <div className="flex items-center gap-4 text-left">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <Folder size={20} />
              </div>
              <div>
                <p className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                  {repo.name}
                </p>
                <p className="text-[10px] text-gray-400 font-medium">
                  {repo.owner.login} • {repo.private ? 'Private' : 'Public'}
                </p>
              </div>
            </div>
            {isSelected && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
});

interface IDEProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: () => void;
  onBack: () => void;
}

export default function IDE({ project, onUpdateProject, onDeleteProject, onBack }: IDEProps) {
  const { user, logout } = useAuth();
  const { t, aiSettings } = useSettings();
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({ status: 'idle' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'files' | 'agent'>('files');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Auto-switch to agent tab when API key is set
  const prevApiKey = React.useRef(aiSettings.apiKey);
  useEffect(() => {
    if (aiSettings.apiKey && !prevApiKey.current) {
      setSidebarTab('agent');
      setIsSidebarOpen(true);
    }
    prevApiKey.current = aiSettings.apiKey;
  }, [aiSettings.apiKey]);

  // Load github config from Firestore
  useEffect(() => {
    const loadSettings = () => {
      if (user) {
        firebaseService.getSettings(user.uid).then(config => {
          setGithubConfig(config);
        });
      }
    };

    loadSettings();

    window.addEventListener('github-auth-success', loadSettings);
    return () => window.removeEventListener('github-auth-success', loadSettings);
  }, [user]);

  // Fetch repos when settings open
  useEffect(() => {
    if (isSettingsOpen && githubConfig?.token) {
      setIsLoadingRepos(true);
      githubService.getUserRepos(githubConfig.token)
        .then(setUserRepos)
        .catch(console.error)
        .finally(() => setIsLoadingRepos(false));
    }
  }, [isSettingsOpen, githubConfig?.token]);

  const refreshRepos = () => {
    if (githubConfig?.token) {
      setIsLoadingRepos(true);
      githubService.getUserRepos(githubConfig.token)
        .then(setUserRepos)
        .catch(console.error)
        .finally(() => setIsLoadingRepos(false));
    }
  };

  const activeFile = project.files.find(f => f.id === activeFileId);

  const handleRepoSelect = React.useCallback((repo: any) => {
    setGithubConfig(prev => ({ 
      ...prev!, 
      owner: repo.owner.login, 
      repo: repo.name 
    }));
    setIsRepoSheetOpen(false);
  }, []);

  // Poll build status
  useEffect(() => {
    if (buildStatus.status === 'in_progress' || buildStatus.status === 'queued') {
      const interval = setInterval(async () => {
        if (!githubConfig) return;
        try {
          const run = await githubService.getLatestRun(githubConfig);
          if (run) {
            const runTime = new Date(run.created_at).getTime();
            if (buildStatus.triggeredAt && runTime < buildStatus.triggeredAt) return;

            if (run.status === 'completed') {
              setBuildStatus({ 
                status: run.conclusion === 'success' ? 'completed' : 'failed',
                runId: run.id,
                artifactUrl: run.html_url,
                triggeredAt: buildStatus.triggeredAt
              });
              if (run.conclusion === 'success') {
                setShowQR(true);
              }
              clearInterval(interval);
            } else {
              setBuildStatus(prev => ({ ...prev, status: 'in_progress' }));
            }
          }
        } catch (e) {
          console.error("Status check failed", e);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [buildStatus.status, buildStatus.triggeredAt, githubConfig]);

  const handleFileChange = (newContent: string) => {
    if (!activeFileId) return;
    const updatedFiles = project.files.map(f => 
      f.id === activeFileId ? { ...f, content: newContent } : f
    );
    onUpdateProject({ ...project, files: updatedFiles, updatedAt: Date.now() });
  };

  const handleBuild = async () => {
    if (!githubConfig) {
      setIsGithubModalOpen(true);
      return;
    }
    const now = Date.now();
    const actionUrl = `https://github.com/${githubConfig.owner}/${githubConfig.repo}/actions`;
    setBuildStatus({ status: 'queued', triggeredAt: now, artifactUrl: actionUrl });
    try {
      await githubService.pushProject(githubConfig, project.files);
      await githubService.triggerBuild(githubConfig);
      setBuildStatus({ status: 'in_progress', triggeredAt: now, artifactUrl: actionUrl });
    } catch (e) {
      setBuildStatus({ status: 'failed', error: String(e), triggeredAt: now, artifactUrl: actionUrl });
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f3f3] overflow-hidden text-[#1a1a1a] font-sans selection:bg-gray-200">
      {/* Activity Bar - Dark Neutral */}
      <div className="hidden md:flex w-12 bg-[#1a1a1a] flex-col items-center py-4 gap-4 shrink-0 z-50 border-r border-[#222]">
        <button onClick={onBack} title={t('ide.back')} className="p-2 text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 w-full flex flex-col items-center gap-4 pt-4">
          <button 
            onClick={() => {
              if (sidebarTab === 'files' && isSidebarOpen) {
                setIsSidebarOpen(false);
              } else {
                setSidebarTab('files');
                setIsSidebarOpen(true);
              }
            }}
            className={`p-2 transition-colors ${isSidebarOpen && sidebarTab === 'files' ? 'text-white' : 'text-gray-600 hover:text-white'}`}
            title={t('ide.files')}
          >
            <File size={20} />
          </button>
          <button 
            onClick={() => {
              if (sidebarTab === 'agent' && isSidebarOpen) {
                setIsSidebarOpen(false);
              } else {
                setSidebarTab('agent');
                setIsSidebarOpen(true);
              }
            }}
            className={`p-2 transition-colors ${isSidebarOpen && sidebarTab === 'agent' ? 'text-white' : 'text-gray-600 hover:text-white'}`}
            title={t('ide.agent')}
          >
            <Bot size={20} />
          </button>
          <button 
            onClick={handleBuild}
            title={t('ide.build')}
            className={`p-2 transition-colors ${buildStatus.status !== 'idle' ? 'text-blue-500' : 'text-gray-600 hover:text-white'}`}
          >
            <CloudUpload size={20} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            title="GitHub Sync"
            className="p-2 text-gray-600 hover:text-white transition-colors"
          >
            <Github size={20} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            title={t('ide.settings')}
            className="p-2 text-gray-600 hover:text-white transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
        <div className="pb-4 flex flex-col items-center gap-4">
           {user && (
             <div className="flex flex-col items-center gap-3 border-b border-white/5 pb-4 mb-2">
               {user.avatar_url ? (
                 <img src={user.avatar_url} alt={user.login} className="w-7 h-7 rounded-lg ring-1 ring-white/10 shadow-lg" />
               ) : (
                 <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                   <UserIcon size={14} className="text-blue-400" />
                 </div>
               )}
               <button 
                 onClick={logout}
                 className="p-2 text-gray-600 hover:text-white transition-colors"
                 title="Logout"
               >
                 <LogOut size={18} />
               </button>
             </div>
           )}
           {isDeleting ? (
             <button 
               onClick={() => {
                 onDeleteProject();
                 onBack();
               }}
               className="p-2 text-white bg-red-600 rounded transition-all scale-110"
               title="CONFIRM DELETE"
             >
               <Trash2 size={18} />
             </button>
           ) : (
             <button 
               onClick={() => setIsDeleting(true)}
               className="p-2 text-gray-600 hover:text-red-500 transition-colors"
               title="Delete Project"
             >
               <Trash2 size={18} />
             </button>
           )}
           {isDeleting && (
             <button onClick={() => setIsDeleting(false)} className="text-[10px] text-gray-500 uppercase font-black">
               ESC
             </button>
           )}
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile Header (only visible on small screens) */}
        <div className="md:hidden flex items-center justify-between px-4 h-12 bg-[#1a1a1a] text-white shrink-0">
          <button onClick={onBack} className="p-2 text-gray-400">
            <ArrowLeft size={18} />
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">
             {activeFile ? activeFile.name : 'Workspace'}
          </span>
          <div className="flex gap-1 items-center">
            {user && (
              <div className="flex items-center mr-2">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-lg ring-1 ring-white/20" />
                ) : (
                  <UserIcon size={14} className="text-gray-400" />
                )}
              </div>
            )}
            {buildStatus.status !== 'idle' && (
              <div 
                className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-tight mr-1 ${buildStatus.status === 'completed' ? 'cursor-pointer text-blue-400' : ''}`}
                onClick={() => buildStatus.status === 'completed' && setShowQR(true)}
              >
                <RefreshCw size={10} className={(buildStatus.status === 'in_progress' || buildStatus.status === 'queued') ? 'animate-spin' : ''} />
                <span className="max-w-[50px] truncate">
                  {buildStatus.status === 'queued' ? 'Wait...' : 
                   buildStatus.status === 'in_progress' ? 'Running' : 
                   buildStatus.status === 'failed' ? 'Error' : 
                   buildStatus.status === 'completed' ? 'Done' : buildStatus.status}
                </span>
              </div>
            )}
            <button 
              onClick={handleBuild}
              disabled={buildStatus.status === 'in_progress' || buildStatus.status === 'queued'}
              className={`p-2 transition-colors ${buildStatus.status !== 'idle' ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
              title="Build APK"
            >
              <Play size={18} />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-white">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Tab Selection REMOVED */}

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex overflow-hidden relative">
              {/* Explorer Sidebar */}
              {(isSidebarOpen && (!activeFileId || window.innerWidth >= 768)) && (
                <aside className="w-full md:w-80 flex flex-col vs-sidebar shrink-0 shadow-lg z-40 border-r border-gray-200 bg-white">
                  {sidebarTab === 'files' ? (
                    <>
                      <div className="vs-header justify-between shrink-0 bg-[#e8e8e8]">
                        <span className="text-[9px] font-black tracking-[0.2em]">{t('ide.files')}</span>
                        <Terminal size={12} className="opacity-40" />
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar pt-4">
                        <FileTree 
                          files={project.files} 
                          activeId={activeFileId} 
                          onSelect={(id) => {
                            setActiveFileId(id);
                          }} 
                          projectId={project.id}
                          onUpdate={(files) => onUpdateProject({ ...project, files })}
                        />
                      </div>
                    </>
                  ) : (
                    <AgentPanel 
                      project={project}
                      currentFile={activeFile || null}
                      onUpdateProject={onUpdateProject}
                    />
                  )}
                </aside>
              )}

              {/* Editor Area */}
              {(activeFileId || window.innerWidth >= 768) && (
                <main className={`flex-1 flex flex-col min-w-0 bg-[#ffffff] relative z-30 transition-all ${
                  activeFileId && window.innerWidth < 768 ? 'fixed inset-0 top-[48px] z-50' : ''
                }`}>
                  {activeFile ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="vs-header justify-between shrink-0 bg-[#f8f8f8] border-b border-gray-200">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <button 
                            onClick={() => setActiveFileId(null)} 
                            className="md:hidden p-1 text-gray-400 hover:text-black"
                          >
                            <ArrowLeft size={16} />
                          </button>
                          <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-300" />
                          <span className="text-[10px] text-gray-800 font-black font-mono truncate tracking-tight">{activeFile.path}</span>
                        </div>
                        <div className="flex gap-2 md:gap-6">
                          {buildStatus.status !== 'idle' && (
                            <div className="hidden sm:flex items-center gap-2 text-[9px] font-black text-gray-500 tracking-[0.1em]">
                              <RefreshCw size={10} className={buildStatus.status === 'in_progress' ? 'animate-spin' : ''} />
                              {buildStatus.status.toUpperCase()}
                            </div>
                          )}
                          <button 
                            onClick={handleBuild}
                            disabled={buildStatus.status === 'in_progress'}
                            id="build-apk-btn"
                            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-8 py-1.5 md:py-2 bg-[#1a1a1a] hover:bg-black text-white text-[9px] md:text-[10px] font-black rounded-lg shadow-2xl transition-all disabled:opacity-50 uppercase tracking-[0.1em] md:tracking-[0.15em] border border-white/10"
                          >
                            <Play size={10} fill="currentColor" />
                            <span className="hidden xs:inline">{t('ide.build')}</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 relative bg-white">
                        <Editor 
                          content={activeFile.content || ''} 
                          onChange={handleFileChange} 
                          language={
                            activeFile.name.endsWith('.tsx') ? 'typescript' :
                            activeFile.name.endsWith('.ts') ? 'typescript' :
                            activeFile.name.endsWith('.kt') ? 'kotlin' :
                            activeFile.name.endsWith('.json') ? 'json' :
                            'text'
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="hidden md:flex-1 flex flex-col items-center justify-center p-12 bg-[#ffffff]">
                      <div className="w-32 h-32 bg-[#eeeeee] rounded-full flex items-center justify-center mb-10 shadow-inner">
                        <Terminal size={48} strokeWidth={1} className="text-gray-300" />
                      </div>
                      <h2 className="text-2xl font-black text-[#1a1a1a] uppercase italic tracking-tighter">{t('dashboard.title')} IDE</h2>
                      <p className="text-[11px] text-gray-400 mt-4 text-center max-w-[280px] leading-relaxed font-medium uppercase tracking-widest">
                        Professional development target: {project.framework.toUpperCase()}
                      </p>
                      <div className="mt-12 flex gap-4">
                        <div className="px-4 py-2 bg-[#f3f3f3] rounded text-[9px] text-gray-400 font-black uppercase tracking-widest">Select file to begin</div>
                      </div>
                    </div>
                  )}
                </main>
              )}
            </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        githubConfig={githubConfig}
        onSaveGithub={async (config) => {
          if (user) {
            setGithubConfig(config);
            await firebaseService.saveSettings(user.uid, config);
          }
        }}
        repos={userRepos}
        isLoadingRepos={isLoadingRepos}
        onRefreshRepos={refreshRepos}
      />

      {/* QR Code Modal */}
      {showQR && buildStatus.status === 'completed' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-center relative p-10">
            <button 
              onClick={() => setShowQR(false)} 
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw size={32} className="text-green-500" />
            </div>

            <h2 className="text-2xl font-black text-[#1a1a1a] uppercase tracking-tighter mb-2 italic">Build Success</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Scan QR to download APK from GitHub</p>

            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-inner inline-block relative group">
              <QRCodeSVG value={buildStatus.artifactUrl || ''} size={200} />
            </div>

            <div className="mt-8 space-y-3">
              <a 
                href={buildStatus.artifactUrl} 
                target="_blank" 
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#1a1a1a] hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-gray-200"
              >
                <Download size={18} />
                Open Artifacts
              </a>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Build Artifact',
                      url: buildStatus.artifactUrl
                    });
                  }
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-100 text-gray-400 hover:text-black hover:border-gray-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
              >
                <Share2 size={18} />
                Share Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repository Bottom Sheet */}
      <div 
        className={`fixed inset-0 z-[300] transition-opacity duration-300 ease-in-out ${
          isRepoSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          onClick={() => setIsRepoSheetOpen(false)}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        />
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-2xl z-[301] max-h-[85vh] flex flex-col transform transition-transform duration-[250ms] ease-[cubic-bezier(0.2,0,0,1)] ${
            isRepoSheetOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 shrink-0" />
          
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50 shrink-0">
            <div>
              <h2 className="text-lg font-black text-[#1a1a1a] uppercase tracking-tight italic">Выберите репозиторий</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Connect your code to GitHub</p>
            </div>
            <button 
              onClick={() => setIsRepoSheetOpen(false)}
              className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-black transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <RepoList 
              repos={userRepos} 
              githubConfig={githubConfig} 
              onSelect={handleRepoSelect} 
            />
          </div>

          <div className="p-6 bg-gray-50/50 border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                <Github size={16} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest leading-none">
                Showing your latest repositories
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
