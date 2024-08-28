// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { addDoc, collection, count, deleteDoc, doc, DocumentSnapshot, getDoc, getDocs, getFirestore, limit, orderBy, query, QuerySnapshot, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
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
            exp:0,
            numGames:0,
            username:auth.currentUser.displayName,
            records:{},
            creationDate:new Date()
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

//get skill leaderbord. Get best games for each skill parameter in the world and in the user's country. Funrthermore, get 
//user's personal best games according to each skill parameter
const getSkillLeaderboard=async (uidUser, skill, skillParameters, country, limitResults=1)=>{
    var records={};

    //NOT WORKSS

    try{
        switch(skill){
            case 0:  //FAST TYPING SKILL
                //get world records
                const totTimeWR=await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),orderBy("totTime"),limit(limitResults))
                );
                const avgTimeWR=await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),orderBy("avgTime"),limit(limitResults))
                );
                const fastestWordWR=await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),orderBy("fastestWord"),limit(limitResults))
                );

                //get national records
                const nationalUsers=await getDocs(query(collection(db,"users"),where("country","==",country)));
                var totTimeNR, avgTimeNR, fastestWordNR;
                if(!nationalUsers.empty){  //if national users exists get national records

                    const nationalUsersIds=nationalUsers.docs.map(usr=>usr.id);

                    totTimeNR=await getDocs(
                        query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                        where("skill","==",skills[0].title),where("user","in",nationalUsersIds),orderBy("totTime"),limit(limitResults))
                    );
                    avgTimeNR=await getDocs(
                        query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                        where("skill","==",skills[0].title),where("user","in",nationalUsersIds),orderBy("avgTime"),limit(limitResults))
                    );
                    fastestWordNR=await getDocs(
                        query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                        where("skill","==",skills[0].title),where("user","in",nationalUsersIds),orderBy("fastestWord"),limit(limitResults))
                    );
                }else{  //there is no national record in this case
                    totTimeNR=0;
                    avgTimeNR=0;
                    fastestWordNR=0;
                }

                //get personal bests
                const totTimePB=await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),where("user","==",uidUser),orderBy("totTime"),limit(limitResults))
                );
                const avgTimePB=await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),where("user","==",uidUser),orderBy("avgTime"),limit(limitResults))
                );
                const fastestWordPB=await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),where("user","==",uidUser),orderBy("fastestWord"),limit(limitResults))
                );

                records={
                    "WR":{
                        totTime:(!totTimeWR.empty)?{record:totTimeWR.docs.map(g=>g.data().totTime),user:totTimeWR.docs.map(g=>g.data().user),gameId:totTimeWR.docs.map(g=>g.id)}:{record:null,user:null,gameId:null},
                        avgTime:(!avgTimeWR.empty)?{record:avgTimeWR.docs.map(g=>g.data().avgTime),user:avgTimeWR.docs.map(g=>g.data().user),gameId:avgTimeWR.docs.map(g=>g.id)}:{record:null,user:null,gameId:null},
                        fastestWord:(!fastestWordWR.empty)?{record:fastestWordWR.docs.map(g=>g.data().fastestWord),user:fastestWordWR.docs.map(g=>g.data().user),gameId:fastestWordWR.docs.map(g=>g.id)}:{record:null,user:null,gameId:null},
                    },
                    "NR":{
                        totTime:(totTimeNR.empty || totTimeNR==0)?{record:null,user:null,gameId:null}:{record:totTimeNR.docs.map(g=>g.data().totTime),user:totTimeNR.docs.map(g=>g.data().user),gameId:totTimeNR.docs.map(g=>g.id)},
                        avgTime:(avgTimeNR.empty || avgTimeNR==0)?{record:null,user:null,gameId:null}:{record:avgTimeNR.docs.map(g=>g.data().avgTime),user:avgTimeNR.docs.map(g=>g.data().user),gameId:avgTimeNR.docs.map(g=>g.id)},
                        fastestWord:(fastestWordNR.empty || fastestWordNR==0)?{record:null,user:null,gameId:null}:{record:fastestWordNR.docs.map(g=>g.data().fastestWord),user:fastestWordNR.docs.map(g=>g.data().user),gameId:fastestWordNR.docs.map(g=>g.id)},
                    },
                    "PB":{
                        totTime:(!totTimePB.empty)?{record:totTimePB.docs.map(g=>g.data().totTime),user:totTimePB.docs.map(g=>g.data().user),gameId:totTimePB.docs.map(g=>g.id)}:{record:null,user:null,gameId:null},
                        avgTime:(!avgTimePB.empty)?{record:avgTimePB.docs.map(g=>g.data().avgTime),user:avgTimePB.docs.map(g=>g.data().user),gameId:avgTimePB.docs.map(g=>g.id)}:{record:null,user:null,gameId:null},
                        fastestWord:(!fastestWordPB.empty)?{record:fastestWordPB.docs.map(g=>g.data().fastestWord),user:fastestWordPB.docs.map(g=>g.data().user),gameId:fastestWordPB.docs.map(g=>g.id)}:{record:null,user:null,gameId:null},
                    },
                }
                
                break;
            default:
                break;
        }

        //if limit is 1, not return array of values but the value itself
        if(limitResults==1 && records!={}){
            for(const key in records){
                for(const key2 in records[key]){
                    if(records[key][key2]["record"]!=null && records[key][key2]["user"]!=null && records[key][key2]["gameId"]!=null){
                        records[key][key2]["record"]=records[key][key2]["record"][0];
                        records[key][key2]["user"]=records[key][key2]["user"][0];
                        records[key][key2]["gameId"]=records[key][key2]["gameId"][0];
                    }
                }
            }
        }

        return [true,records];
    }catch(e){
        return [false,e];
    }
}

