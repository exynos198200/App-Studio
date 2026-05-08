/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  parentId: string | null;
  path: string;
}

export type Theme = 'dark' | 'light';
export type Language = 'en' | 'ru';

export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface AISettings {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

export type Framework = 'react-vite' | 'kotlin-android' | 'node-server' | 'empty';

export interface Project {
  id: string;
  name: string;
  framework: Framework;
  updatedAt: number;
  createdAt: number;
  files: FileNode[];
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface BuildStatus {
  status: 'idle' | 'queued' | 'in_progress' | 'completed' | 'failed';
  runId?: number;
  artifactUrl?: string;
  error?: string;
  triggeredAt?: number;
}
