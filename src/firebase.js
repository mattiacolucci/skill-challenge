// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqAYTZbE0eZcEV_i9FG9tk_4XaaEEBofM",
  authDomain: "skill-challenge-45a1d.firebaseapp.com",
  projectId: "skill-challenge-45a1d",
  storageBucket: "skill-challenge-45a1d.appspot.com",
  messagingSenderId: "232281189436",
  appId: "1:232281189436:web:2d278b4a895b458b93a739"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);

// Initialize Firebase Auth provider
const provider = new GoogleAuthProvider();
// whenever a user interacts with the provider, we force them to select an account
provider.setCustomParameters({   
    prompt : "select_account "
});

const auth = getAuth();
const signInWithGooglePopup = () => signInWithPopup(auth, provider);

export {auth,signInWithGooglePopup};