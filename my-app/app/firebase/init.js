// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdszfTnkCsrsQg9a4D3H-Dbk0Wx48k_AM",
  authDomain: "sam-internship2.firebaseapp.com",
  projectId: "sam-internship2",
  storageBucket: "sam-internship2.firebasestorage.app",
  messagingSenderId: "587287890463",
  appId: "1:587287890463:web:4f892d9cc3dbb3f7b4a32a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth();