import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA9G07B7flKHBzFSe_QtaF6lBcOuVDLREQ",
  authDomain: "dalton-kebap.firebaseapp.com",
  projectId: "dalton-kebap",
  storageBucket: "dalton-kebap.firebasestorage.app",
  messagingSenderId: "633937883385",
  appId: "1:633937883385:web:a22dc3081a17c96ea9b228",
  measurementId: "G-7YL2B51K25"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const storage = getStorage(app);