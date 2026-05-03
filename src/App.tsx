/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { firebaseService } from './services/firebaseService';
import { storageService } from './services/storageService';
import { Project, Framework, GitHubConfig } from './types';
import Dashboard from './components/Dashboard';
import IDE from './components/IDE';
import Login from './components/Login';
import { INITIAL_PROJECT } from './constants';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        // Check for migration
        const localProjects = storageService.getProjects();
        const localGithub = localStorage.getItem('github_config');
        
        if (localProjects.length > 0 || localGithub) {
          setIsMigrating(true);
          try {
            const githubConfig = localGithub ? JSON.parse(localGithub) : null;
            await firebaseService.migrateFromLocalStorage(user.uid, localProjects, githubConfig);
            // Clear local storage after successful migration
            localStorage.removeItem('app_studio_projects');
            localStorage.removeItem('github_config');
          } catch (e) {
            console.error("Migration failed", e);
          } finally {
            setIsMigrating(false);
          }
        }

        // Load from Firestore
        const remoteProjects = await firebaseService.getProjects(user.uid);
        setProjects(remoteProjects);
      };
      loadData();
    }
  }, [user]);

  if (loading || isMigrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            {isMigrating ? 'Migrating data to cloud...' : 'Authenticating...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleCreateProject = async (name: string, framework: Framework) => {
    const newProject = INITIAL_PROJECT(name, framework);
    await firebaseService.saveProject(user.uid, newProject);
    setProjects([...projects, newProject]);
    setCurrentProjectId(newProject.id);
  };

  const handleDeleteProject = async (id: string) => {
    await firebaseService.deleteProject(user.uid, id);
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleUpdateProject = async (project: Project) => {
    await firebaseService.saveProject(user.uid, project);
    setProjects(projects.map(p => p.id === project.id ? project : p));
  };

  const currentProject = projects.find(p => p.id === currentProjectId);

  return (
    <div className="min-h-screen bg-[#f0f0f0] text-[#1a1a1a]">
      {currentProject ? (
        <IDE 
          project={currentProject} 
          onUpdateProject={handleUpdateProject}
          onDeleteProject={() => handleDeleteProject(currentProject.id)}
          onBack={() => setCurrentProjectId(null)}
        />
      ) : (
        <Dashboard 
          projects={projects}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onSelectProject={setCurrentProjectId}
        />
      )}
    </div>
  );
}

