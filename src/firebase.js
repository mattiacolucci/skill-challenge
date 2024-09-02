// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { addDoc, collection, count, deleteDoc, doc, DocumentSnapshot, getDoc, getDocs, getFirestore, limit, orderBy, query, QuerySnapshot, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { skills } from "./assets/data";
import { calculateAvgAccumulately, calculateEstimatedAvgPerformanceBasedOnRankingPoints, filterUserLeaderboard, prettyPrintParameter } from "./utility";
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
        //store user account
        await setDoc(doc(db,"users",auth.currentUser.uid),{
            country:country,
            lv:1,
            exp:0,
            numGames:0,
            username:auth.currentUser.displayName,
            profileImage:auth.currentUser.photoURL,
            avgPerformances:{},
            records:{},
            rankingPoints:0,  //default ranking points of any user
            creationDate:new Date()
        });
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
//type parameter indicates if I want WR, NR and PB leaderboards (all) or only WR or NR leaderboard
const getSkillLeaderboard=async (uidUser, skill, skillParameters, country, limitResults=1, type="all")=>{
    var records={};

    try{
        switch(skill){
            case 0:  //FAST TYPING SKILL
                //get world records only if type is "all" or "WR"
                const totTimeWRQuery=(type=="all" || type=="WR")?
                await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),orderBy("totTime"),limit(limitResults))
                ):{docs:[]};
                const avgTimeWRQuery=(type=="all" || type=="WR")?
                await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),orderBy("avgTime"),limit(limitResults))
                ):{docs:[]};
                const fastestWordWRQuery=(type=="all" || type=="WR")?
                await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),orderBy("fastestWord"),limit(limitResults))
                ):{docs:[]};

                //take only best game per user
                const totTimeWR=filterUserLeaderboard(totTimeWRQuery.docs);
                const avgTimeWR=filterUserLeaderboard(avgTimeWRQuery.docs);
                const fastestWordWR=filterUserLeaderboard(fastestWordWRQuery.docs);

                //get national records only if type is "all" or "NR"
                const nationalUsers=await getDocs(query(collection(db,"users"),where("country","==",country)));
                var totTimeNRQuery, avgTimeNRQuery, fastestWordNRQuery;
                if(!nationalUsers.empty){  //if national users exists get national records

                    const nationalUsersIds=nationalUsers.docs.map(usr=>usr.id);

                    totTimeNRQuery=(type=="all" || type=="NR")?
                    await getDocs(
                        query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                        where("skill","==",skills[0].title),where("user","in",nationalUsersIds),orderBy("totTime"),limit(limitResults))
                    ):{docs:[]};
                    avgTimeNRQuery=(type=="all" || type=="NR")?
                    await getDocs(
                        query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                        where("skill","==",skills[0].title),where("user","in",nationalUsersIds),orderBy("avgTime"),limit(limitResults))
                    ):{docs:[]};
                    fastestWordNRQuery=(type=="all" || type=="NR")?
                    await getDocs(
                        query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                        where("skill","==",skills[0].title),where("user","in",nationalUsersIds),orderBy("fastestWord"),limit(limitResults))
                    ):{docs:[]};
                }else{  //there is no national record in this case
                    totTimeNRQuery=[];
                    avgTimeNRQuery=[];
                    fastestWordNRQuery=[];
                }

                //take only best game per user
                const totTimeNR=(totTimeNRQuery!=[])?filterUserLeaderboard(totTimeNRQuery.docs):[];
                const avgTimeNR=(avgTimeNRQuery!=[])?filterUserLeaderboard(avgTimeNRQuery.docs):[];
                const fastestWordNR=(fastestWordNRQuery!=[])?filterUserLeaderboard(fastestWordNRQuery.docs):[];

                //get personal bests
                const totTimePB=(type=="all")?
                await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),where("user","==",uidUser),orderBy("totTime"),limit(limitResults))
                ):{empty:true};
                const avgTimePB=(type=="all")?
                await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),where("user","==",uidUser),orderBy("avgTime"),limit(limitResults))
                ):{empty:true};
                const fastestWordPB=(type=="all")?
                await getDocs(
                    query(collection(db,"games"),where("numWords","==",skillParameters[0]),where("numChars","==",skillParameters[1]),
                    where("skill","==",skills[0].title),where("user","==",uidUser),orderBy("fastestWord"),limit(limitResults))
                ):{empty:true};

                records={
                    "WR":{
                        totTime:(totTimeWR.length!=0)?{record:totTimeWR.map(g=>g.totTime),user:totTimeWR.map(g=>g.user),gameId:totTimeWR.map(g=>g.id)}:{record:null,user:null,gameId:null},
                        avgTime:(avgTimeWR.length!=0)?{record:avgTimeWR.map(g=>g.avgTime),user:avgTimeWR.map(g=>g.user),gameId:avgTimeWR.map(g=>g.id)}:{record:null,user:null,gameId:null},
                        fastestWord:(fastestWordWR.length!=0)?{record:fastestWordWR.map(g=>g.fastestWord),user:fastestWordWR.map(g=>g.user),gameId:fastestWordWR.map(g=>g.id)}:{record:null,user:null,gameId:null},
                    },
                    "NR":{
                        totTime:(totTimeNR.length==0)?{record:null,user:null,gameId:null}:{record:totTimeNR.map(g=>g.totTime),user:totTimeNR.map(g=>g.user),gameId:totTimeNR.map(g=>g.id)},
                        avgTime:(avgTimeNR.length==0)?{record:null,user:null,gameId:null}:{record:avgTimeNR.map(g=>g.avgTime),user:avgTimeNR.map(g=>g.user),gameId:avgTimeNR.map(g=>g.id)},
                        fastestWord:(fastestWordNR.length==0)?{record:null,user:null,gameId:null}:{record:fastestWordNR.map(g=>g.fastestWord),user:fastestWordNR.map(g=>g.user),gameId:fastestWordNR.map(g=>g.id)},
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
const storeGameResult=async (result,skillIndex,skillParameters,records,isRecord,newLv,newExp,newRankingPoints)=>{
    try{
        await runTransaction(db,async(transactionDB)=>{
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
                    //if a record have been set before, get game id of the record
                    if(records[recordType][recordParameter].gameId!=null){
                        //get record game id
                        recordIds.push(records[recordType][recordParameter].gameId);
                    }

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

            //get user data
            const currUser = await transactionDB.get(doc(db,"users",auth.currentUser.uid));
            var newUser=currUser.data();

            //remouve duplicates
            recordIds=[...new Set(recordIds)];

            //check if the less recent game is the actual personal best of the user or is a national or world record
            if(lessRecentGame!=undefined && !recordIds.includes(lessRecentGame.gameId) && lastGames.length>4){  //if the less recent game is not a record and if the user played at least 5 games, i can delete it since it is not more a useful game
                transactionDB.delete(doc(db,"games",lessRecentGame.gameId));
            }

            //if it is a record, we still remain it in the db

            //get performance parameter done in the game to store
            const performanceParameter=result[skills[skillIndex].skillPerformanceParameter];

            //update exp, lv, rnking points and num games
            newUser.lv=newLv;
            newUser.exp=newExp;
            newUser.numGames=newUser.numGames+1;
            newUser.rankingPoints=newRankingPoints;

            //update avg performance according to the played skill and parameters
            //this represent the key of the avg performance, created as the concat of all skills parameters by the char "-"
            const avgPerformanceSkillParametersKey=skillParameters.join("-");

            //if there is no stored avg parameter for current skill, initialize it as {}
            if(newUser.avgPerformances[result.skill]==undefined){
                newUser.avgPerformances[result.skill]={};
            }

            //if there is no stored avg parameter for current skill and parameters, initialize it
            if(newUser.avgPerformances[result.skill][avgPerformanceSkillParametersKey]==undefined){
                newUser.avgPerformances[result.skill][avgPerformanceSkillParametersKey]={value:performanceParameter,numGames:1};
            }else{
                //else, update current avg parameter
                newUser.avgPerformances[result.skill][avgPerformanceSkillParametersKey].value=calculateAvgAccumulately(newUser.avgPerformances[result.skill][avgPerformanceSkillParametersKey].value,newUser.avgPerformances[result.skill][avgPerformanceSkillParametersKey].numGames,performanceParameter);
                newUser.avgPerformances[result.skill][avgPerformanceSkillParametersKey].numGames=newUser.avgPerformances[result.skill][avgPerformanceSkillParametersKey].numGames+1;
            }

            transactionDB.update(doc(db,"users",auth.currentUser.uid),newUser);

            //save the current game
            await addDoc(collection(db,"games"),result);
        });

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

const deleteAccount=async()=>{
    try{
        await runTransaction(db,async(transaction)=>{
            //delete user
            transaction.delete(doc(db,"users",auth.currentUser.uid));

            //delete all games of the user
            const games=await getDocs(
                query(collection(db,"games"),where("user","==",auth.currentUser.uid))
            );

            for(const d in games.docs){
                transaction.delete(doc(db,"games",games.docs[d].id));
            }
        });
        return [true,"Success!"]
    }catch(e){
        return [false,e.message];
    }
}

const calculateNewRankingPoints=async(rankingPoints,performanceParameter,skillIndex,skillParameters)=>{
    try{
        var newRankingPoints=rankingPoints;

        const skillTitle=skills[skillIndex].title;

        //this represent the key of the avg performance, created as the concat of all skills parameters by the char "-"
        const avgPerformanceSkillParametersKey=skillParameters.join("-");

        //get all avg performance for the played skill of all users with a ranking points +-50 from the current one of the playing user
        const similarRankingUsers=await getDocs(
            query(collection(db,"users"),where("rankingPoints","<=",rankingPoints+50),where("rankingPoints",">=",rankingPoints-50),where("user","!=",auth.currentUser.uid))
        );

        //filter users not considering users with a defined avg performance for current skill and parameters
        const filteredSimilarRankingUsers=similarRankingUsers.docs.filter(u=>u.data().avgPerformances[skillTitle]!=undefined && u.data().avgPerformances[skillTitle][avgPerformanceSkillParametersKey]!=undefined);

        var avgOfAvgPerformances;
        
        //if there is at least a user with similar ranking points to me
        if(filteredSimilarRankingUsers.length!=0){
            //avg of avg performances of the played skill
            avgOfAvgPerformances=filteredSimilarRankingUsers.map(u=>u.data().avgPerformances[skillTitle][avgPerformanceSkillParametersKey].value).reduce((a,b)=>a+b,0)/filteredSimilarRankingUsers.length;
        }else{  //if there is no user with similar ranking point to the user, calculate the avg based on the ranking point of the user
            avgOfAvgPerformances=calculateEstimatedAvgPerformanceBasedOnRankingPoints(rankingPoints,skillTitle,skillParameters);
        }

        //difference between performance parameter value obtained in this game and the avg of avgs of performances
        var diff=performanceParameter-avgOfAvgPerformances;

        //calculate the number of ranking points tha has to user will gain/loss based on if he did a performance better or not than the avg
        //the function x/(1+x) is monotone ascending with max = 1 per x->+inf. We multiply per 70 so the maximum number of points that
        //will be earned/loss is 70.
        var gainedPoints=Math.round(((Math.abs(diff))/(1+Math.abs(diff)))*70);

        if(diff>0){
            //if obtained performance parameter is higher than the avg of avgs, the user has done a game under the avg of performance and so he will lose ranking points
            newRankingPoints=rankingPoints-gainedPoints;
        }else if(diff<0){
            //if obtained performance parameter is lower than avg of avgs, the user has done a game over the avg f performance and so its points will rise
            newRankingPoints=rankingPoints+gainedPoints;
        }

        //if new ranking points is <0, set it to 0
        if(newRankingPoints<0){
            newRankingPoints=0;
        }

        const earnedRankingPointsString="Avg of "+prettyPrintParameter(skills[skillIndex].skillPerformanceParameter)+": "+avgOfAvgPerformances.toFixed(3);

        return [true,newRankingPoints,earnedRankingPointsString];
    }catch(e){
        return [false,e,""];
    }
}

const getRankingPointsLeaderboard=async(limitResults,rankingPointsLimit=null)=>{
    try{
        //if rankingPointsLimit is null, get fist "limitResults" users
        var rankingPointsLeaderboard;

        if(rankingPointsLimit==null){
            rankingPointsLeaderboard=await getDocs(
                query(collection(db,"users"),orderBy("rankingPoints"),limit(limitResults))
            );
        }else{
            //rankingPointsLimit indicates that all users returned by the folliiwng query have to have ranking points under the limit
            rankingPointsLeaderboard=await getDocs(
                query(collection(db,"users"),orderBy("rankingPoints"),where("rankingPoints","<",rankingPointsLimit),limit(limitResults))
            );
        }

        var leaderbord=[];
        for(const i in rankingPointsLeaderboard.docs){
            const data=rankingPointsLeaderboard.docs[i].data();
            leaderbord.push({user:data.username,rankingPoints:data.rankingPoints,profileImage:data.profileImage});
        }

        return [true,leaderbord];
    }catch(e){ 
        return [false,e.message];
    }
}

export {auth,signInWithGooglePopup,signOutWithGoogle,createUserAccount,checkUserExists,getUserData,getSkillLeaderboard,
    storeGameResult,updateUserCountry,updateUserUsername,getAllUserGames,deleteAccount,
    calculateNewRankingPoints, getRankingPointsLeaderboard
};