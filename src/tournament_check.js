// Import the functions you need from the SDKs you need
const firebaseApp = require("firebase/app");
const firebaseAuth = require("firebase/auth");
const firestore = require("firebase/firestore");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_APP_FIREBASE_KEY,
  authDomain: "music-game-8710e.firebaseapp.com",
  projectId: "music-game-8710e",
  storageBucket: "music-game-8710e.appspot.com",
  messagingSenderId: "955429438522",
  appId: "1:955429438522:web:7686269aa3a01278dc6103"
};

// Initialize Firebase
const app = firebaseApp.initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = firestore.getFirestore(app);

const auth = firebaseAuth.getAuth();

module.exports=function(){
    firebaseAuth.signInWithEmailAndPassword(auth,  process.env.VITE_APP_FIREBASE_EMAIL,  process.env.VITE_APP_FIREBASE_PASSW).then((u)=>{
        firestore.setDoc(firestore.doc(db,"users",u.user.uid));
    });
}