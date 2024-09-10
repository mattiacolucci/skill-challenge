import { cloneElement, useEffect, useRef, useState } from "react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import { deleteAccount, getAllUserGames, getSkillLeaderboard, getUserData, getUserPersonalBest, getUserPositionInLeaderboard, signOutWithGoogle, updateUserCountry, updateUserUsername } from "../firebase";
import UserLevel from "../components/UserLevel";
import Notice from "../components/Notice";
import { useNavigate } from "react-router-dom";
import { Option, Select } from "@material-tailwind/react";
import { countries, lineChartColors, skills } from "../assets/data";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { numberMod, prettyPrintDate, prettyPrintParameter, skillParametersJoinPrint, TooltipChartCustom } from "../utility.jsx";

const Profile=(props)=>{
    const [isLoading,setIsLoading]=useState(true);
    const [userData,setUserdata]=useState({});

    const [isOpenUserSettings,setIsOpenUserSettings]=useState(false);
    const [showDeleteUser,setShowDeleteUser]=useState(false);

    //edit country
    const [showCountryChange,setShowCountryChange]=useState(false);
    const [newCountry,setNewCountry]=useState("");

    //edit username
    const [showEditUsername,setShowEditUsername]=useState(false);
    const [newUsername,setNewUsername]=useState("");

    //last games
    const [lastGamesSelectedSkill,setLastGameSelectedSkill]=useState(0);
    const [lastGamesSelectedParameters,setLastGamesSelectedParameters]=useState(0);
    const [filteredGamesData,setFilteredGamesData]=useState([]);
    const [filteredPersonalBests,setFilteredPersonalBests]=useState({});
    const [userPosition,setUserPosition]=useState([]);
    const [isLoadingPosition,setIsLoadingPosition]=useState(true);

    const noticeRef=useRef();
    const navigate=useNavigate();
    const countriesData=countries;
    countriesData.sort(function(a, b) {
        return a.name > b.name ? 1 : -1;
    });

    useEffect(()=>{
        const fetchUserData=async ()=>{
            const [response,usrData] = await getUserData(props.user.uid);
            
            if(response){
                const [resp,games] = await getAllUserGames(props.user.uid);

                if(resp){
                    setUserdata({name:props.user.displayName,profileImage:props.user.photoURL,games:games,...usrData});
                    setNewCountry(usrData.country);
                    setNewUsername(usrData.username);

                    setIsLoadingPosition(true);

                    //calculate user position based on default skill and parameters selected
                    await calculateUserPosition(usrData);

                    //filter last games based on selected default skill and parameters
                    filterGames(games);

                    setIsLoadingPosition(false);
                }else{
                    console.log(games);
                }
            }else{
                console.log(userData);
            }

            setIsLoading(false);
        }

        fetchUserData();
    },[])

    const signOut=async ()=>{
        try{
            noticeRef.current.triggerNotice("Signing out...",async()=>{await signOutWithGoogle();navigate("/")});
        }catch(e){
            noticeRef.current.triggerNotice(e.message);
        }
    }

    const changeCountry=async()=>{
        const [resp,message]=await updateUserCountry(newCountry);
        
        if(resp){
            setUserdata({...userData,country:newCountry});
            noticeRef.current.triggerNotice("Country updated!");
        }else{
            noticeRef.current.triggerNotice("Update failed");
        }

        setShowCountryChange(false);
    }

    const changeUsername=async()=>{
        const [resp,message]=await updateUserUsername(newUsername);
        
        if(resp){
            setUserdata({...userData,username:newUsername});
            noticeRef.current.triggerNotice("Username updated!");
        }else{
            noticeRef.current.triggerNotice("Update failed");
            console.log(message)
        }

        setShowEditUsername(false);
    }

    const filterGames=(games)=>{
        var filteredGames=[];

        //get all games which has selected parameters and selected skill
        for(var i=0;i<games.length;i++){
            var addGame=true;
            const selectedSkillTitle=skills[lastGamesSelectedSkill].title;

            //if the game is relative to the non selected skill, do not add it to filtered games
            if(games[i].skill!=selectedSkillTitle){
                addGame=false;
                continue;
            }

            //if the skill parameter of the gameis different from the selected one, do not add it to the filtered games
            const selectedSkillsParameters=skills[lastGamesSelectedSkill].skillParametersPossibleValues[lastGamesSelectedParameters];
            if(games[i].skillParameters!=skillParametersJoinPrint(selectedSkillsParameters)){
                addGame=false;
                continue;
            }

            if(addGame){
                filteredGames.push(games[i]);
            }
        }

        //sort games by date from the most recent
        filteredGames=filteredGames.sort((g1,g2)=>g2.date.toDate().getTime()-g1.date.toDate().getTime())

        //calculate personal bests
        filterPersonalBests(filteredGames);

        //get last 5 games
        filteredGames=filteredGames.slice(0,5).reverse();

        setFilteredGamesData(filteredGames);
    }

    //function which gets personal bests of the user based on skills and its parameters selected
    const filterPersonalBests=(gamesAlreadyFiltered)=>{
        var personalBests={};
        const resultsParameters=skills[lastGamesSelectedSkill].skillResultsParameters;

        //if the user has not done games according to selected skill and parameters, set empty personal bests and return
        if(gamesAlreadyFiltered.length==0){
            setFilteredPersonalBests(personalBests);
            return;
        }

        for(var i in resultsParameters){
            const copyOfGamesFiltered=gamesAlreadyFiltered.map(g=>g);
            personalBests[resultsParameters[i]]={
                value:copyOfGamesFiltered.sort((a,b)=>a[resultsParameters[i]]-b[resultsParameters[i]])[0][resultsParameters[i]],
                date:new Date(copyOfGamesFiltered.sort((a,b)=>a[resultsParameters[i]]-b[resultsParameters[i]])[0].date.toDate())
            };
        }

        setFilteredPersonalBests(personalBests);
    }

    const calculateUserPosition=async(usrData=userData)=>{
        setIsLoadingPosition(true);

        //if I have not yet calculate user position for selected skill and parameters
        if(userPosition[lastGamesSelectedSkill]==undefined || userPosition[lastGamesSelectedSkill][lastGamesSelectedParameters]==undefined){
            var userPositionCopy=structuredClone(userPosition);

            for(const r in skills[lastGamesSelectedSkill].skillResultsParameters){
                const resultParameter=skills[lastGamesSelectedSkill].skillResultsParameters[r];

                //get user World position for selected skill and parameters and for relative result parameter
                const [respW,worldPosition]=await getUserPositionInLeaderboard(props.user.uid,lastGamesSelectedSkill,lastGamesSelectedParameters,resultParameter,null,"WR");

                if(respW){
                    //get user national position for selected skill and parameters and for relative result parameter
                    const [respN,nationalPosition]=await getUserPositionInLeaderboard(props.user.uid,lastGamesSelectedSkill,lastGamesSelectedParameters,resultParameter,usrData.country,"NR");
                    
                    if(respN){
                        if(userPositionCopy[lastGamesSelectedSkill]==undefined){
                            userPositionCopy[lastGamesSelectedSkill]={};
                        }

                        if(userPositionCopy[lastGamesSelectedSkill][lastGamesSelectedParameters]==undefined){
                            userPositionCopy[lastGamesSelectedSkill][lastGamesSelectedParameters]={WR:{},NR:{}};
                        }

                        //store positions
                        userPositionCopy[lastGamesSelectedSkill][lastGamesSelectedParameters].WR[resultParameter]=worldPosition;
                        userPositionCopy[lastGamesSelectedSkill][lastGamesSelectedParameters].NR[resultParameter]=nationalPosition;
                    }else{
                        console.log(nationalPosition);
                    }
                }else{
                    console.log(worldPosition);
                }
            }

            setUserPosition(userPositionCopy);
        }
    }

    //recalulate filtered games and user position every time the skill selected changes or selected skill's parameters change
    useEffect(()=>{
        const getData=async()=>{
            if(Object.keys(userData).length!=0 && userData.games!=undefined){
                setIsLoadingPosition(true);
    
                //recalculate user position in world and national leaderboard
                await calculateUserPosition();
    
                //recalulate filteredGames
                filterGames(userData.games);
    
                setIsLoadingPosition(false);
            }
        }

        getData();
    },[lastGamesSelectedSkill, lastGamesSelectedParameters])

    const goNextSelectedSkill=()=>{
        setIsLoadingPosition(true);
        setLastGameSelectedSkill(numberMod(lastGamesSelectedSkill+1,skills.length));
    }

    const goPreviousSelectedSkill=()=>{
        setIsLoadingPosition(true);
        setLastGameSelectedSkill(numberMod(lastGamesSelectedSkill-1,skills.length));
    }

    const goNextSelectedSkillsParameters=()=>{
        setIsLoadingPosition(true);

        const numOfSkillsParameters=skills[lastGamesSelectedSkill].skillParametersPossibleValues.length;
        setLastGamesSelectedParameters(numberMod(lastGamesSelectedParameters+1,numOfSkillsParameters));
    }

    const goPreviousSelectedSkillsParameters=()=>{
        setIsLoadingPosition(true);

        const numOfSkillsParameters=skills[lastGamesSelectedSkill].skillParametersPossibleValues.length;
        setLastGamesSelectedParameters(numberMod(lastGamesSelectedParameters-1,numOfSkillsParameters));
    }

    const deleteUserAccount=async()=>{
        const [resp,message]=await deleteAccount();

        if(resp){
            noticeRef.current.triggerNotice("Deleting Account...",async()=>{await signOutWithGoogle();navigate("/")});
        }else{
            noticeRef.current.triggerNotice("Account Delete Failed!");
        }
    }

    if(isLoading){
        return <Loading/>
    }else{
        return(
            <Container bg="bg-resultsBg" overflowHidden={true}>
                <Navbar isLogged={props.isSignedIn} user={props.user}/>
                
                <div className="w-screen flex flex-row mt-5">
                    <div className="basis-[33%] flex flex-col items-center gap-3">
                        <img src={userData.profileImage} className="w-[80px] h-[80px] rounded-full border-2 border-blueOverBg"/>
                        
                        <div className="w-[80%] flex flex-col items-center gap-1">
                            <div className="text-white font-default text-2xl w-full line-clamp-1 text-center" title={userData.username.toUpperCase()}>
                                {userData.username.toUpperCase()}<br/>
                            </div>

                            <div className="text-xs text-white text-opacity-60 font-navbar leading-1">EST. {prettyPrintDate(userData.creationDate.toDate())}</div>
                        </div>

                        {showEditUsername && <input type="text" className="w-[50%] p-1 pl-3 rounded-sm outline-none bg-white bg-opacity-20 font-navbar" value={newUsername} onChange={(e)=>setNewUsername(e.target.value)}/>}

                        {showEditUsername && 
                        <div className="flex flex-row items-center gap-3">
                            <div className="flex flex-row items-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainBlue" onClick={()=>changeUsername()}>
                                <i className="fi fi-rr-pen-square leading-[0] text-[8px]"></i>
                                Save username
                            </div>

                            <div className="flex flex-row items-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainRed" onClick={()=>setShowEditUsername(false)}>
                                <i className="fi fi-br-cross leading-[0] text-[8px]"></i>
                                Cancel
                            </div>
                        </div>}
                        
                        <div className="flex flex-row gap-3 items-center">
                            <img src={countriesData.find(c=>c.isoCountryCode==userData.country).flags.svg} className="h-[30px] w-[30px] rounded-full object-cover border-2 border-mainBlue"/>
                            <div className="text-white text-sm font-navbar">{countriesData.find(c=>c.isoCountryCode==userData.country).name.toUpperCase()}</div>
                        </div>

                        {showCountryChange && 
                        <Select
                            size="lg"
                            label="Select Country"
                            labelProps={{className:"text-white"}}
                            containerProps={{className:"!w-[50%] !min-w-[50%]"}}
                            menuProps={{className:"!top-[50px] !max-h-[150px]"}}
                            selected={(element) =>
                            element &&
                            cloneElement(element, {
                                disabled: true,
                                className:
                                "flex items-center opacity-100 px-0 gap-2 pointer-events-none text-white text-opacity-70",
                            })
                            }
                            value={newCountry}
                            onChange={(value)=>setNewCountry(value)}
                        >
                            {countriesData.map(({ name, isoCountryCode, flags }) => (
                            <Option key={name} value={isoCountryCode} className="flex items-center gap-2">
                                <img
                                src={flags.svg}
                                alt={name}
                                className="h-5 w-5 rounded-full object-cover"
                                />
                                {name}
                            </Option>
                            ))}
                        </Select>}

                        {showCountryChange && 
                        <div className="flex flex-row items-center gap-3">
                            <div className="flex flex-row items-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainBlue" onClick={()=>changeCountry()}>
                                <i className="fi fi-rr-pen-square leading-[0] text-[8px]"></i>
                                Save country
                            </div>

                            <div className="flex flex-row items-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainRed" onClick={()=>setShowCountryChange(false)}>
                                <i className="fi fi-br-cross leading-[0] text-[8px]"></i>
                                Cancel
                            </div>
                        </div>}

                        <UserLevel className="items-center" userLv={userData.lv} expValue={userData.exp} userProfileImage={userData.profileImage}
                        username={userData.name} rankingPoints={userData.rankingPoints}/>

                        <div className="text-white font-default text-2xl mt-7">RECORDS 
                            <span className="text-xs text-white text-opacity-60 ml-2 font-navbar">({Object.keys(userData.records).map(skill=>userData.records[skill].length).reduce((sum,a)=>sum+a,0)})</span>
                        </div>

                        <div className="h-[150px] px-2 w-[200px] flex flex-col gap-2 overflow-auto pb-3 shadow-[5px_5px_10px_-1px_rgba(29,78,216,0.4)]">
                            {Object.keys(userData.records).map((skill)=>{
                                return(<>
                                    <div className="w-full flex flex-row items-center gap-2 sticky top-0 bg-resultsBg">
                                        <div className="text-white text-opacity-50 font-default self-start text-sm">{skill}</div>
                                        <div className="flex-1 h-[2px] bg-white bg-opacity-40"></div>
                                    </div>
                                        {userData.records[skill].map((record,index)=>{
                                            const recordParameterNameWithSpaces=prettyPrintParameter(record.recordParameter);

                                            return (
                                            <div className="flex flex-row items-center gap-2 ml-2" key={"record"+index} title={skill+" "+record.recordType+" in "+recordParameterNameWithSpaces}>
                                                <div className={"text-[9px] w-[20px] h-[20px] text-center leading-[20px] "+((record.recordType=="PB")?"bg-blueOverBg bg-opacity-50":((record.recordType=="NR")?"bg-yellow-gold bg-opacity-50":"bg-yellow-gold bg-opacity-65"))}>
                                                    {record.recordType}
                                                </div>

                                                {record.skillParameters.map((param)=>{
                                                    return <div className="w-[18px] h-[18px] leading-[18px] text-[8px] text-center bg-blue-gray-800" title={Object.keys(param)[0]}>{Object.values(param)[0]}</div>
                                                })}

                                                <div className="text-white text-[9px]">{record.value}</div>
                                                
                                                <div className="text-white text-opacity-60 text-[8px]">{prettyPrintDate(record.date.toDate()) /*Get date as YYYY-MM-DD*/}</div>
                                            </div>
                                            )
                                        })}
                                </>)
                            })}
                        </div>
                    </div>


                    <div className="basis-[33%] flex flex-col items-center gap-4">
                        <div className="text-white text-2xl font-default">
                            LAST GAMES
                            <span className="text-xs text-white text-opacity-60 ml-2 font-navbar" title="Total Games Played">({userData.numGames})</span>
                        </div>

                        <div className="w-full flex flex-col items-center gap-1">
                            <div className="w-full flex flex-row items-center justify-center gap-1">
                                <div className="cursor-pointer text-xl select-none transition-all duration-300 hover:scale-125" onClick={()=>(!isLoadingPosition)?goPreviousSelectedSkill():""}>⮘</div>
                                <div className="w-[200px] text-center text-white font-navbar">{skills[lastGamesSelectedSkill].title}</div>
                                <div className="cursor-pointer text-xl select-none transition-all duration-300 hover:scale-125" onClick={()=>(!isLoadingPosition)?goNextSelectedSkill():""}>⮚</div>
                            </div>

                            <div className="w-full flex flex-row items-center justify-center gap-1">
                                <div className="cursor-pointer text-xl select-none transition-all duration-300 hover:scale-125" onClick={()=>(!isLoadingPosition)?goPreviousSelectedSkillsParameters():""}>⮘</div>
                                <div className="w-[200px] text-center text-white font-navbar">
                                    <span className="text-[13px] text-white text-opacity-65">
                                        {prettyPrintParameter(skills[lastGamesSelectedSkill].skillParameters.join("  -  "))}
                                    </span><br/>
                                    {skills[lastGamesSelectedSkill].skillParametersPossibleValues[lastGamesSelectedParameters].join("  -  ")}
                                </div>
                                <div className="cursor-pointer text-xl select-none transition-all duration-300 hover:scale-125" onClick={()=>(!isLoadingPosition)?goNextSelectedSkillsParameters():""}>⮚</div>
                            </div>
                            
                            <div className="mt-5 flex">
                                {filteredGamesData.length!=0 && !isLoadingPosition && <LineChart width={300} height={160} data={filteredGamesData} margin={{bottom:10,right:10}} style={{alignSelf:"center"}}>
                                    <CartesianGrid strokeDasharray="2" strokeOpacity={0.3}/>
                                    <XAxis minTickGap={10} dataKey="date" type="category" interval={"equidistantPreserveStartEnd"} label={{ value: 'Date', angle: 0, position: 'insideBottomRight', offset:7, fontSize:"12px"}} style={{ fontSize: '12px'}}/>
                                    <YAxis minTickGap={8} domain={[0, 'dataMax + 0.5']} type={"number"} interval={"equidistantPreserveStartEnd"} label={{ value: 'Value', angle: -90, fontSize:"11px", position:'insideBottom', offset:35}} style={{ fontSize: '12px'}}/>
                                    <Tooltip cursor={{stroke: "#BABABA",strokeWidth: 1,strokeDasharray: "5 5"}} wrapperStyle={{ outline: "none" }} content={(params)=>TooltipChartCustom(params)} />
                                    <Legend iconSize={10} formatter={(value, entry, index) => <span className="text-xs font-navbar opacity-75">{prettyPrintParameter(value)}</span>}/>
                                    {skills[lastGamesSelectedSkill].skillResultsParameters.map((param,index)=>{
                                        return <Line type="monotone" dataKey={param} stroke={lineChartColors[index]} strokeWidth={1.5}/>
                                    })}
                                </LineChart>}
                                
                                {filteredGamesData.length==0 && !isLoadingPosition && <div className="text-white text-opacity-65 mb-10">NO GAMES FOUND</div>}
                                
                                {isLoadingPosition &&
                                    <i className="fi fi-tr-loading text-[30px] text-white leading-[0] origin-center animate-rotation"></i>
                                }
                            </div>

                            {Object.keys(filteredPersonalBests).length!=0 && !isLoadingPosition && <>
                            <div className="text-white text-2xl font-default mt-2">PERSONAL BESTS</div>

                            
                            <div className="flex flex-col gap-[6px] mt-2">
                                {Object.keys(filteredPersonalBests).map((param)=>{
                                    return(
                                        <div className="flex flex-row items-center gap-4" key={"pesronal"+param}>
                                            <div className="text-white text-opacity-75 bg-tooltipColor rounded-sm p-1 px-2 text-sm font-navbar min-w-[100px]">{prettyPrintParameter(param)}</div>
                                            <div className="text-white text-opacity-70 text-sm min-w-[55px] text-center bg-white bg-opacity-5 p-1 px-2 rounded-sm">{filteredPersonalBests[param].value}</div>
                                            <div className="text-white text-opacity-70 text-xs">{prettyPrintDate(filteredPersonalBests[param].date)}</div>
                                        </div>
                                    )
                                })}
                            </div></>}
                        </div>

                    </div>


                    <div className="basis-[33%] flex flex-col items-center gap-4">

                    {isOpenUserSettings && <>
                            <div className="text-white text-2xl font-default">USER SETTINGS</div>

                            {!showEditUsername && 
                            <div className="flex flex-row w-[120px] items-center justify-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainBlue" onClick={()=>setShowEditUsername(true)}>
                                <i className="fi fi-rr-pen-square leading-[0] text-[8px]"></i>
                                Edit username
                            </div>}

                            {!showCountryChange && 
                            <div className="flex flex-row w-[120px] items-center justify-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainBlue" onClick={()=>setShowCountryChange(true)}>
                                <i className="fi fi-rr-pen-square leading-[0] text-[8px]"></i>
                                Edit country
                            </div>}

                            <button className="bg-mainRed text-white p-1 px-3 font-navbar outline-none rounded-sm" onClick={()=>signOut()}>Sign Out</button>

                            <button className="border-2 border-mainRed border-opacity-80 rounded-sm text-mainRed text-opacity-80 p-1 px-3 font-navbar outline-none" onClick={()=>setShowDeleteUser(true)}>Delete Account</button>

                            {showDeleteUser && 
                            <div className="flex flex-col p-2 items-center gap-2 animate-deleteAccount">
                                <div className="w-[200px] text-wrap text-xl text-white font-navbar font-semibold text-center">Confirm deleting your account?</div>

                                <div className="flex flex-row gap-2">
                                    <button className="w-[50px] bg-red-800 rounded-sm text-opacity-80 py-[2px] font-navbar outline-none" onClick={()=>deleteUserAccount()}>
                                        Yes
                                    </button>

                                    <button className="w-[50px] rounded-sm text-white bg-mainBlue py-[2px] font-navbar outline-none" onClick={()=>setShowDeleteUser(false)}>
                                        No
                                    </button>
                                </div>
                            </div>}
                        </>}

                        <div className={"w-[200px] flex flex-col items-center gap-1 px-2 transition-all duration-300 origin-top overflow-hidden "+(isOpenUserSettings?"scale-y-0 h-[1px]":"h-[60vh]")}>
                            {!isLoadingPosition &&
                                <>
                                <div className="text-white text-2xl font-default">USER POSITION</div>

                                {skills[lastGamesSelectedSkill].skillResultsParameters.map((param)=>{
                                    return(<>
                                        <div className="w-full flex flex-row items-center gap-2 mt-1">
                                            <div className="flex-1 h-[1px] bg-white bg-opacity-70"></div>
                                            <div className="text-white text-opacity-70 font-navbar self-start text-sm">{prettyPrintParameter(param)}</div>
                                            <div className="flex-1 h-[1px] bg-white bg-opacity-70"></div>
                                        </div>

                                        <div className="w-full flex flex-row items-center justify-center gap-10 mt-1">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="text-white text-opacity-75 text-base font-navbar font-semibold p-1 px-[6px] bg-tooltipColor">#&nbsp;
                                                    {(userPosition[lastGamesSelectedSkill][lastGamesSelectedParameters].WR[param]!=null)?
                                                    userPosition[lastGamesSelectedSkill][lastGamesSelectedParameters].WR[param]:
                                                    "-"}
                                                </div>

                                                <div className="text-white text-[8px] p-[2px] px-1 bg-yellow-gold bg-opacity-50 font-thin">WORLD</div>
                                            </div>
                                            
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="text-white text-opacity-75 text-base font-navbar font-semibold p-1 px-[6px] bg-tooltipColor">#&nbsp;
                                                    {(userPosition[lastGamesSelectedSkill][lastGamesSelectedParameters].NR[param]!=null)?
                                                    userPosition[lastGamesSelectedSkill][lastGamesSelectedParameters].NR[param]:
                                                    "-"}
                                                </div>

                                                <div className="text-white text-[8px] p-[2px] px-1 bg-yellow-gold bg-opacity-50 font-thin">NATION</div>
                                            </div>
                                        </div>
                                    </>)
                                })}
                                </>
                            }

                            {isLoadingPosition &&
                                <i className="fi fi-tr-loading text-[30px] text-white leading-[0] origin-center animate-rotation"></i>
                            }
                        </div>

                        <button className="bg-darkBlue text-white p-1 px-3 font-navbar outline-none rounded-sm" onClick={()=>setIsOpenUserSettings(!isOpenUserSettings)}>
                            <i className="fi fi-sr-settings text-xs leading-0"></i>&ensp;{isOpenUserSettings?"Close Settings":"Settings"}
                        </button>
                    </div>

                </div>

                <Notice ref={noticeRef}/>
            </Container>
        )
    }
}

export default Profile;