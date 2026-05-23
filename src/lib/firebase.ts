import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "gen-lang-client-0085257873.firebaseapp.com",
  projectId: "gen-lang-client-0085257873",
  storageBucket: "gen-lang-client-0085257873.firebasestorage.app",
  messagingSenderId: "351208561746",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-4ba63741-ec0a-4cb1-851d-e65f30a89901");

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

githubProvider.addScope('repo');
githubProvider.addScope('workflow');
