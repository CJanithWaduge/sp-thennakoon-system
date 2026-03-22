import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  enableIndexedDbPersistence 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDuOCUMbZwEYUvelhnfiJmZTFVR9XmooE8",
  authDomain: "agency-system---sp-thennakoon.firebaseapp.com",
  projectId: "agency-system---sp-thennakoon",
  storageBucket: "agency-system---sp-thennakoon.firebasestorage.app",
  messagingSenderId: "1053405539239",
  appId: "1:1053405539239:web:d8cf3232578e2f902e2482"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence (keeps app working if Wi-Fi drops)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support all of the features required to enable offline persistence.');
  }
});

export { db, auth };