import { useEffect, useRef, useState } from "react";
import Container from "../components/Container";
import { checkTournamentRequirements, getAllOpenAndProgressTournaments, getUserData, subscribeToTournament } from "../firebase";
import Navbar from "../components/Navbar";
import { skills } from "../assets/data";
import { Link } from "react-router-dom";
import { calculateGameScoreTournament, numberMod, prettyPrintDate, prettyPrintDateAndHours, prettyPrintParameter, skillParametersJoinPrint } from "../utility";
import Play from "./Play";

const Tournaments=(props)=>{
    const [isLoading,setIsLoading]=useState(true);
    const [subscribeLoading,setSubscribeLoading]=useState(false);
    const [tournamentDetailLoading,setTournamentDetailLoading]=useState(false);
    const [gamesLoading,setGamesLoading]=useState(false);
    const [selectedSkill,setSelectedSkill]=useState(0);
    const [selectedTournamentDetail,setSelectedTournamentDetail]=useState(0);
    const [selectedTournamentDetailRound,setSelectedTournamentDetailRound]=useState(1);
    const [tournaments,setTournaments]=useState({});
    const [usersData,setUsersData]=useState([]);
    const [isPlayScreen,setIsPlayScreen]=useState(false);
    const [selectedState,setSelectedState]=useState(0);
    const firstTournamentSubscribeButtonRef=useRef();
    const firstTournamentSubscribeButtonDetailsRef=useRef();
    const tournamentDetailRef=useRef();
    const tournamentListRef=useRef();

    useEffect(()=>{
        const fetchTournaments=async()=>{
            await findTournaments();
        }

        fetchTournaments();
    },[])

    const changeSelectedSkill=(skillNew)=>{
        setIsLoading(true);
        setSelectedSkill(skillNew);
        setTimeout(()=>setIsLoading(false),2000)
    }

    const findTournaments=async()=>{
        setIsLoading(true);

        const tournamentCopy={...tournaments};

        //if never fetched tournaments related to this skill
        if(tournamentCopy[selectedSkill]==undefined){
            const [resp,tournamentsList]=await getAllOpenAndProgressTournaments(selectedSkill);
        
            if(resp){
                for(const i in tournamentsList){
                    //store if the user is in the tournament or not
                    tournamentsList[i].userIsSubscribed=(tournamentsList[i].subscribedUsers.find(u=>u==props.user.uid)==undefined)?false:true;

                    //store how much places are left in the tournament
                    tournamentsList[i].placesLeft=tournamentsList[i].numUsers-tournamentsList[i].subscribedUsers.length;
                }

                //update tournaments
                tournamentCopy[selectedSkill]=tournamentsList;
                setTournaments(tournamentCopy);
            }else{
                console.log(tournamentsList);
            }
        }

        setIsLoading(false);
    }

    const subscribeTournament=async(tournamentIndex,details=false)=>{
        setSubscribeLoading(true);
        const [resp,message]=await subscribeToTournament(tournaments[selectedSkill][tournamentIndex].id);

        if(resp){
            //update tournament indicating that the user have been subscribed
            setTournaments((t)=>{
                t[selectedSkill][tournamentIndex].userIsSubscribed=true;
                t[selectedSkill][tournamentIndex].subscribedUsers.push(props.user.uid);
                return t;
            });
        }else{
            //show the error on the button
            if(details){
                firstTournamentSubscribeButtonDetailsRef.current.innerHTML=message;
            }else{
                firstTournamentSubscribeButtonRef.current.innerHTML=message;
            }
        }

        //disable the button
        if(details){
            firstTournamentSubscribeButtonDetailsRef.current.disabled=true;
        }else{
            firstTournamentSubscribeButtonRef.current.disabled=true;
        }

        setSubscribeLoading(false);
    }

    const fetchUserDataGame=async(game)=>{
        //fetch data of first users in this game, if never fetched
        if(usersData.find(e=>e.id==game.users[0])==undefined){
            const [r,user]=await getUserData(game.users[0]);
            if(r){
                setUsersData(u=>[...u,{...user,id:game.users[0]}])
            }
        }

        //fetch data of first users in this game, if never fetched
        if(usersData.find(e=>e.id==game.users[1])==undefined){
            const [r,user]=await getUserData(game.users[1]);
            if(r){
                setUsersData(u=>[...u,{...user,id:game.users[1]}])
            }
        }
    }

    const moreDetails=async (tournamentIndex)=>{
        tournamentDetailRef.current.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
        setTournamentDetailLoading(true);

        const tournamentsCopy={...tournaments};

        //get current round
        const currentRound=tournamentsCopy[selectedSkill][tournamentIndex].currentRound;

        setSelectedTournamentDetailRound(currentRound);

        //if never fetched user requiriments of the selcted tournament, fetch them
        if(tournaments[selectedSkill][tournamentIndex].requirements.length>0 && tournaments[selectedSkill][tournamentIndex].requirements[0].matched==undefined){

            //calculate if current user matches the selected tournament requirements
            const [resp,req]=await checkTournamentRequirements(tournaments[selectedSkill][tournamentIndex].requirements,selectedSkill);

            if(resp){
                //set requirements match array to selected tournament
                for(const i in tournamentsCopy[selectedSkill][tournamentIndex].requirements){
                    tournamentsCopy[selectedSkill][tournamentIndex].requirements[i]={...tournamentsCopy[selectedSkill][tournamentIndex].requirements[i],matched:req[i]};
                }

                //indicates if user matches all requirements
                tournamentsCopy[selectedSkill][tournamentIndex].matchesAllrequirements=(tournamentsCopy[selectedSkill][tournamentIndex].requirements.map(r=>r.matched).find(e=>e==false)==undefined)?true:false;
            }else{
                console.log(req);
            }
        }

        //indicates if the user is playing in the current round if never calculated
        //and fetch user data of users in current round if never fetched
        if(tournamentsCopy[selectedSkill][tournamentIndex].status=="progress" && tournamentsCopy[selectedSkill][tournamentIndex].userInThisRound==undefined){

            //set that the user do not play in this round
            tournamentsCopy[selectedSkill][tournamentIndex].userInThisRound=false;

            //for each game in current round
            for(const c in tournamentsCopy[selectedSkill][tournamentIndex].games[currentRound]){
                //get how much duels each user have won in this game
                tournamentsCopy[selectedSkill][tournamentIndex].games[currentRound][c].scores=calculateGameScoreTournament(tournamentsCopy[selectedSkill][tournamentIndex].games[currentRound][c].duels);

                //if current user is in this game
                if(tournamentsCopy[selectedSkill][tournamentIndex].games[currentRound][c].users.includes(props.user.uid)){
                    //indicates the user play in current round
                    tournamentsCopy[selectedSkill][tournamentIndex].userInThisRound=true;
                    //indicates game in that the user playes this round
                    tournamentsCopy[selectedSkill][tournamentIndex].userNextGame=tournamentsCopy[selectedSkill][tournamentIndex].games[currentRound][c];
                    //indicates index of the next game
                    tournamentsCopy[selectedSkill][tournamentIndex].userNextGameIndex=c;
                    //indicates user index in the game (0 or 1)
                    tournamentsCopy[selectedSkill][tournamentIndex].userIndexInGame=tournamentsCopy[selectedSkill][tournamentIndex].games[currentRound][c].users.indexOf(props.user.uid);
                    
                    //indicates index of the next duel that the user have to play
                    //it is calculated by getting all the duels which have been played at least by one of the 2 players (so have results != undefined)
                    //and of the, taking the numeber of duel played by current user (so with results[userIndexInGame]!="-")
                    //this gives me the index of the next game that the user have to play
                    tournamentsCopy[selectedSkill][tournamentIndex].userNextDuelIndex=Object.values(tournamentsCopy[selectedSkill][tournamentIndex].games[currentRound][c].duels)
                    .filter(d=>d.results!=undefined)
                    .filter(d=>d.results[tournamentsCopy[selectedSkill][tournamentIndex].userIndexInGame]!="-").length;

                    //indicates if the user has a duel to play or not
                    //it is calculated by see if the next duel index is equals to the number of possible values parameters of the tournament's skill
                    //if it is it means that the user had played all duels (so one duel for each possible value of the skill) and so it has not to play no morein this game
                    tournamentsCopy[selectedSkill][tournamentIndex].userHasToPlay=(skills[selectedSkill].skillParametersPossibleValues.length==tournamentsCopy[selectedSkill][tournamentIndex].userNextDuelIndex)?false:true;
                    
                    //set selected round to current round
                    setSelectedTournamentDetailRound(currentRound);
                }

                //fetch data of first users in this game, if never fetched
                await fetchUserDataGame(tournamentsCopy[selectedSkill][tournamentIndex].games[currentRound][c]);
            }
        }

        setTournaments(tournamentsCopy);
        
        setSelectedState(1);
        setTournamentDetailLoading(false);
        setSelectedTournamentDetail(tournamentIndex);
    }

    const goBackToList=()=>{
        tournamentListRef.current.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
        setSelectedState(0);
    }

    const incrementSelectedRound=async()=>{
        var newRound=selectedTournamentDetailRound;
        if(newRound==tournaments[selectedSkill][selectedTournamentDetail].numRounds){
            newRound=1;
        }else{
            newRound=numberMod(newRound+1,tournaments[selectedSkill][selectedTournamentDetail].numRounds+1);
        }

        setGamesLoading(true);

        //fetch user data of games in new round, if never fetched and calculate score
        for(const c in tournaments[selectedSkill][selectedTournamentDetail].games[newRound]){
            const game=tournaments[selectedSkill][selectedTournamentDetail].games[newRound][c];

            await fetchUserDataGame(game);

            //calculate score
            tournaments[selectedSkill][selectedTournamentDetail].games[newRound][c].scores=calculateGameScoreTournament(game.duels);
        }

        setGamesLoading(false);
        setSelectedTournamentDetailRound(newRound);
    }

    const decrementSelectedRound=async()=>{
        var newRound=selectedTournamentDetailRound;
        if(newRound==1){
            newRound=tournaments[selectedSkill][selectedTournamentDetail].numRounds;
        }else{
            newRound=numberMod(newRound-1,tournaments[selectedSkill][selectedTournamentDetail].numRounds);
        }

        setGamesLoading(true);

        //fetch user data of games in new round, if never fetched and calculate score
        for(const c in tournaments[selectedSkill][selectedTournamentDetail].games[newRound]){
            const game=tournaments[selectedSkill][selectedTournamentDetail].games[newRound][c];

            await fetchUserDataGame(game);

            //calculate score
            tournaments[selectedSkill][selectedTournamentDetail].games[newRound][c].scores=calculateGameScoreTournament(game.duels);
        }

        setGamesLoading(false);
        setSelectedTournamentDetailRound(newRound);
    }


    if(isPlayScreen){
        return <Play 
            user={props.user}
            skill={selectedSkill}
            parameters={tournaments[selectedSkill][selectedTournamentDetail].userNextDuelIndex}
            tournament={{
                id:tournaments[selectedSkill][selectedTournamentDetail].id,
                round:tournaments[selectedSkill][selectedTournamentDetail].currentRound,
                gameIndex:tournaments[selectedSkill][selectedTournamentDetail].userNextGameIndex,
                duelId:tournaments[selectedSkill][selectedTournamentDetail].userNextDuelIndex,
                userGameIndex:tournaments[selectedSkill][selectedTournamentDetail].userIndexInGame
            }}
        />;
    }else{
        return(
            <Container bg="bg-resultsBg" overflowHidden={true}>
                <div className="relative w-full h-[100vh] flex flex-col items-center" ref={tournamentListRef}>
                    <div className="w-full flex flex-row mt-3">
                        <div className="text-white text-lg font-default pl-3 basis-[30%]"><Link to="/">SKILL CHALLENGE</Link></div>
                        <div className="text-white text-2xl basis-[40%] text-center">TOURNAMENTS</div>
                    </div>
    
                    <div className="relative flex flex-row items-center gap-3 py-2 px-3 bg-white bg-opacity-20 rounded-md mt-3">
                        {skills.map((skill,index)=>{
                            return(
                                <div className="flex items-center justify-center w-[38px] z-[2] cursor-pointer" onClick={()=>changeSelectedSkill(index)} key={skill.title}>
                                    <i className={"text-white text-[25px] leading-[0] "+skill.icon}/>
                                </div>
                            );
                        })}
    
                        <div className="absolute w-[38px] h-[85%] top-[50%] translate-y-[-50%] bg-tooltipColor rounded-md transition-all duration-300 z-[1]"
                            style={{left:(12+(selectedSkill)*50)+"px"}}
                        ></div>
                    </div>
    
                    <div className="relative !flex-1 w-full flex flex-col gap-5 items-center">
                        {isLoading &&
                            <i className="fi fi-tr-loading my-auto text-[45px] text-white leading-[0] origin-center animate-rotation"></i>
                        }
    
                        {!isLoading && <>
                        <div className="self-start ml-4 px-3 w-[95%] py-1 border-b-2 border-white border-opacity-60">
                            <div className="text-white text-2xl animate-fadeLeft">{skills[selectedSkill].title}</div>
                        </div>
    
                        {tournaments[selectedSkill].length>0 && <>
                        <div className="relative flex flex-row gap-7 py-4 pl-4 pr-[50px] rounded-md bg-whiteOverDarkBlue font-navbar overflow-hidden z-[2] animate-popUp">
                            <div className="flex flex-col gap-2">
                                <div className="text-white text-2xl leading-[24px] font-default">{tournaments[selectedSkill][0].name.toUpperCase()}</div>
                                <div className="max-w-[250px] text-white text-sm line-clamp-2 text-justify">{tournaments[selectedSkill][0].description}</div>
                                
                                {tournaments[selectedSkill][0].status=="open" && <>
                                <div className="text-white text-base flex flex-row gap-3 items-center" title="Available places"> 
                                    <i className="fi fi-sr-users leading-[0]"></i>
                                    {tournaments[selectedSkill][0].numUsers-tournaments[selectedSkill][0].subscribedUsers.length}
                                </div>

                                <div className="text-white text-xs text-opacity-75">Start at:&emsp;{prettyPrintDateAndHours(tournaments[selectedSkill][0].startDate.toDate())}</div>
                                
                                {tournaments[selectedSkill][0].requirements.length==0 && <div className="text-white text-xs">Free Entry</div>}
    
                                </>}
                                
                                <div className="flex flex-row items-center gap-3">
                                    {tournaments[selectedSkill][0].status=="open" && 
                                    <button className={"bg-white bg-opacity-30 mt-4 rounded-md text-base text-white py-1 text-center w-[150px] "+((tournaments[selectedSkill][0].matchesAllrequirements && !tournaments[selectedSkill][0].userIsSubscribed && tournaments[selectedSkill][0].placesLeft>0)?"":"opacity-50")} 
                                        disabled={  //user cant subscribe if: 
                                            !tournaments[selectedSkill][0].matchesAllrequirements || //do not match al requirements
                                            tournaments[selectedSkill][0].userIsSubscribed ||  //is already subscribed
                                            (tournaments[selectedSkill][0].placesLeft==0)  //there are no places left
                                        } 
                                        onClick={()=>subscribeTournament(0)}
                                        title={tournaments[selectedSkill][0].matchesAllrequirements?"":"Not all requirements are matched"}
                                        ref={firstTournamentSubscribeButtonRef}
                                    >
                                        <div className="flex justify-center items-center">
                                        {!subscribeLoading?
                                            (tournaments[selectedSkill][0].placesLeft==0?"No places left":
                                            (tournaments[selectedSkill][0].userIsSubscribed?"Already subcribed":"Subscribe"))
                                        :""}
    
                                        {subscribeLoading && <i className="fi fi-tr-loading text-white leading-[0] origin-center animate-rotation my-1"></i>}
                                        </div>
                                    </button>}
    
                                    {tournaments[selectedSkill][0].status=="progress" && 
                                    <button className="bg-white bg-opacity-30 mt-4 rounded-md text-base text-white py-1 text-center w-[150px]" 
                                        onClick={()=>moreDetails(0)}
                                    >More Details</button>}
    
                                    {tournaments[selectedSkill][0].status=="open" && 
                                    <button className="bg-white bg-opacity-30 mt-4 rounded-md text-base text-white py-1 text-center w-[150px]" 
                                        onClick={()=>moreDetails(0)}
                                    >More Details</button>}
                                </div>
                                
                            </div>
    
                            {tournaments[selectedSkill][0].requirements.length!=0 && tournaments[selectedSkill][0].status=="open" &&
                            <div className="flex flex-col gap-2 border-l-2 border-white border-opacity-60 pl-4 py-2">
                                {tournaments[selectedSkill][0].requirements.map((req)=>{
                                    return(
                                        <div className="flex flex-row items-center gap-3">
                                            <div className="text-[20px] leading-[0]">
                                                {req.matched?<i class="fi fi-ss-check-circle text-mainGreen"></i>:<i class="fi fi-sr-cross-circle text-mainRed"></i>}    
                                            </div>
                                            <div className="text-white text-sm max-w-[200px] line-clamp-1" title={req.description}>{req.description}</div>
                                        </div>
                                    )
                                })}
                            </div>}
                            
                            
                            <div className={"absolute top-0 right-0 h-full w-[30px] bg-opacity-60 flex items-center justify-center "+(tournaments[selectedSkill][0].status=="open"?"bg-mainGreen":"bg-yellow-gold")}>
                                <div className="text-white text-[18px] font-default font-thin origin-center rotate-[270deg]">{tournaments[selectedSkill][0].status.toUpperCase()}</div>
                            </div>
                        </div>
                        
                        <div className="w-[80%] flex flex-row content-start gap-4 flex-nowrap py-3 px-5 z-[2] overflow-x-auto">
                            {tournaments[selectedSkill].slice(1).map((tournament,index)=>{
                                return(
                                    <div className="relative flex flex-none flex-col gap-2 py-4 pl-4 pr-[50px] rounded-md bg-whiteOverDarkBlue font-navbar overflow-hidden z-[2] h-min animate-popUp">
                                        <div className="text-white text-xl leading-[24px] font-default">{tournament.name.toUpperCase()}</div>
                                        <div className="max-w-[250px] text-white text-sm line-clamp-2 text-justify">{tournament.description}</div>
                                    
                                        <div className={"absolute top-0 right-0 h-full w-[30px] bg-opacity-60 flex items-center justify-center "+(tournament.status=="open"?"bg-mainGreen":"bg-yellow-gold")}>
                                            <div className="text-white text-[18px] font-default font-thin origin-center rotate-[270deg]">{tournament.status.toUpperCase()}</div>
                                        </div>
    
                                        <button className="bg-white bg-opacity-30 mt-4 rounded-md text-base text-white py-1 text-center w-[150px]" 
                                            onClick={()=>moreDetails(index+1)}
                                        >More Details</button>
                                    </div>
                                )
                            })}
                        </div>
                        </>}
    
                        {tournaments[selectedSkill].length==0 && <div className="text-white text-xl text-opacity-70">NO TOURNAMENTS FOUND</div>}
                    
                        <i className={"absolute text-[300px] leading-[0] text-white text-opacity-5 bottom-7 right-10 animate-fadeUp "+skills[selectedSkill].icon}/>
                        </>}
                    </div>
                </div>
    
    
                {/*SINGLE TOURNAMENT SCREEN*/}
                {!isLoading && tournaments[selectedSkill].length>0 &&
                <div className="relative w-full h-[100vh] flex flex-col font-navbar overflow-hidden" ref={tournamentDetailRef}>
                    {tournamentDetailLoading && <i className="fi fi-tr-loading mx-auto my-auto text-white leading-[0] text-[40px] origin-center animate-rotation"></i>}

                    {!tournamentDetailLoading && <>
                    <div className="relative w-full animate-fadeDown">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 220" preserveAspectRatio="none" className="h-[100px] w-full">
                            <path fill="rgba(255,255,255,0.13)" fillOpacity="1" d="M0,192L48,192C96,192,192,192,288,192C384,192,480,192,576,197.3C672,203,768,213,864,186.7C960,160,1056,96,1152,85.3C1248,75,1344,117,1392,138.7L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                        </svg>
    
                        <div className="absolute flex flex-col gap-2 top-4 left-5 text-white text-2xl font-default animate-fadeLeft">
                            <div className="bg-white p-1 px-2 w-min rounded-[4px] text-black text-xs flex flex-row font-navbar items-center cursor-pointer" onClick={()=>goBackToList()}>
                                BACK&emsp;
                                <i className="fi fi-sr-arrow-square-up !leading-[0]"></i>
                            </div>
                            <div>{tournaments[selectedSkill][selectedTournamentDetail].name.toUpperCase()}</div>
                        </div>
                    </div>
    
                    <div className="ml-5 max-w-[90%] text-white text-base line-clamp-1 text-justify">
                        {tournaments[selectedSkill][selectedTournamentDetail].description}
                    </div>

                    {//TOURNAMENT OPEN
                    tournaments[selectedSkill][selectedTournamentDetail].status=="open" && selectedState==1 &&
                    <div className="w-full !flex-1 flex flex-row gap-5 items-center mt-5">
                        <div className="basis-[45%] h-full flex flex-col ml-8 gap-5 pb-5">
                            <div className="text-white text-2xl flex flex-row gap-3 items-center" title="Available places"> 
                                <i className="fi fi-sr-users leading-[0]"></i>
                                {tournaments[selectedSkill][selectedTournamentDetail].numUsers-tournaments[selectedSkill][selectedTournamentDetail].subscribedUsers.length}
                            </div>
    
                            {tournaments[selectedSkill][selectedTournamentDetail].requirements.length==0 && <div className="text-white text-xs">Free Entry</div>}
    
                            {tournaments[selectedSkill][selectedTournamentDetail].requirements.length>0 && 
                            <div className="w-full flex flex-col">
                                <div className={"w-[35px] h-[3px] "+(tournaments[selectedSkill][selectedTournamentDetail].requirements[0].matched?"bg-mainGreen":"bg-mainRed")}></div>
                                {tournaments[selectedSkill][selectedTournamentDetail].requirements.map((req)=>{
                                    return(
                                        <div className="w-full flex flex-row items-center gap-3">
                                            <div className="relative w-[35px] h-[35px] flex items-center justify-center">
                                                <i class={"z-[2] bg-resultsBg text-[25px] leading-[0] "+(req.matched?"fi fi-ss-check-circle text-mainGreen":"fi fi-sr-cross-circle text-mainRed")}></i>
                                                <div className={"absolute h-full w-1 z-[1] "+(req.matched?"bg-mainGreen":"bg-mainRed")}></div>  
                                            </div>
                                            <div className="text-white text-sm flex-1 line-clamp-1" title={req.description}>{req.description}</div>
                                        </div>
                                    )
                                })}
                                <div className={"w-[35px] h-[3px] "+(tournaments[selectedSkill][selectedTournamentDetail].requirements.at(-1).matched?"bg-mainGreen":"bg-mainRed")}></div>
                            </div>}
    
                            <div className="flex flex-row gap-3 items-center text-sm text-white text-opacity-70">
                                {<i class={"z-[2] bg-resultsBg text-[20px] leading-[0] "+(tournaments[selectedSkill][selectedTournamentDetail].matchesAllrequirements?"fi fi-ss-check-circle text-mainGreen":"fi fi-sr-cross-circle text-mainRed")}></i>}
                                
                                {tournaments[selectedSkill][selectedTournamentDetail].matchesAllrequirements?"All requirements are matched":"Not all requirements are matched"}
                            </div>

                            <div className="text-white text-xs text-opacity-75">Start at:&emsp;{prettyPrintDateAndHours(tournaments[selectedSkill][selectedTournamentDetail].startDate.toDate())}</div>
                            
                            <button className={"mt-auto bg-white bg-opacity-30 rounded-md text-base text-white py-1 text-center w-[150px] "+
                                    ((tournaments[selectedSkill][selectedTournamentDetail].matchesAllrequirements && !tournaments[selectedSkill][selectedTournamentDetail].userIsSubscribed && (tournaments[selectedSkill][selectedTournamentDetail].placesLeft>0))?"":"opacity-50")
                                } 
                                disabled={  //user cant subscribe if: 
                                    !tournaments[selectedSkill][selectedTournamentDetail].matchesAllrequirements || //do not match al requirements
                                    tournaments[selectedSkill][selectedTournamentDetail].userIsSubscribed ||  //is already subscribed
                                    (tournaments[selectedSkill][selectedTournamentDetail].placesLeft==0)  //there are no places left
                                } 
                                onClick={()=>subscribeTournament(selectedTournamentDetail,true)}
                                title={tournaments[selectedSkill][selectedTournamentDetail].matchesAllrequirements?"":"Not all requirements are matched"}
                                ref={firstTournamentSubscribeButtonDetailsRef}
                            >
                                <div className="flex justify-center items-center">
                                {!subscribeLoading?
                                    (tournaments[selectedSkill][selectedTournamentDetail].placesLeft==0?"No places left":
                                    (tournaments[selectedSkill][selectedTournamentDetail].userIsSubscribed?"Already subcribed":"Subscribe"))
                                :""}
    
                                {subscribeLoading && <i className="fi fi-tr-loading text-white leading-[0] origin-center animate-rotation my-1"></i>}
                                </div>
                            </button>
                        </div>
                    </div>}
    
    
                    {//TOURNAMENT IN PROGRESS
                    tournaments[selectedSkill][selectedTournamentDetail].status=="progress" && selectedState==1 &&
                        <div className="w-full !flex-1 flex flex-row gap-5 items-center mt-3 pb-3">
                            <div className="basis-[45%] h-full flex flex-col items-center">
                                {//if current user play in the current round of the tournament and is subscribed to the tournament, show his next game
                                tournaments[selectedSkill][selectedTournamentDetail].userInThisRound && tournaments[selectedSkill][selectedTournamentDetail].userIsSubscribed && <>
                                    <div className="text-white text-xl font-semibold">NEXT GAME</div>
    
                                    <div className="text-white text-sm px-3 py-1 font-navbar bg-tooltipColor rounded-t-md mt-3">{"ROUND "+tournaments[selectedSkill][selectedTournamentDetail].currentRound}</div>
                                    <div className="flex flex-row items-center justify-center gap-5 py-2 px-4 rounded-bl-md rounded-tr-md bg-tooltipColor">
                                        {//for each user in the game in which current user playes 
                                        tournaments[selectedSkill][selectedTournamentDetail].userNextGame.users.map((user,index)=>{
                                            const userData=usersData.filter(u=>u.id==user)[0];
                                            return(<>
                                                <div className="flex flex-row items-center gap-2">
                                                {index==0 && <>
                                                    <img src={userData.profileImage} className="w-[20px] h-[20px] rounded-full"/>
                                                    <div className={"font-navbar text-white text-sm w-[130px] line-clamp-1 "+((!tournaments[selectedSkill][selectedTournamentDetail].userNextGame.playing && tournaments[selectedSkill][selectedTournamentDetail].userNextGame.winner==1)?"text-opacity-50":"")} title={userData.username}>{userData.username}</div>
                                                    <div className="font-navbar text-white text-xs">{tournaments[selectedSkill][selectedTournamentDetail].userNextGame.scores[0]}</div>
                                                </>}
                                                {index==1 && <>
                                                    <div className="font-navbar text-white text-xs">{tournaments[selectedSkill][selectedTournamentDetail].userNextGame.scores[1]}</div>
                                                    <div className={"font-navbar text-white text-right text-sm w-[130px] line-clamp-1 "+((!tournaments[selectedSkill][selectedTournamentDetail].userNextGame.playing && tournaments[selectedSkill][selectedTournamentDetail].userNextGame.winner==0)?"text-opacity-50":"")} title={userData.username}>{userData.username}</div>
                                                    <img src={userData.profileImage} className="w-[20px] h-[20px] rounded-full"/>
                                                </>}
                                                </div>
    
                                                {index==0 && 
                                                <div className="relative flex flex-row items-center justify-center h-[32px]">
                                                    <div className="text-white font-default z-[2] bg-tooltipColor leading-[20px] h-[20px]">VS</div>
                                                    <div className="absolute h-full w-[1px] bg-white bg-opacity-60"></div>
                                                </div>}
                                            </>);
                                        })}
                                    </div>
    
                                    {skills[selectedSkill].skillParametersPossibleValues.map((param,index)=>{
                                        //for each possible parameter of the skill in the tournament, print the duel of the game for each of them
                                        return(
                                            <div className={"flex flex-row items-center gap-2 py-2 px-2 bg-darkBlue bg-opacity-15 "+(index==(skills[selectedSkill].skillParametersPossibleValues.length-1)?"rounded-b-md":"")}>
                                                
                                                {[0,1].map((user)=>{
                                                    return(<>
                                                        <div className={"text-white font-default w-[100px] text-center "+((tournaments[selectedSkill][selectedTournamentDetail].userNextGame.duels[skillParametersJoinPrint(param)].winner!=user)?"text-opacity-50":"")}>
                                                            {//print "-" if the duel related to these params, has not been played by the user. If it has been played, print the performanceparameter value obtained
                                                            //by the user in this duel
                                                            tournaments[selectedSkill][selectedTournamentDetail].userNextGame.duels[skillParametersJoinPrint(param)]==undefined?
                                                            "-":tournaments[selectedSkill][selectedTournamentDetail].userNextGame.duels[skillParametersJoinPrint(param)].results[user]}
                                                        </div>
                                                        
                                                        {user==0 && <div className="flex flex-col h-full items-center justify-center" title={prettyPrintParameter(skills[selectedSkill].skillParametersLongName.join("  -  "))}>
                                                            <div className="h-[4px] w-[1px] bg-white bg-opacity-60"></div>
                                                            <div className="text-white font-navbar text-[10px] leading-[16px]">{skillParametersJoinPrint(param)}</div>
                                                            <div className="h-[4px] w-[1px] bg-white bg-opacity-60"></div>
                                                        </div>}
                                                    </ >)
                                                })}
                                            </div>
                                        );
                                    })}
    
                                    <div className="text-white font-navbar bg-darkBlue bg-opacity-15 px-4 py-1 rounded-b-md text-xs">{prettyPrintParameter(skills[selectedSkill].skillPerformanceParameter)}</div>
    
                                    {//if the game is not ended and the user has duels to play, show the play button
                                    tournaments[selectedSkill][selectedTournamentDetail].userNextGame.playing && tournaments[selectedSkill][selectedTournamentDetail].userHasToPlay && 
                                    <button className="bg-whiteOverDarkBlue rounded-sm mt-5 text-base text-white py-1 w-[100px] shadow-[0px_0px_12px_3px_rgba(255,255,255,0.2)] transition-all duration-300 hover:scale-110 hover:bg-white hover:bg-opacity-30" onClick={()=>setIsPlayScreen(true)}>PLAY</button>
                                    }
    
                                    {(!tournaments[selectedSkill][selectedTournamentDetail].userNextGame.playing || !tournaments[selectedSkill][selectedTournamentDetail].userHasToPlay) &&
                                    <div className="text-white text-sm text-opacity-70 mt-3">Game played, wait for the next one!</div>
                                    }
                                    
                                    <div className="text-white text-opacity-70 text-xs whitespace-pre flex flex-col items-center gap-3 mt-5">To be played by:&emsp;
                                        {prettyPrintDateAndHours(tournaments[selectedSkill][selectedTournamentDetail].userNextGame.expirationDate.toDate())}
                                        <div className="text-[10px] leading-[14px] text-center w-[170px] text-wrap text-opacity-50">Failure to respect the expiration date will results in the loss of the game</div>
                                    </div>
                                </>}
    
                                {(!tournaments[selectedSkill][selectedTournamentDetail].userInThisRound || !tournaments[selectedSkill][selectedTournamentDetail].userIsSubscribed) &&
                                    <div className="text-white text-opacity-70 text-2xl font-default mt-5 w-[80%] text-wrap text-center">YOU ARE NOT SUBSCRIBED TO THIS TOURNAMENT OR NOT IN THIS ROUND</div>
                                }
                            </div>
    
    
                            <div className="basis-[45%] h-full flex flex-col gap-2 items-center border-l-2 border-white border-opacity-40">
                                <div className="text-white text-xl font-semibold">GAMES</div>
                                <div className="flex flex-row items-center gap-7">
                                    <div className="text-white cursor-pointer transition-all duration-300 select-none hover:scale-110" onClick={()=>(!gamesLoading)?decrementSelectedRound():""}>⮘</div>
                                    <div className="text-white text-base">{"ROUND "+selectedTournamentDetailRound}</div>
                                    <div className="text-white cursor-pointer transition-all duration-300 select-none hover:scale-110" onClick={()=>(!gamesLoading)?incrementSelectedRound():""}>⮚</div>
                                </div>
    
                                <div className="w-full flex-1 p-3 pb-5 flex flex-col items-center gap-3 overflow-y-auto">
                                    {gamesLoading && <i className="fi fi-tr-loading text-white leading-[0] text-[40px] origin-center animate-rotation"></i>}
                                    
                                    {!gamesLoading && tournaments[selectedSkill][selectedTournamentDetail].games[selectedTournamentDetailRound]!=undefined && 
                                    tournaments[selectedSkill][selectedTournamentDetail].games[selectedTournamentDetailRound].map((game)=>{
                                        return(
                                            <div className="!flex-none flex flex-row items-center justify-center gap-5 py-1 px-4 rounded-bl-md rounded-tr-md bg-tooltipColor z-[2]">
                                                {//for each user in the game
                                                game.users.map((user,index)=>{
                                                    const userData=usersData.filter(u=>u.id==user)[0];
                                                    return(<>
                                                        <div className="flex flex-row items-center gap-2">
                                                            {index==0 && <>
                                                                <img src={userData.profileImage} className="w-[20px] h-[20px] rounded-full"/>
                                                                <div className={"font-navbar text-white text-sm w-[130px] line-clamp-1 "+((!game.playing && game.winner==1)?"text-opacity-50":"")} title={userData.username}>{userData.username}</div>
                                                                <div className="font-navbar text-white text-xs">{game.scores[0]}</div>
                                                            </>}
                                                            {index==1 && <>
                                                                <div className="font-navbar text-white text-xs">{game.scores[1]}</div>
                                                                <div className={"font-navbar text-white text-right text-sm w-[130px] line-clamp-1 "+((!game.playing && game.winner==0)?"text-opacity-50":"")} title={userData.username}>{userData.username}</div>
                                                                <img src={userData.profileImage} className="w-[20px] h-[20px] rounded-full"/>
                                                            </>}
                                                        </div>
    
                                                        {index==0 && 
                                                        <div className="relative flex flex-row items-center justify-center h-[32px]">
                                                            <div className="text-white font-default z-[2] bg-tooltipColor leading-[20px] h-[20px]">VS</div>
                                                            <div className="absolute h-full w-[1px] bg-white bg-opacity-60"></div>
                                                        </div>}
                                                    </>);
                                                })}
                                            </div>
                                        );
                                    })}
    
                                    {!gamesLoading && tournaments[selectedSkill][selectedTournamentDetail].games[selectedTournamentDetailRound]==undefined &&
                                        <div className="text-white text-opacity-70 text-base font-default">NO GAMES FOUND</div>
                                    }
                                </div>
                            </div>
                        </div>
                    }
                    </>}
    
                    {!subscribeLoading && <i className={"absolute text-[300px] leading-[0] text-whiteOverDarkBlue text-opacity-15 bottom-7 right-10 animate-fadeUp "+skills[selectedSkill].icon}/>}
                </div>}
            </Container>
        )
    }
};

export default Tournaments;