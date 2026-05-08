/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Framework } from '../types';
import { Plus, Trash2, FolderCode, Smartphone, Calendar, Search, Download, X, LogOut, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  projects: Project[];
  onCreateProject: (name: string, framework: Framework) => void;
  onDeleteProject: (id: string) => void;
  onSelectProject: (id: string) => void;
}

import { useSettings } from '../context/SettingsContext';

export default function Dashboard({ projects, onCreateProject, onDeleteProject, onSelectProject }: DashboardProps) {
  const { user, logout } = useAuth();
  const { t } = useSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<Framework>('react-vite');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const templates: { id: Framework; label: string; icon: React.ReactNode }[] = [
    { id: 'react-vite', label: t('templates.react'), icon: <Smartphone size={24} /> },
    { id: 'kotlin-android', label: t('templates.kotlin'), icon: <Smartphone size={24} /> },
    { id: 'node-server', label: t('templates.node'), icon: <FolderCode size={24} /> },
    { id: 'empty', label: t('templates.empty'), icon: <Plus size={24} /> },
  ];

  const handleDownload = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const zip = new JSZip();
    
    project.files.forEach(file => {
      if (file.type === 'file') {
        zip.file(file.path, file.content || '');
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${project.name.toLowerCase().replace(/\s+/g, '-')}.zip`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:p-12">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-12">
        <div className="flex justify-between items-start w-full md:w-auto">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight uppercase italic">
              {t('dashboard.title')}
            </h1>
            <p className="text-[#666] mt-1 font-medium text-xs sm:text-sm">{t('dashboard.subtitle')}</p>
          </div>
          
          {/* Mobile User Profile (only shown when not on desktop) */}
          <div className="md:hidden">
            {user && (
              <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-2 py-1.5 shadow-sm">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full border border-gray-100" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#f3f3f3] flex items-center justify-center">
                    <UserIcon size={12} className="text-gray-400" />
                  </div>
                )}
                <button 
                  onClick={logout}
                  className="p-1 px-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row items-center justify-between md:justify-end gap-3 sm:gap-8 w-full md:w-auto">
          {/* Desktop User Profile (hidden on mobile) */}
          <div className="hidden md:block">
            {user && (
              <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-xl border border-gray-100 shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#f3f3f3] flex items-center justify-center">
                      <UserIcon size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-[#1a1a1a]">
                      {user.login}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[9px] font-bold text-green-600 uppercase tracking-tight">Active Session</p>
                    </div>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-100 mx-1" />
                <button 
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-[#333] text-white px-4 sm:px-6 py-3 rounded-lg font-black text-[10px] sm:text-xs tracking-widest transition-all shadow-xl shadow-gray-200/50 uppercase whitespace-nowrap"
          >
            <Plus size={18} strokeWidth={3} />
            {t('dashboard.create')}
          </button>
        </div>
      </header>

      <div className="relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder={t('dashboard.filter')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#e8e8e8] border border-transparent rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-300 transition-all placeholder:text-gray-500 text-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="group relative bg-[#f5f5f5] border border-[#e0e0e0] rounded-2xl p-8 hover:border-gray-500 hover:bg-white hover:shadow-2xl transition-all cursor-pointer"
              onClick={() => onSelectProject(project.id)}
            >
              <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-xl bg-white border border-gray-100 shadow-sm text-gray-600 group-hover:text-black group-hover:scale-110 transition-all`}>
                  {project.framework === 'node-server' ? <FolderCode size={24} /> : <Smartphone size={24} />}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleDownload(e, project)}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                    title="Download ZIP"
                  >
                    <Download size={18} />
                  </button>
                  {deletingId === project.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                          setDeletingId(null);
                        }}
                        className="px-2 py-1 bg-black text-white text-[9px] font-black rounded uppercase tracking-tighter"
                      >
                        CONFIRM
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="p-1 text-gray-400 hover:text-black"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(project.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-black text-[#1a1a1a] mb-2 uppercase tracking-tight">{project.name}</h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase bg-[#1a1a1a] text-white px-2 py-0.5 rounded tracking-widest">
                  {project.framework}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Calendar size={10} />
                  {format(project.updatedAt, 'MMM d')}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-32 h-32 bg-[#eeeeee] rounded-full flex items-center justify-center mb-10 shadow-inner">
            <Smartphone size={48} className="text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-[#1a1a1a] uppercase italic tracking-tighter">{t('dashboard.no_projects')}</h2>
          <p className="text-gray-400 mt-3 max-w-sm leading-relaxed font-medium">
            {t('dashboard.no_projects_desc')}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-10 px-10 py-4 bg-[#1a1a1a] hover:bg-black text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-2xl transition-all"
          >
            {t('dashboard.create')}
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-[4px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-2xl shadow-3xl overflow-y-auto max-h-[90vh] no-scrollbar"
          >
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-8 border-b border-gray-100 pb-4">{t('dashboard.new_project')}</h2>
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{t('dashboard.project_name')}</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#f3f3f3] border-none rounded-lg px-5 py-4 focus:outline-none focus:bg-[#e0e0e0] transition-all font-bold text-gray-900 placeholder:text-gray-300"
                  placeholder="MY_PROJECT..."
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">{t('dashboard.select_template')}</label>
                <div className="grid grid-cols-2 gap-4">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedFramework(template.id)}
                      className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                        selectedFramework === template.id 
                          ? 'border-gray-900 bg-gray-50' 
                          : 'border-transparent bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className={selectedFramework === template.id ? 'text-black scale-110 transition-transform' : 'text-gray-400'}>
                        {template.icon}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        selectedFramework === template.id ? 'text-black' : 'text-gray-500'
                      }`}>
                        {template.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
                >
                  {t('dashboard.cancel')}
                </button>
                <button
                  disabled={!newName}
                  onClick={() => {
                    onCreateProject(newName, selectedFramework);
                    setIsModalOpen(false);
                    setNewName('');
                  }}
                  className="flex-1 px-4 py-4 bg-[#1a1a1a] hover:bg-black disabled:opacity-30 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-gray-900/20"
                >
                  {t('dashboard.create')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
