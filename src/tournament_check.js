import { initializeApp } from "firebase/app";
import { addDoc, collection, count, deleteDoc, doc, DocumentSnapshot, FieldPath, getCountFromServer, getDoc, getDocs, getFirestore, limit, orderBy, query, QuerySnapshot, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_APP_FIREBASE_KEY,
    authDomain: "skill-challenge-45a1d.firebaseapp.com",
    projectId: "skill-challenge-45a1d",
    storageBucket: "skill-challenge-45a1d.appspot.com",
    messagingSenderId: "232281189436",
    appId: "1:232281189436:web:2d278b4a895b458b93a739"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);

//get db
const db = getFirestore(firebase);

const auth = getAuth();

module.exports=function(){
    signInWithEmailAndPassword(auth,import.meta.env.VITE_APP_FIREBASE_EMAIL,import.meta.env.VITE_APP_FIREBASE_PASSW).then(async(user)=>{
        const uid = user.user.uid;
        await setDoc(doc(db,"user",uid));
    });
}