/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GitHubConfig, FileNode } from '../types';

export const githubService = {
  pushProject: async (config: GitHubConfig, files: FileNode[]) => {
    const { token, owner, repo } = config;
    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    const uploadFile = async (file: FileNode) => {
      if (file.type === 'folder') return;
      
      const path = file.path;
      const content = btoa(unescape(encodeURIComponent(file.content || '')));
      
      // Get current SHA if file exists
      let sha: string | undefined;
      try {
        const res = await fetch(`${baseUrl}/contents/${path}`, { headers });
        if (res.ok) {
          const data = await res.json();
          sha = data.sha;
        }
      } catch (e) {}

      // Add a small delay between requests to avoid GitHub API abuse/concurrency issues
      await new Promise(resolve => setTimeout(resolve, 200));

      const body = {
        message: `Sync ${path} via App Studio Pro`,
        content,
        sha,
      };

      const res = await fetch(`${baseUrl}/contents/${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(`Failed to upload ${path}: ${err.message}`);
      }
    };

    // Sequential upload is safer to avoid git conflicts on the remote branch
    for (const file of files) {
      await uploadFile(file);
    }
  },

  triggerBuild: async (config: GitHubConfig) => {
    const { token, owner, repo } = config;
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/build.yml/dispatches`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };

    // Wait a bit after pushing files for GitHub to process the latest commit
    await new Promise(resolve => setTimeout(resolve, 2000));

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: 'main' }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Failed to trigger build: ${err.message}`);
    }
  },

  getLatestRun: async (config: GitHubConfig) => {
    const { token, owner, repo } = config;
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };

    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.workflow_runs[0];
  },

  getUserRepos: async (token: string) => {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };
    
    const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers });
    if (!res.ok) {
      throw new Error('Failed to fetch repositories');
    }
    return res.json();
  }
};
