import { GitHubConfig, FileNode } from '../types';
import { CapacitorHttp } from '@capacitor/core';

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
        const res = await CapacitorHttp.request({
          url: `${baseUrl}/contents/${path}`,
          method: 'GET',
          headers
        });
        if (res.status === 200) {
          sha = res.data.sha;
        }
      } catch (e) {}

      // Add a small delay between requests to avoid GitHub API abuse/concurrency issues
      await new Promise(resolve => setTimeout(resolve, 200));

      const body = {
        message: `Sync ${path} via App Studio Pro`,
        content,
        sha,
      };

      const res = await CapacitorHttp.request({
        url: `${baseUrl}/contents/${path}`,
        method: 'PUT',
        headers,
        data: body,
      });

      if (res.status < 200 || res.status >= 300) {
        throw new Error(`Failed to upload ${path}: ${res.data?.message || 'Unknown error'}`);
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

    const res = await CapacitorHttp.request({
      url,
      method: 'POST',
      headers,
      data: { ref: 'main' },
    });

    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Failed to trigger build: ${res.data?.message || 'Unknown error'}`);
    }
  },

  getLatestRun: async (config: GitHubConfig) => {
    const { token, owner, repo } = config;
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };

    const res = await CapacitorHttp.request({
      url,
      method: 'GET',
      headers
    });
    if (res.status !== 200) return null;
    return res.data.workflow_runs[0];
  },

  getUserRepos: async (token: string) => {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    };
    
    const res = await CapacitorHttp.request({
      url: 'https://api.github.com/user/repos?per_page=100&sort=updated',
      method: 'GET',
      headers
    });
    if (res.status !== 200) {
      throw new Error('Failed to fetch repositories');
    }
    return res.data;
  }
};
