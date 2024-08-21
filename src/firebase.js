// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

// Initialize Firebase Auth provider
const provider = new GoogleAuthProvider();
// whenever a user interacts with the provider, we force them to select an account
provider.setCustomParameters({   
    prompt : "select_account "
});

const auth = getAuth();
const signInWithGooglePopup = () => signInWithPopup(auth, provider);

//QUERIES

//create user

const createUserAccount=async (country)=>{
    try{
        await setDoc(doc(db,"users",auth.currentUser.uid),{
            country:country,
            lv:1,
            exp:0
        })
        return [true,"Success"];
    }catch(e){
        console.log(e);
        return [false,e.message];
    }
}

//returns true if a user with one uid exists and false elsewhere
const checkUserExists = async (uid)=>{
    try{
        const resp = await getDoc(doc(db,"users",uid));
        if (resp.exists()) {
            return true;
        } else {
            return false;
        }
    }catch(e){
        return false;
    }
}

//get user data by its uid
const getUserData = async (uid)=>{
    try{
        const resp = await getDoc(doc(db,"users",uid));
        if (resp.exists()) {
            const userData=resp.data();
            return [true,userData];
        } else {
            return [false,"User does not exists"];
        }
    }catch(e){
        return [false,e.message];
    }
}

export {auth,signInWithGooglePopup,createUserAccount,checkUserExists,getUserData};