// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
import dotenv from "dotenv";
dotenv.config();

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "virtualcourses-8a204.firebaseapp.com",
  projectId: "virtualcourses-8a204",
  storageBucket: "virtualcourses-8a204.firebasestorage.app",
  messagingSenderId: "1089782297778",
  appId: "1:1089782297778:web:df550dac88397de05305ab",
  measurementId: "G-ZHG12P8F7F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export {auth,provider}; 