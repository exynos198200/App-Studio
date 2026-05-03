import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Project, GitHubConfig } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      // We'll pass the auth info from the caller if needed or just use current user
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanData(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => cleanData(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanData(v)])
    );
  }
  return obj;
}

export const firebaseService = {
  async saveProject(userId: string, project: Project) {
    const path = `users/${userId}/projects/${project.id}`;
    try {
      const data = cleanData({
        ...project,
        userId,
        updatedAt: Date.now()
      });
      await setDoc(doc(db, path), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteProject(userId: string, projectId: string) {
    const path = `users/${userId}/projects/${projectId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getProjects(userId: string): Promise<Project[]> {
    const path = `users/${userId}/projects`;
    try {
      const q = query(collection(db, path));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Project);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async saveSettings(userId: string, githubConfig: GitHubConfig) {
    const path = `users/${userId}`;
    try {
      const data = cleanData({ githubConfig });
      await setDoc(doc(db, path), data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getSettings(userId: string): Promise<GitHubConfig | null> {
    const path = `users/${userId}`;
    try {
      const userDoc = await getDoc(doc(db, path));
      if (userDoc.exists()) {
        return userDoc.data()?.githubConfig || null;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async migrateFromLocalStorage(userId: string, projects: Project[], githubConfig: GitHubConfig | null) {
    const batch = writeBatch(db);
    
    projects.forEach(project => {
      const projectRef = doc(db, `users/${userId}/projects/${project.id}`);
      batch.set(projectRef, cleanData({ ...project, userId }));
    });

    if (githubConfig) {
      const userRef = doc(db, `users/${userId}`);
      batch.set(userRef, cleanData({ githubConfig }), { merge: true });
    }

    await batch.commit();
  }
};
