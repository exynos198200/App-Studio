/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, FileNode } from '../types';

const PROJECTS_KEY = 'app_studio_projects';

export const storageService = {
  getProjects: (): Project[] => {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveProjects: (projects: Project[]) => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  addProject: (project: Project) => {
    const projects = storageService.getProjects();
    storageService.saveProjects([...projects, project]);
  },

  updateProject: (project: Project) => {
    const projects = storageService.getProjects();
    const updated = projects.map(p => p.id === project.id ? { ...project, updatedAt: Date.now() } : p);
    storageService.saveProjects(updated);
  },

  deleteProject: (id: string) => {
    const projects = storageService.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    storageService.saveProjects(filtered);
  },

  duplicateProject: (project: Project) => {
    const newProject = {
      ...project,
      id: crypto.randomUUID(),
      name: `${project.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    storageService.addProject(newProject);
    return newProject;
  }
};
