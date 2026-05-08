/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileNode } from '../types';
import { ChevronRight, ChevronDown, File, Folder, Plus, Trash2, Edit2, FileJson, FileCode, FolderPlus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface FileTreeProps {
  files: FileNode[];
  activeId: string | null;
  onSelect: (id: string) => void;
  projectId: string;
  onUpdate: (files: FileNode[]) => void;
}

export default function FileTree({ files, activeId, onSelect, onUpdate }: FileTreeProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'file' | 'folder' | null>(null);
  const [tempName, setTempName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');

  const currentFolder = currentFolderId ? files.find(f => f.id === currentFolderId) : null;

  const getBreadcrumbs = () => {
    const crumbs = [{ id: null as string | null, name: 'Root' }];
    if (!currentFolderId) return crumbs;

    const path: { id: string | null; name: string }[] = [];
    let current = files.find(f => f.id === currentFolderId);
    while (current) {
      path.unshift({ id: current.id, name: current.name });
      current = files.find(f => f.id === current.parentId);
    }
    return [...crumbs, ...path];
  };

  const getIcon = (file: FileNode) => {
    if (file.type === 'folder') return <Folder size={14} className="text-gray-900" />;
    const name = file.name.toLowerCase();
    if (name.endsWith('.json')) return <FileJson size={14} className="text-gray-400" />;
    if (name.endsWith('.tsx') || name.endsWith('.kt')) return <FileCode size={14} className="text-gray-500" />;
    return <File size={14} className="text-gray-400" />;
  };

  const deleteNode = (id: string) => {
    if (window.confirm('Delete this item?')) {
      const toDelete = new Set([id]);
      const findChildren = (pid: string) => {
        files.filter(f => f.parentId === pid).forEach(child => {
          toDelete.add(child.id);
          findChildren(child.id);
        });
      };
      findChildren(id);
      onUpdate(files.filter(f => !toDelete.has(f.id)));
    }
  };

  const submitCreate = () => {
    if (!tempName || !creatingType) {
      setCreatingType(null);
      setTempName('');
      return;
    }
    
    const parentPath = currentFolder?.path || '';
    const path = parentPath ? `${parentPath}/${tempName}` : tempName;
    
    const newNode: FileNode = {
      id: uuidv4(),
      name: tempName,
      type: creatingType,
      parentId: currentFolderId,
      path,
      content: creatingType === 'file' ? '' : undefined,
    };
    
    onUpdate([...files, newNode]);
    if (newNode.type === 'file') onSelect(newNode.id);
    else setCurrentFolderId(newNode.id);
    
    setCreatingType(null);
    setTempName('');
  };

  const submitRename = () => {
    if (!renamingId || !renamingName) {
      setRenamingId(null);
      return;
    }
    const node = files.find(f => f.id === renamingId);
    if (!node) return;
    const parentNode = node.parentId ? files.find(f => f.id === node.parentId) : null;
    const parentPath = parentNode?.path || '';
    const newPath = parentPath ? `${parentPath}/${renamingName}` : renamingName;

    const updatedFiles = files.map(f => {
      if (f.id === renamingId) return { ...f, name: renamingName, path: newPath };
      if (f.path.startsWith(node.path + '/')) {
        const relativePath = f.path.slice(node.path.length);
        return { ...f, path: newPath + relativePath };
      }
      return f;
    });
    onUpdate(updatedFiles);
    setRenamingId(null);
  };

  const visibleFiles = files
    .filter(f => f.parentId === currentFolderId)
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));

  return (
    <div className="flex flex-col h-full bg-[#f9f9f9]">
      {/* Header with New buttons */}
      <div className="flex px-4 py-3 gap-2 items-center border-b border-gray-200 bg-white">
        <button 
          onClick={() => { setCreatingType('file'); setTempName(''); }} 
          className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black transition-all flex items-center gap-1.5"
          title="New File"
        >
          <Plus size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">File</span>
        </button>
        <button 
          onClick={() => { setCreatingType('folder'); setTempName(''); }} 
          className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-black transition-all flex items-center gap-1.5"
          title="New Folder"
        >
          <FolderPlus size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Folder</span>
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 flex flex-wrap items-center gap-1 border-b border-gray-100 bg-white overflow-x-auto no-scrollbar">
        {getBreadcrumbs().map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-gray-300 text-[10px] mx-0.5">/</span>}
            <button 
              onClick={() => { setCurrentFolderId(crumb.id); setCreatingType(null); }}
              className={`text-[10px] font-bold uppercase tracking-tight whitespace-nowrap px-1 py-0.5 rounded transition-colors ${
                idx === getBreadcrumbs().length - 1 ? 'text-black bg-gray-100' : 'text-gray-400 hover:text-black hover:bg-gray-50'
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-1">
        {visibleFiles.map(file => {
          const isSelected = activeId === file.id;
          const isRenaming = renamingId === file.id;

          return (
            <div key={file.id}>
              {isRenaming ? (
                <div className="flex items-center gap-2 py-2 px-4 bg-gray-50 border-y border-gray-100">
                  {getIcon(file)}
                  <input
                    autoFocus
                    className="bg-transparent text-[12px] outline-none border-b border-black w-full font-bold"
                    value={renamingName}
                    onChange={(e) => setRenamingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitRename();
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onBlur={submitRename}
                  />
                </div>
              ) : (
                <div 
                  className={`group flex items-center gap-3 py-2 px-4 cursor-pointer select-none transition-all border-l-4 ${isSelected ? 'bg-white border-black shadow-sm' : 'hover:bg-white/50 text-gray-500 border-transparent'}`}
                  onClick={() => {
                    if (file.type === 'folder') {
                      setCurrentFolderId(file.id);
                      setCreatingType(null);
                    } else {
                      onSelect(file.id);
                    }
                  }}
                >
                  <div className="flex-shrink-0">{getIcon(file)}</div>
                  <span className={`text-[12px] truncate flex-1 font-medium ${isSelected ? 'text-black font-bold' : ''}`}>
                    {file.name}
                  </span>
                  
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setRenamingId(file.id); setRenamingName(file.name); }} 
                      className="p-1 hover:text-black hover:bg-gray-200 rounded transition-colors"
                      title="Rename"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNode(file.id); }} 
                      className="p-1 hover:text-black hover:bg-gray-200 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* inline creation */}
        {creatingType && (
          <div className="flex items-center gap-3 py-2 px-4 bg-white border-l-4 border-gray-400">
            <div className="flex-shrink-0">
               {creatingType === 'folder' ? <Folder size={14} className="text-gray-900" /> : <File size={14} className="text-gray-400" />}
            </div>
            <input
              autoFocus
              className="bg-transparent text-[12px] outline-none border-b border-black w-full font-bold"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitCreate();
                if (e.key === 'Escape') setCreatingType(null);
              }}
              onBlur={submitCreate}
              placeholder={`new ${creatingType}...`}
            />
          </div>
        )}

        {visibleFiles.length === 0 && !creatingType && (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center select-none">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
              <FolderPlus size={32} className="text-gray-300" />
            </div>
            <p className="text-[12px] font-black text-[#1a1a1a] uppercase tracking-tighter italic mb-2">Project is Empty</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-8">
              Start by creating your first file or structural folder
            </p>
            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={() => { setCreatingType('file'); setTempName(''); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
              >
                <Plus size={14} />
                Create Index File
              </button>
              <button 
                onClick={() => { setCreatingType('folder'); setTempName(''); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-100 text-gray-400 hover:text-black hover:border-gray-200 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                <FolderPlus size={14} />
                Add Source Folder
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
