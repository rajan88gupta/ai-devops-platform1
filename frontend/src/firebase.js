import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA4CMAUfl-D0VDlnfykmxqW8G6w3nMg980",
  authDomain: "ai-devops-platform.firebaseapp.com",
  projectId: "ai-devops-platform",
  storageBucket: "ai-devops-platform.firebasestorage.app",
  messagingSenderId: "491709837706",
  appId: "1:491709837706:web:6033743fab3b58302f1873",
  measurementId: "G-G762E9TTE9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 🔥 FORCE SINGLE ACTIVE LOGIN ONLY (NO SESSION MIXING)
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Session persistence enabled (single user only) ✅");
  })
  .catch((err) => {
    console.error(err);
  });