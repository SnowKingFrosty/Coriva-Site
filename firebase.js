import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {
  addDoc,
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBOVzDSqrPSqwm6AFCNbu91IKK4yy0gCqM',
  authDomain: 'aethel-30d56.firebaseapp.com',
  projectId: 'aethel-30d56',
  storageBucket: 'aethel-30d56.firebasestorage.app',
  messagingSenderId: '295550667308',
  appId: '1:295550667308:web:56f48be4d5442ed308df89'
};

const app = initializeApp(firebaseConfig);

export const functions = getFunctions(app, 'us-central1');
export { httpsCallable };
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Cancel stalled transfers so the picker cannot stay disabled indefinitely.
const uploadBytes = (target, data, metadata) => new Promise((resolve, reject) => {
  const task = uploadBytesResumable(target, data, metadata);
  let expired = false;
  const timer = setTimeout(() => {
    expired = true;
    task.cancel();
    reject(Object.assign(new Error('No upload confirmation after 45 seconds. Check your connection. The site owner should also check Firebase Storage is enabled and billing is active.'), {code:'storage/upload-timeout'}));
  }, 45000);
  task.on('state_changed', undefined, error => {
    clearTimeout(timer);
    if (!expired) reject(error);
  }, () => {
    clearTimeout(timer);
    if (!expired) resolve(task.snapshot);
  });
});

export {
  EmailAuthProvider,
  addDoc,
  collection,
  createUserWithEmailAndPassword,
  deleteField,
  deleteDoc,
  deleteObject,
  doc,
  getDoc,
  getDownloadURL,
  getDocs,
  onAuthStateChanged,
  onSnapshot,
  orderBy,
  limit,
  query,
  runTransaction,
  reauthenticateWithCredential,
  ref,
  serverTimestamp,
  setDoc,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateDoc,
  uploadBytes,
  where,
  writeBatch
};
