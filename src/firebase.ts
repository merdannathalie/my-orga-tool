import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBnp2_vGs1Ssr64nvuHSWf-4W3Z7I9X3Hw",
  authDomain: "my-orga-tool.firebaseapp.com",
  projectId: "my-orga-tool",
  storageBucket: "my-orga-tool.firebasestorage.app",
  messagingSenderId: "941976444831",
  appId: "1:941976444831:web:2f1547bdf23df3e248a7aa",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
