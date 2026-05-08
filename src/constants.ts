/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { FileNode, Framework, Project } from './types';

export const GITHUB_BUILD_WORKFLOW = (framework: Framework) => {
  if (framework === 'react-vite') {
    return `
name: Build Android APK (Capacitor)
on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'zulu'
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install dependencies
        run: npm install
      - name: Build web
        run: npm run build
      - name: Capacitor Sync
        run: |
          npx cap sync android || (npx cap add android && npx cap sync android)
      - name: Build APK
        run: cd android && ./gradlew assembleDebug
      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
    `;
  } else {
    return `
name: Build Android APK (Kotlin)
on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'zulu'
      - name: Build APK
        run: ./gradlew assembleDebug
      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-debug
          path: app/build/outputs/apk/debug/app-debug.apk
    `;
  }
};

const createInitialFiles = (framework: Framework, name: string): FileNode[] => {
  const files: FileNode[] = [];
  const rootId = null;

  const addFile = (id: string, fileName: string, content: string, parentId: string | null = null, type: 'file' | 'folder' = 'file') => {
    const parent = parentId ? files.find(f => f.id === parentId) : null;
    files.push({
      id,
      name: fileName,
      type,
      content,
      parentId,
      path: parent ? `${parent.path}/${fileName}` : fileName
    });
  };

  // Add GitHub Workflow only for supported frameworks
  if (framework === 'react-vite' || framework === 'kotlin-android') {
    addFile('github-folder', '.github', '', null, 'folder');
    addFile('workflows-folder', 'workflows', '', 'github-folder', 'folder');
    addFile('build-workflow', 'build.yml', GITHUB_BUILD_WORKFLOW(framework), 'workflows-folder', 'file');
  }

  if (framework === 'react-vite') {
    addFile('1', 'package.json', JSON.stringify({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        '@capacitor/core': '^6.0.0',
        '@capacitor/android': '^6.0.0'
      },
      devDependencies: {
        '@types/react': '^18.3.3',
        '@types/react-dom': '^18.3.1',
        '@vitejs/plugin-react': '^4.3.1',
        vite: '^5.0.0',
        '@capacitor/cli': '^6.0.0'
      }
    }, null, 2));
    addFile('cap-config', 'capacitor.config.ts', `import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: '${name}',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;`);
    addFile('2', 'vite.config.ts', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`);
    addFile('3', 'index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`);
    addFile('4', 'src', '', null, 'folder');
    addFile('5', 'main.tsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`, '4');
    addFile('6', 'App.tsx', `import React from 'react'

export default function App() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Hello from ${name}!</h1>
      <p>Edit src/App.tsx to get started.</p>
    </div>
  )
}`, '4');
  } else if (framework === 'kotlin-android') {
    addFile('1', 'settings.gradle.kts', `rootProject.name = "${name}"
include(":app")`);
    addFile('2', 'app', '', null, 'folder');
    addFile('3', 'build.gradle.kts', `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}`, '2');
    addFile('4', 'src', '', '2', 'folder');
    addFile('5', 'main', '', '4', 'folder');
    addFile('6', 'kotlin', '', '5', 'folder');
    addFile('7', 'com', '', '6', 'folder');
    addFile('8', 'example', '', '7', 'folder');
    addFile('9', 'MainActivity.kt', `package com.example.app

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override function onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Hello World
    }
}`, '8');
  } else if (framework === 'node-server') {
    addFile('1', 'package.json', JSON.stringify({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      main: 'index.js',
      dependencies: {
        express: '^4.19.0'
      }
    }, null, 2));
    addFile('2', 'index.js', `const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World from ${name}!');
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}/\`);
});`);
  }

  return files;
};

export const INITIAL_PROJECT = (name: string, framework: Framework): Project => ({
  id: uuidv4(),
  name,
  framework,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  files: createInitialFiles(framework, name),
});
