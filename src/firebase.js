// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { addDoc, collection, count, deleteDoc, doc, DocumentSnapshot, FieldPath, getCountFromServer, getDoc, getDocs, getFirestore, limit, orderBy, query, QuerySnapshot, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { languages, skills } from "./assets/data";
import { calculateAvgAccumulately, calculateCurrentRoundTournament, calculateEstimatedAvgPerformanceBasedOnRankingPoints, calculateNumRoundsTournaments, filterUserLeaderboard, prettyPrintParameter, skillParametersJoinPrint } from "./utility";
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
        //get browser language
        const browserLanguage=navigator.language.split("-")[0].toUpperCase();

        //set language to be used in skills with text to the browser language if it exists in language used in the game
        //if it does not exists, use english as language
        const language=(!languages.find(l=>l.code==browserLanguage))?"EN":browserLanguage;

        //store user account
        await setDoc(doc(db,"users",auth.currentUser.uid),{
            country:country,
            lv:1,
            exp:0,
            numGames:0,
            username:auth.currentUser.displayName,
            profileImage:auth.currentUser.photoURL,
            avgPerformances:{},
            tournamentBadges:[],
            language:language,  //language used in skills that show and uses text.
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

//get skill leaderbord. Get best games for each skill parameter in the world and in the user's country.
//type parameter indicates if I want WR and NR leaderboards (all) or only WR or NR leaderboard
const getSkillLeaderboard=async (skill, skillParameters, country, limitResults=1, type="all")=>{
    var records={"WR":{},"NR":{}};
    try{
        //for each record parameter of the skill
        for(const r in skills[skill].skillResultsParameters){
            const resultParameter=skills[skill].skillResultsParameters[r];

            //get the WR or NR if selected
            var WR=(type=="all" || type=="WR")?
            await getDocs(
                query(collection(db,"games"),where("skillParameters","==",skillParametersJoinPrint(skills[skill].skillParametersPossibleValues[skillParameters])),
                where("skill","==",skills[0].title),orderBy(resultParameter),limit(limitResults))
            ):{docs:[]};

            var NR=(type=="all" || type=="NR")?
            await getDocs(
                query(collection(db,"games"),where("skillParameters","==",skillParametersJoinPrint(skills[skill].skillParametersPossibleValues[skillParameters])),
                where("skill","==",skills[0].title),where("userCountry","==",country),orderBy(resultParameter),limit(limitResults))
            ):{docs:[]};

            //filter users
            WR=filterUserLeaderboard(WR.docs);
            NR=filterUserLeaderboard(NR.docs);

            //store leaderboards
            records["WR"][resultParameter]=(WR.length!=0)?{record:WR.map(g=>g[resultParameter]),user:WR.map(g=>g.user),gameId:WR.map(g=>g.id)}:{record:null,user:null,gameId:null};
            records["NR"][resultParameter]=(NR.length!=0)?{record:NR.map(g=>g[resultParameter]),user:NR.map(g=>g.user),gameId:NR.map(g=>g.id)}:{record:null,user:null,gameId:null};
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

//function which returns user personal best for the skill, parameters and result parameter selected
const getUserPersonalBest=async(uidUser, skill, skillParameters, resultParameter)=>{
    try{
        const personalBest=await getDocs(
            query(collection(db,"games"),where("skillParameters","==",skillParametersJoinPrint(skills[skill].skillParametersPossibleValues[skillParameters])),
            where("skill","==",skills[skill].title),where("user","==",uidUser),orderBy(resultParameter),limit(1))
        );

        const pb=(!personalBest.empty)?
        {
            record:personalBest.docs[0].data()[resultParameter],
            user:personalBest.docs[0].data().user,
            gameId:personalBest.docs[0].id
        }:
        {record:null,user:null,gameId:null};
        return [true,pb];
    }catch(e){
        return [false,e.message];
    }
}

const getUserPositionInLeaderboard=async(uidUser, skill, skillParameters, resultParameter, country=null, type="WR")=>{
    try{
        //get user personal best for the selected skill, parameters of it and result parameter
        const [resp,userPersonalBest]=await getUserPersonalBest(uidUser,skill,skillParameters,resultParameter);

        //if personal best has been retreived successfully
        if(resp){
            const personalBest=userPersonalBest.record;
            //if there is no personal best, return null as position
            if(personalBest==null){
                return [true,null];
            }

            var userLeaderboardPosition;

            if(type=="WR"){
                //make a query which counts the number of games in the selcted, skill and parameters, which are personal best in result parameter and have result parameter value less than the user personal best
                userLeaderboardPosition=(await getCountFromServer(query(collection(db,"games"),
                    where("skill","==",skills[skill].title),
                    where("skillParameters","==",skillParametersJoinPrint(skills[skill].skillParametersPossibleValues[skillParameters])),
                    where(resultParameter,"<",personalBest),
                    where("isPersonalBest."+resultParameter,"==",true)))  //this game is a personal best in result parameter
                ).data().count;
            }else if(type=="NR"){
                userLeaderboardPosition=(await getCountFromServer(query(collection(db,"games"),
                    where("skill","==",skills[skill].title),
                    where("skillParameters","==",skillParametersJoinPrint(skills[skill].skillParametersPossibleValues[skillParameters])),
                    where(resultParameter,"<",personalBest),
                    where("userCountry","==",country),
                    where("isPersonalBest."+resultParameter,"==",true)))  //this game is a personal best in result parameter
                ).data().count;
            }

            return [true,userLeaderboardPosition+1];
        }else{
            return [false,userPersonalBest];
        }
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

        lastGames=await getDocs(
            query(collection(db,"games"),where("skillParameters","==",skillParametersJoinPrint(skillParameters)),
            where("skill","==",skills[skill].title),where("user","==",user),orderBy("date",'desc'),limit(numGames))
        );

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
 * @param {*} tournament indicates if the game to store is a tournament duel and contains the info about the relative tournament, game and duel
 * @returns 
 */
const storeGameResult=async (result,skillIndex,skillParametersIndex,records,isRecord,newLv,newExp,newRankingPoints,tournament)=>{
    try{
        await runTransaction(db,async(transactionDB)=>{
            const skillParameters=skills[skillIndex].skillParametersPossibleValues[skillParametersIndex];

            //get last 5 user games
            const [resp, lastGames]=await getLastGamesUser(skillIndex,skillParameters,auth.currentUser.uid,5);

            //get current user
            const currUser = await transactionDB.get(doc(db,"users",auth.currentUser.uid));
            var newUser=currUser.data();

            //get tournament of the game if it was a duel of a tournament
            var tournamentDoc;
            if(tournament!=undefined){
                tournamentDoc = (await transactionDB.get(doc(db,"tournaments",tournament.id))).data();
            }

            //json which indicates the records done by the new game
            var gamePersonalBest={};

            if(!resp){
                throw new FirebaseFirestoreException(lastGames,
                    FirebaseFirestoreException.Code.ABORTED);
            }

            //get the id of the game played less recently
            const lessRecentGame=lastGames.at(-1);

            for (const recordType in records){
                for(const recordParameter in records[recordType]){
                    //indicates that the new game is not a personal best in the record parameter
                    //if it is, next if will be set to true.
                    gamePersonalBest[recordParameter]=false;

                    //check if this record had been surpassed by the current game to store
                    if(isRecord[recordType][recordParameter]<0 || isRecord[recordType][recordParameter]==null){  //if the current game to store is a new record for recordParameter
                        //indicates that the new game is a personal best in the record parameter
                        gamePersonalBest[recordParameter]=true;
                        
                        //store in the user profile that he is done a new record. This is done only if the new record is not a PB
                        if(recordType!="PB"){
                            if(newUser.records[result.skill]==undefined){
                                newUser.records[result.skill]=[];
                            }

                            newUser.records[result.skill].push({
                                recordType:recordType, recordParameter:recordParameter,
                                skillParameters:skillParameters.map((p,index)=>{return {[skills[skillIndex].skillParametersLongName[index]]:p}}),
                                value: result[recordParameter], date:new Date()
                            });
                        }

                        //if the past record was owned by the user itself, set that it is no more its personal best
                        if(records[recordType][recordParameter].user==auth.currentUser.uid){
                            var gameUpdate = {};
                            gameUpdate[`isPersonalBest.${recordParameter}`] = false;
                            transactionDB.update(doc(db,"games",records[recordType][recordParameter].gameId),gameUpdate);
                        }
                    }
                }
            }

            //if the less recent game is not a personal best and if the user played at least 5 games, i can delete it since it is not more a useful game
            if(lessRecentGame!=undefined && !Object.values(lessRecentGame.isPersonalBest).includes(true) && lastGames.length>4){
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

            //update user profile
            transactionDB.update(doc(db,"users",auth.currentUser.uid),newUser);

            //save the current game
            await addDoc(collection(db,"games"),{...result,isPersonalBest:gamePersonalBest,userCountry:newUser.country});

            //update tournament if this game was a tournament duel
            if(tournament!=undefined){
                //get user index in the duel and the index of the other user
                const userIndexInGame=tournament.userGameIndex;
                const opponentIndexInGame=(userIndexInGame==0)?1:0;

                //get tournament duel, game and round
                var duel = tournamentDoc.games[tournament.round][tournament.gameIndex].duels[skillParametersJoinPrint(skills[skillIndex].skillParametersPossibleValues[tournament.duelId])];

                //if it is undefined, create the duel and set to "-" the result of the other user
                if(duel==undefined){
                    duel={results:[]};
                    duel.results[opponentIndexInGame]="-";
                }

                //store performance parameter as result in game
                duel.results[userIndexInGame]=performanceParameter;
            
                //set the duel winner if it has finished
                if(duel.results[opponentIndexInGame]!="-"){
                    //if the duel is already created and so the other user already played, let the duel finish and set the winner
                    duel.winner=(duel.results[userIndexInGame]<duel.results[opponentIndexInGame])?userIndexInGame:opponentIndexInGame;
                    
                    //update duel in tournament
                    tournamentDoc.games[tournament.round][tournament.gameIndex].duels[skillParametersJoinPrint(skills[skillIndex].skillParametersPossibleValues[tournament.duelId])]=duel;

                    //if this duel is over and it was the last duel of the tournament game, set that the game is over and winner
                    if(tournament.duelId==(skills[skillIndex].skillParametersPossibleValues.length-1)){
                        const game=tournamentDoc.games[tournament.round][tournament.gameIndex]
                        game.playing=false;

                        const gameWinners=Object.values(game.duels).map(d=>d.winner);
                        const userWins=gameWinners.filter(d=>d==userIndexInGame).length;
                        const oppoWins=gameWinners.filter(d=>d==opponentIndexInGame).length;
                        game.winner=(userWins>oppoWins)?userIndexInGame:opponentIndexInGame;

                        //update game in tournament
                        tournamentDoc.games[tournament.round][tournament.gameIndex]=game;
                    }
                }else{
                    //update duel in tournament
                    tournamentDoc.games[tournament.round][tournament.gameIndex].duels[skillParametersJoinPrint(skills[skillIndex].skillParametersPossibleValues[tournament.duelId])]=duel;
                }

                //update tournament on db
                transactionDB.update(doc(db,"tournaments",tournament.id),tournamentDoc);
            }
        });

        return [true,"Success"];
    }catch(e){
        return [false,e];
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

const updateUserLanguage=async(language)=>{
    try{
        await updateDoc(doc(db,"users",auth.currentUser.uid),{
            language:language
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

const getRankingPointsLeaderboard=async(limitResults,rankingPointsLimit=null,country=null)=>{
    try{
        //if rankingPointsLimit is null, get fist "limitResults" users
        var rankingPointsLeaderboard;

        if(rankingPointsLimit==null){
            rankingPointsLeaderboard=
            (country==null)?
            await getDocs(query(collection(db,"users"),orderBy("rankingPoints","desc"),limit(limitResults))):
            await getDocs(query(collection(db,"users"),where("country","==",country),orderBy("rankingPoints","desc"),limit(limitResults)));
        }else{
            //rankingPointsLimit indicates that all users returned by the folliiwng query have to have ranking points under the limit
            rankingPointsLeaderboard=(country==null)?
            await getDocs(query(collection(db,"users"),orderBy("rankingPoints","desc"),where("rankingPoints","<",rankingPointsLimit),limit(limitResults))):
            await getDocs(query(collection(db,"users"),where("country","==",country),orderBy("rankingPoints","desc"),where("rankingPoints","<",rankingPointsLimit),limit(limitResults)));
        }

        var leaderbord=[];
        for(const i in rankingPointsLeaderboard.docs){
            const data=rankingPointsLeaderboard.docs[i].data();
            leaderbord.push({user:data.username,rankingPoints:data.rankingPoints,profileImage:data.profileImage,country:data.country,id:rankingPointsLeaderboard.docs[i].id});
        }

        return [true,leaderbord];
    }catch(e){ 
        return [false,e.message];
    }
}

const getUserPositionInRankingPointsLeaderboard=async(user,type="WR")=>{
    try{
        var userPosition;

        const userData=await getDoc(doc(db,"users",user));

        if(!userData.exists){
            return [false,"User do not exists"];
        }

        if(type=="WR"){
            //count number of users with ranking pints highest than the user ones
            userPosition=(await getCountFromServer(query(collection(db,"users"),
                where("rankingPoints",">",userData.data().rankingPoints)))
            ).data().count;
        }else{
            //count number of users (with the same nationality of the user) with ranking pints highest than the user ones
            userPosition=(await getCountFromServer(query(collection(db,"users"),
                where("rankingPoints",">",userData.data().rankingPoints),
                where("country","==",userData.data().country)))
            ).data().count;
        }

        return [true,userPosition+1];
    }catch(e){
        return [false,e];
    }
}

//function which get all tournaments which are not closed and relative to a certain skill
const getAllOpenAndProgressTournaments=async(skill)=>{
    try{
        const tournamentsList=await getDocs(query(collection(db,"tournaments"),where("status","in",["open","progress"]),where("skill","==",skills[skill].title),orderBy("creationDate","desc")));
        if(tournamentsList.empty){
            return [true,[]];
        }else{
            const tournaments=tournamentsList.docs.map(t=>{return{...t.data(),id:t.id}});

            //for each tournament
            for(const i in tournaments){
                if(tournaments[i].status=="progress"){
                    //calculate current round number for each tournament with status "progress"
                    tournaments[i].currentRound=calculateCurrentRoundTournament(tournaments[i].games);
                }

                //calculate num of rounds for each tournament
                tournaments[i].numRounds=calculateNumRoundsTournaments(tournaments[i].numUsers);
            }

            //calculate if current user matches the first tournament requirements
            const [resp,req]=await checkTournamentRequirements(tournaments[0].requirements,tournaments[0].skill);

            if(resp){
                //set requirements match array to first tournaments
                for(const i in tournaments[0].requirements){
                    tournaments[0].requirements[i]={...tournaments[0].requirements[i],matched:req[i]};
                }

                //indicates if user matches all requirements
                tournaments[0].matchesAllrequirements=(tournaments[0].requirements.map(r=>r.matched).find(e=>e==false)==undefined)?true:false;

                return [true,tournaments];
            }else{
                return [false,req];
            }
        }
    }catch(e){
        return [false,e.message];
    }
}

const subscribeToTournament=async(tournamentId)=>{
    try{
        const tournament=(await getDoc(doc(db,"tournaments",tournamentId))).data();
        await updateDoc(doc(db,"tournaments",tournamentId),{subscribedUsers:[...tournament.subscribedUsers,auth.currentUser.uid]});

        return [true,"Success!"];
    }catch(e){
        return [false,e.message];
    }
}

//function that check if a user matches tournament requirements
//as input has the array of requirements with the relative skill of the tournament
//returns an array of bool which indicates if the requisiment is matched or not
const checkTournamentRequirements=async(req,skill)=>{
    try{
        const requisimentMatches=[];

        for(const i in req){
            var compareValue, thresholdValue, compareSign;

            thresholdValue=req[i].thresholdValue;
            compareSign=req[i].compareSign;

            switch(req[i].parameter){
                case "rankingPoints":   //has a certain number of ranking points
                    compareValue=(await getDoc(doc(db,"users",auth.currentUser.uid))).data().rankingPoints;
                    break;
                case "nationality":  //has a certain nationality
                    compareValue=(await getDoc(doc(db,"users",auth.currentUser.uid))).data().country;
                    break;
                case "worldRecords":  //has a certain number of world records for the tournament skill
                    compareValue=(await getDoc(doc(db,"users",auth.currentUser.uid))).data().records[skill].filter(r=>r.recordType=="WR").length;
                    break;
                case "nationalRecords":  //has a certain number of national records for the tournament skill
                    compareValue=(await getDoc(doc(db,"users",auth.currentUser.uid))).data().records[skill].filter(r=>r.recordType=="NR").length;
                    break;
                case "rankingPointsLeaderboardWorld":  //has a certain position in the world ranking points leaderboard
                    const [resp,rankingPointsPosition]=await getUserPositionInRankingPointsLeaderboard(auth.currentUser.uid,"WR");
                    if(resp){
                        compareValue=rankingPointsPosition;
                    }else{
                        return [false,rankingPointsPosition];
                    }
                    break;
                case "rankingPointsLeaderboardNational":  //has a certain position in the national ranking points leaderboard
                    const [response,rankingPointsPositionNational]=await getUserPositionInRankingPointsLeaderboard(auth.currentUser.uid,"NR");
                    if(response){
                        compareValue=rankingPointsPositionNational;
                    }else{
                        return [false,rankingPointsPositionNational];
                    }
                    break;
                case "country":
                    compareValue=(await getDoc(doc(db,"users",auth.currentUser.uid))).data().country;
                    break;
                default:
                    break;
            }

            switch(compareSign){
                case "==":
                    requisimentMatches[i]=(compareValue==thresholdValue)?true:false;
                    break;
                case "<":
                    requisimentMatches[i]=(compareValue<=thresholdValue)?true:false;
                    break;
                case ">":
                    requisimentMatches[i]=(compareValue>=thresholdValue)?true:false;
                    break;
                default:
                    requisimentMatches[i]=false;
                    break;
            }
        }

        return [true,requisimentMatches];
    }catch(e){
        return [false,e.message];
    }
}

const createNewRoundGames=(pastRoundGames)=>{
    //get all users that win past round games
    var winnerUsers=pastRoundGames.map(g=>g.users[g.winner]);

    //create random associations
    var newGames=[];

    //cicle for the number of winner users /2
    for(const i in Array.from(Array(winnerUsers.length/2).keys())){
        newGames[i]={};
        newGames[i].users=[];

        //set first user of a new game, and delete user from the list of past round winners
        const user1Index=Math.floor(Math.random()*winnerUsers.length)
        newGames[i].users[0]=winnerUsers[user1Index];
        winnerUsers.splice(user1Index,1);

        //set second user of a new game, and delete user from the list of past round winners
        const user2Index=Math.floor(Math.random()*winnerUsers.length)
        newGames[i].users[1]=winnerUsers[user2Index];
        winnerUsers.splice(user2Index,1);

        //set expiration date of the game at the day after tomorrow at mid night
        const todayDate=new Date();
        todayDate.setDate(todayDate.getDate()+2);
        todayDate.setHours(0,0,0,0)
        newGames[i].expirationDate=todayDate;

        //set empty duels
        newGames[i].duels={};

        //set playing true
        newGames[i].playing=true;
    }

    return newGames;
}

export {auth,signInWithGooglePopup,signOutWithGoogle,createUserAccount,checkUserExists,getUserData,getSkillLeaderboard,
    getUserPersonalBest,getUserPositionInLeaderboard,storeGameResult,updateUserCountry,updateUserUsername,updateUserLanguage,getAllUserGames,
    deleteAccount,calculateNewRankingPoints, getRankingPointsLeaderboard, getAllOpenAndProgressTournaments, subscribeToTournament, checkTournamentRequirements
};
