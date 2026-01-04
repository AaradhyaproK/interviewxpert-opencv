import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAvb4xyFo_R8KW2WH3V9YcBBv4eeDoPEx8",
  authDomain: "fir-ai-interview.firebaseapp.com",
  projectId: "fir-ai-interview",
  storageBucket: "fir-ai-interview.appspot.com",
  messagingSenderId: "1062000559385",
  appId: "1:1062000559385:web:acc0e5815f3c9433eeb188",
  measurementId: "G-GYPNPES5RL"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;