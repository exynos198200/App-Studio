/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Project, BuildStatus } from '../types';
import { Smartphone, RefreshCw, AlertCircle, Info, Download, QrCode, Monitor, FolderCode } from 'lucide-react';

interface PreviewProps {
  project: Project;
  buildStatus: BuildStatus;
}

export default function Preview({ project, buildStatus }: PreviewProps) {
  const [srcDoc, setSrcDoc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'mobile' | 'pc'>('mobile');

  useEffect(() => {
    if (project.framework === 'kotlin') return;
    
    const transpile = async () => {
      try {
        const appFile = project.files.find(f => f.name === 'App.tsx');
        if (!appFile) {
          setSrcDoc(`
            <html>
              <body style="background: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif;">
                <div style="text-align: center; color: #94a3b8;">
                  <p style="font-weight: bold;">App.tsx not found</p>
                  <p style="font-size: 10px;">Create App.tsx in the root to see live preview.</p>
                </div>
              </body>
            </html>
          `);
          return;
        }

        // Simple mock of RN for web preview
        const mockRNText = `
          const React = window.React;
          const { useState, useEffect, useRef } = React;
          const ReactNative = {
            View: (props) => React.createElement('div', { ...props, style: { display: 'flex', flexDirection: 'column', ...props.style } }),
            Text: (props) => React.createElement('span', { ...props, style: { color: project.framework === 'react-native' ? 'black' : 'inherit', ...props.style } }),
            StyleSheet: {
              create: (obj) => obj
            },
            TouchableOpacity: (props) => React.createElement('button', { ...props, style: { background: 'none', border: 'none', padding: 0, ...props.style } }),
          };
          window.ReactNative = ReactNative;
        `;

        // Using Babel standalone for transpilation
        const { transform } = (window as any).Babel;
        const code = transform(appFile.content, {
          presets: ['react', 'typescript'],
          filename: 'App.tsx'
        }).code;

        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
              <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                body { margin: 0; background: #ffffff; color: #1a1a1a; font-family: sans-serif; }
                #root { height: 100vh; overflow: auto; }
              </style>
            </head>
            <body>
              <div id="root"></div>
              <script>
                ${mockRNText}
                const { View, Text, StyleSheet, TouchableOpacity } = window.ReactNative;
                ${code.replace(/import .* from .*/g, '')}
                
                const Component = exports.default || App;
                ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Component));
              </script>
            </body>
          </html>
        `;
        setSrcDoc(html);
        setError(null);
      } catch (e) {
        setError(String(e));
      }
    };

    const timeout = setTimeout(transpile, 500);
    return () => clearTimeout(timeout);
  }, [project.files, project.framework]);

  const githubActionsUrl = buildStatus.artifactUrl || '#';

  if (project.framework === 'kotlin') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
        {buildStatus.status !== 'idle' ? (
          <>
            <div className="w-64 h-64 bg-white rounded-3xl p-4 shadow-xl border border-gray-100 flex items-center justify-center relative mb-8">
               <QrCode size={200} className="text-gray-900" />
               <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-3xl flex items-center justify-center">
                 <a 
                   href={githubActionsUrl}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest hover:bg-black transition-colors"
                 >
                   View Actions
                 </a>
               </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Build in Progress</h3>
            <p className="text-gray-500 text-center text-sm max-w-[280px]">
              The QR code links to your GitHub Actions. Build status: <span className="font-black uppercase text-gray-900">{buildStatus.status}</span>
            </p>
          </>
        ) : (
          <div className="text-center">
            <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm mb-6 inline-block">
              <FolderCode size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Build Active</h3>
            <p className="text-sm text-gray-500 mt-2">Initialize a build to see the QR code.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#f3f3f3] custom-scrollbar">
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2 text-gray-800">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Simulation</span>
        </div>
        <div className="flex bg-[#f3f3f3] p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Smartphone size={14} />
          </button>
          <button 
            onClick={() => setViewMode('pc')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'pc' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Monitor size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative p-12 flex justify-center overflow-y-auto bg-[#eeeeee]">
        {viewMode === 'mobile' ? (
          <div className="relative w-[320px] h-[640px] bg-[#1a1a1a] rounded-[50px] border-[8px] border-[#222] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] overflow-hidden shrink-0 h-fit mt-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#222] rounded-b-2xl z-20" />
            <div className="w-full h-[624px] bg-white relative z-10">
              {error ? (
                <div className="p-8 text-black text-xs font-mono h-full flex flex-col items-center justify-center bg-gray-50">
                   <AlertCircle size={32} className="text-gray-300 mb-4" />
                   <p className="font-black uppercase tracking-widest text-[10px] text-gray-400">Simulation Error</p>
                   <div className="mt-4 text-center text-red-500 font-bold">{error}</div>
                </div>
              ) : (
                <iframe title="preview" srcDoc={srcDoc} className="w-full h-full border-none" />
              )}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-gray-200 aspect-video overflow-hidden">
             {error ? (
                <div className="p-8 text-black text-xs font-mono h-full flex flex-col items-center justify-center">
                   <AlertCircle size={32} className="text-gray-300 mb-4" />
                   <p className="font-black uppercase tracking-widest text-[10px] text-gray-400">Simulation Error</p>
                   <div className="mt-4 text-center text-red-500 font-bold">{error}</div>
                </div>
              ) : (
                <iframe title="preview" srcDoc={srcDoc} className="w-full h-full border-none" />
              )}
          </div>
        )}

        {/* Floating Tooltip */}
        <div className="absolute bottom-10 right-10 max-w-[200px] bg-[#1a1a1a] text-white p-5 rounded-2xl shadow-2xl">
           <div className="flex items-center gap-2 mb-3">
             <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest border-b border-white/20 pb-1">Status Report</span>
           </div>
           <p className="text-[9px] text-white/60 leading-relaxed font-bold uppercase tracking-tight">
             Native simulation active. Cloud integration ready for production build.
           </p>
        </div>
      </div>
      
      {buildStatus.status !== 'idle' && (
        <div className="px-8 py-5 bg-[#1a1a1a] text-white flex items-center justify-between gap-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl z-50">
           <div className="flex items-center gap-4">
             <RefreshCw size={14} className={buildStatus.status === 'in_progress' ? 'animate-spin' : ''} />
             <span>Status: {buildStatus.status}</span>
           </div>
           <button 
             onClick={() => window.open(`https://github.com/`, '_blank')}
             className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded border border-white/10 transition-all font-black text-[9px]"
           >
             View Cloud Logs
           </button>
        </div>
      )}
    </div>
  );
}
