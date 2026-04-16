import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAmcF2roRnFALsScxLj-fkI9ULYSVthw4o",
  authDomain: "ai-devops-saas-platform.firebaseapp.com",
  projectId: "ai-devops-saas-platform",
  storageBucket: "ai-devops-saas-platform.firebasestorage.app",
  messagingSenderId: "14932429860",
  appId: "1:14932429860:web:5f85866f6df12a4ae25cb1",
  measurementId: "G-P22DP63SY0"
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