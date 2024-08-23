// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { collection, doc, DocumentSnapshot, getDoc, getDocs, getFirestore, limit, orderBy, query, QuerySnapshot, setDoc, updateDoc, where } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { skills } from "./assets/data";
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
const signOutWithGoogle = () => signOut(auth);

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

//get skill records
const getSkillRecords=async (skill, skillParameters, country)=>{
    var records={};

    //NOT WORKSS

    try{
        switch(skill){
            case 0:  //FAST TYPING SKILL
                //get world records
                const totTimeWR=await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),orderBy("totTime"),limit(1))
                );
                const avgTimeWR=await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),orderBy("avgTime"),limit(1))
                );
                const fastestWordWR=await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),orderBy("fastestWord"),limit(1))
                );

                //get national records
                const nationalUsers=await getDocs(query(collection(db,"users"),where("country","==",country)));
                var totTimeNR, avgTimeNR, fastestWordNR;
                if(!nationalUsers.empty){  //if national users exists get national records

                    const nationalUsersIds=nationalUsers.docs.map(usr=>usr.id);

                    totTimeNR=await getDocs(
                        query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                        where("skill","==",skills[0].title),where("user","in",nationalUsersIds),orderBy("totTime"),limit(1))
                    );
                    avgTimeNR=await getDocs(
                        query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                        where("skill","==",skills[0].title),where("user","in",nationalUsersIds),orderBy("avgTime"),limit(1))
                    );
                    fastestWordNR=await getDocs(
                        query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                        where("skill","==",skills[0].title),where("user","in",nationalUsersIds),orderBy("fastestWord"),limit(1))
                    );
                }else{  //there is no national record in this case
                    totTimeNR=0;
                    avgTimeNR=0;
                    fastestWordNR=0;
                }

                records={
                    "WR":{
                        totTime:(!totTimeWR.empty)?totTimeWR.docs[0].data().totTime:null,
                        avgTime:(!avgTimeWR.empty)?avgTimeWR.docs[0].data().avgTime:null,
                        fastestWord:(!fastestWordWR.empty)?fastestWordWR.docs[0].data().fastestWord:null,
                    },
                    "NR":{
                        totTime:(totTimeNR.empty || totTimeNR==0)?null:totTimeNR.docs[0].data().totTime,
                        avgTime:(avgTimeNR.empty || avgTimeNR==0)?null:avgTimeNR.docs[0].data().avgTime,
                        fastestWord:(fastestWordNR.empty || fastestWordNR==0)?null:fastestWordNR.docs[0].data().fastestWord,
                    }
                }
                
                break;
            default:
                break;
        }

        return [true,records];
    }catch(e){
        return [false,e];
    }
}

const storeGameResult=async (result)=>{
    try{
        await setDoc(doc(db,"games",auth.currentUser.uid+(new Date().getTime())),result);
        return [true,"Success"];
    }catch(e){
        console.log(e);
        return [false,e.message];
    }
}

const updateUserLvExp=async(lv,exp)=>{
    try{
        await updateDoc(doc(db,"users",auth.currentUser.uid),{
            lv:lv,exp:exp
        });
        return [true,"Success"];
    }catch(e){
        return [false,e.message];
    }
}

export {auth,signInWithGooglePopup,signOutWithGoogle,createUserAccount,checkUserExists,getUserData,getSkillRecords,
    storeGameResult,updateUserLvExp};