//get all user games
const getAllUserGames=async(user)=>{
    try{
        const games=await getDocs(
            query(collection(db,"games"),where("user","==",user))
        );

        return [true,games.docs.map(g=>g.data())];
    }catch(e){  
        return [false,e.message];
    }
}

//get last games of the user
const getLastGamesUser=async(skill,skillParameters,user,numGames)=>{
    try{
        var lastGames=[];

        switch(skill){
            case 0: //FAST TYPING
                lastGames=await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[skill].title),where("user","==",user),orderBy("date",'desc'),limit(numGames))
                );
                break;
            default: 
                break;
        }

        if(lastGames!=[] && !lastGames.empty){
            return [true,lastGames.docs.map(g=>{return {...g.data(),gameId:g.id}})];
        }else{
            return [true,[]];
        }
    }catch(e){
        return [false,e.message];
    }

}

/**
 * function which stores a new game into the database
 * @param {*} result indicates all parameters of the game to save
 * @param {*} skillIndex indicates index of the skill played
 * @param {*} skillParameters indicates parameters of the skill played
 * @param {*} records indicates current WR, NR and PB of the skill played
 * @param {*} isRecord indicates if the game to store is a record or not. Contains all distances from current records
 * @returns 
 */
const storeGameResult=async (result,skillIndex,skillParameters,records,isRecord)=>{
    try{
        //get last 5 user games
        const [resp, lastGames]=await getLastGamesUser(skillIndex,skillParameters,auth.currentUser.uid,5);

        if(!resp){
            return [false,"Error on saving the game"];
        }

        //get the id of the game played less recently
        const lessRecentGame=lastGames.at(-1);

        //get ids of games which are current PB, NR and WR
        //and get ids of games which was PB, NR and WR before the currect game was played
        var recordIds=[]
        for (const recordType in records){
            for(const recordParameter in records[recordType]){
                if(records[recordType][recordParameter].gameId!=null){
                    //get record game id
                    recordIds.push(records[recordType][recordParameter].gameId);

                    //check if this record had been surpassed by the current game to store
                    if(isRecord[recordType][recordParameter]<0 || isRecord[recordType][recordParameter]==null){  //if the current game to store is a new record for recordParameter

                        //store in the user profile that he is done a new record. This is done only if the new record is not a PB
                        if(recordType!="PB"){
                            await runTransaction(db,async(transaction)=>{
                                const currUser = await transaction.get(doc(db,"users",auth.currentUser.uid));

                                const userSkillPastRecords=(currUser.data().records[result.skill]!=undefined ? currUser.data().records[result.skill] : []);

                                transaction.update(doc(db,"users",auth.currentUser.uid),{
                                    records:{...currUser.data().records,[result.skill]:[
                                        ...userSkillPastRecords,
                                        {
                                            recordType:recordType, recordParameter:recordParameter,
                                            skillParameters:skillParameters.map((p,index)=>{return {[skills[skillIndex].skillParametersLongName[index]]:p}}),
                                            value: result[recordParameter], date:new Date()
                                        }
                                    ]}
                                })
                            })
                        }
                    }
                }
            }
        }

        //remouve duplicates
        recordIds=[...new Set(recordIds)];

        //check if the less recent game is the actual personal best of the user or is a national or world record
        if(lessRecentGame!=undefined && !recordIds.includes(lessRecentGame.gameId) && lastGames.length>4){  //if the less recent game is not a record and if the user played at least 5 games, i can delete it since it is not more a useful game
            await deleteDoc(doc(db,"games",lessRecentGame.gameId));
        }

        //if it is a record, we still remain it in the db

        //save the current game
        await addDoc(collection(db,"games"),result);

        return [true,"Success"];
    }catch(e){
        console.log(e);
        return [false,e.message];
    }
}

const updateUserLvExpAndGames=async(lv,exp)=>{
    try{
        await runTransaction(db,async(transaction)=>{
            const currUser = await transaction.get(doc(db,"users",auth.currentUser.uid));

            transaction.update(doc(db,"users",auth.currentUser.uid),{
                lv:lv,exp:exp,numGames:currUser.data().numGames+1
            });
        })
        return [true,"Success"];
    }catch(e){
        return [false,e.message];
    }
}

const updateUserCountry=async(country)=>{
    try{
        await updateDoc(doc(db,"users",auth.currentUser.uid),{
            country:country
        });
        return [true,"Success"];
    }catch(e){
        return [false,e.message];
    }
}

const updateUserUsername=async(username)=>{
    try{
        await updateDoc(doc(db,"users",auth.currentUser.uid),{
            username:username
        });
        return [true,"Success"];
    }catch(e){
        return [false,e.message];
    }
}

export {auth,signInWithGooglePopup,signOutWithGoogle,createUserAccount,checkUserExists,getUserData,getSkillLeaderboard,
    storeGameResult,updateUserLvExpAndGames,updateUserCountry,updateUserUsername,getAllUserGames};