import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getMessaging } from "firebase/messaging";

// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCtRT0lN2pnQn3o0fajH2MapnzMdf8pXZk",
  authDomain: "todotask-74599.firebaseapp.com",
  databaseURL: "https://todotask-74599-default-rtdb.firebaseio.com",
  projectId: "todotask-74599",
  storageBucket: "todotask-74599.firebasestorage.app",
  messagingSenderId: "919531735284",
  appId: "1:919531735284:android:373f4a71dea1207533b6a1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
// export const messaging = getMessaging(app); // Enable after setting up FCM
