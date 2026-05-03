/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { FileNode, Framework, Project } from './types';

export const GITHUB_BUILD_WORKFLOW = (framework: Framework) => {
  if (framework === 'react-native') {
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
        run: npx cap sync android
      - name: Patch Cleartext Traffic
        run: |
          sed -i 's/android:supportsRtl="true"/android:supportsRtl="true" android:usesCleartextTraffic="true"/' android/app/src/main/AndroidManifest.xml
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

const createInitialFiles = (framework: Framework): FileNode[] => {
  return [];
};

export const INITIAL_PROJECT = (name: string, framework: Framework): Project => ({
  id: uuidv4(),
  name,
  framework,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  files: createInitialFiles(framework),
});
