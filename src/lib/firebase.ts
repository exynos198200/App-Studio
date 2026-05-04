import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0085257873",
  appId: "1:351208561746:web:d2bc47cde7740f81b1938b",
  apiKey: "AIzaSyBDK5AGVVj5RsKQDvOjiup4ydizuJB9RU8",
  authDomain: "gen-lang-client-0085257873.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-4ba63741-ec0a-4cb1-851d-e65f30a89901",
  storageBucket: "gen-lang-client-0085257873.firebasestorage.app",
  messagingSenderId: "351208561746",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('repo');
githubProvider.addScope('workflow');
