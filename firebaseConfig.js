import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDiy0ppbDGrp0H7ZVDTbojbUHZpEE7ZuCU",
  authDomain: "meteo-d18e3.firebaseapp.com",
  projectId: "meteo-d18e3",
  storageBucket: "meteo-d18e3.firebasestorage.app",
  messagingSenderId: "502381470758",
  appId: "1:502381470758:web:c6cab293d8fee6b26432e7",
  measurementId: "G-9W38H5EHGM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;