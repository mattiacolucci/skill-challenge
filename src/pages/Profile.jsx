import { cloneElement, useEffect, useRef, useState } from "react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import { useCountries } from "use-react-countries";
import { getAllUserGames, getUserData, signOutWithGoogle, updateUserCountry, updateUserUsername } from "../firebase";
import UserLevel from "../components/UserLevel";
import Notice from "../components/Notice";
import { useNavigate } from "react-router-dom";
import { Option, Select } from "@material-tailwind/react";
import { lineChartColors, skills } from "../assets/data";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { prettyPrintDate, prettyPrintParameter, TooltipChartCustom } from "../utility.jsx";

const Profile=(props)=>{
    const [isLoading,setIsLoading]=useState(true);
    const [userData,setUserdata]=useState({});

    //edit country
    const [showCountryChange,setShowCountryChange]=useState(false);
    const [newCountry,setNewCountry]=useState("");

    //edit username
    const [showEditUsername,setShowEditUsername]=useState(false);
    const [newUsername,setNewUsername]=useState("");

    //last games
    const [lastGamesSelectedSkill,setLastGameSelectedSkill]=useState(0);
    const [lastGamesSelectedParameters,setLastGamesSelectedParameters]=useState(0);
    const [filteredGamesData,setFilteredGamesData]=useState({});

    const noticeRef=useRef();
    const navigate=useNavigate();
    const {countries}=useCountries();
    countries.sort(function(a, b) {
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

                    //filter last games based on selected parameters
                    filterGames(games);
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
        }

        setShowEditUsername(false);
    }

    const filterGames=(games)=>{
        var filteredGames=[];

        //get all games which has selected parameters and selected skill
        for(var i=0;i<games.length;i++){
            var addGame=true;

            //if the game is relative to the non selected skill, do not add it to filtered games
            if(games[i].skill!=skills[lastGamesSelectedSkill].title){
                addGame=false;
                continue;
            }

            //for each skill parameter
            for(var j=0;j<skills[lastGamesSelectedSkill].skillParameters;j++){
                //if the skill parameter of the gameis different from the selected one, do not add it to the filtered games
                if(games[i][skills[lastGamesSelectedSkill].skillParameters[j]]!=lastGamesSelectedParameters[j]){
                    addGame=false;
                    continue;
                }
            }

            if(addGame){
                filteredGames.push(games[i]);
            }
        }

        setFilteredGamesData(filteredGames);
    }

    //recalulate filtered games every time the skill selected changes
    useEffect(()=>{
        if(Object.keys(userData).length!=0 && userData.games!=undefined){
            //recalulate filteredGames
            filterGames(userData.games);
        }
    },[lastGamesSelectedSkill])

    const goNextSelectedSkill=()=>{
        setLastGameSelectedSkill((lastGamesSelectedSkill+1)%skills.length);
    }

    const goPreviousSelectedSkill=()=>{
        setLastGameSelectedSkill((lastGamesSelectedSkill-1)%skills.length);
    }

    if(isLoading){
        return <Loading/>
    }else{
        return(
            <Container bg="bg-resultsBg" overflowHidden={true}>
                <Navbar isLogged={props.isSignedIn} user={props.user}/>
                
                <div className="w-screen flex flex-row mt-5">
                    <div className="basis-[33%] flex flex-col items-center gap-4">
                        <img src={userData.profileImage} className="w-[80px] h-[80px] rounded-full border-2 border-blueOverBg"/>
                        <div className="text-white font-default text-2xl w-full line-clamp-1 text-center">{userData.username.toUpperCase()}</div>

                        {showEditUsername && <input type="text" className="w-[50%] p-1 pl-3 rounded-sm outline-none bg-white bg-opacity-30 font-navbar" value={newUsername} onChange={(e)=>setNewUsername(e.target.value)}/>}

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
                            <img src={countries.filter(c=>c.name==userData.country)[0].flags.svg} className="h-[30px] w-[30px] rounded-full object-cover border-2 border-mainBlue"/>
                            <div className="text-white text-sm font-navbar">{userData.country.toUpperCase()}</div>
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
                            {countries.map(({ name, flags }) => (
                            <Option key={name} value={name} className="flex items-center gap-2">
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
                        username={userData.name}/>

                        <div className="text-white font-default text-2xl mt-7">RECORDS</div>

                        <div className="h-[150px] px-2 w-[200px] flex flex-col gap-2 items-center overflow-auto pb-3 shadow-[5px_5px_10px_-1px_rgba(29,78,216,0.4)]">
                            {Object.keys(userData.records).map((skill)=>{
                                return(<>
                                    <div className="w-full flex flex-row items-center gap-2 sticky top-0 bg-resultsBg">
                                        <div className="text-white text-opacity-50 font-default self-start text-sm">{skill}</div>
                                        <div className="flex-1 h-[2px] bg-white bg-opacity-40"></div>
                                    </div>
                                        {userData.records[skill].map((record,index)=>{
                                            const recordParameterNameWithSpaces=prettyPrintParameter(record.recordParameter);

                                            return (
                                            <div className="flex flex-row items-center gap-2" key={"record"+index} title={skill+" "+record.recordType+" in "+recordParameterNameWithSpaces}>
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
                        <div className="text-white text-2xl font-default">LAST GAMES</div>

                        <div className="w-full flex flex-col items-center gap-1">
                            <div className="w-full flex flex-row items-center justify-center gap-1">
                                <div className="cursor-pointer text-xl" onClick={()=>goPreviousSelectedSkill()}>⮘</div>
                                <div className="w-[200px] text-center text-white font-navbar">{skills[lastGamesSelectedSkill].title}</div>
                                <div className="cursor-pointer text-xl" onClick={()=>goNextSelectedSkill()}>⮚</div>
                            </div>

                            <div className="w-full flex flex-row items-center justify-center gap-1">
                                <div className="cursor-pointer text-xl">⮘</div>
                                <div className="w-[200px] text-center text-white font-navbar">
                                    <span className="text-[13px] text-white text-opacity-65">{skills[lastGamesSelectedSkill].skillParameters.join("  -  ")}</span><br/>
                                    {skills[lastGamesSelectedSkill].skillParametersPossibleValues[lastGamesSelectedParameters].join("  -  ")}</div>
                                <div className="cursor-pointer text-xl">⮚</div>
                            </div>
                            
                            <div className="mt-5">
                                {filteredGamesData.length!=0 && <LineChart width={300} height={160} data={filteredGamesData} margin={{bottom:10,right:10}} style={{alignSelf:"center"}}>
                                    <CartesianGrid strokeDasharray="2" strokeOpacity={0.3}/>
                                    <XAxis minTickGap={10} dataKey="date" type="category" interval={"equidistantPreserveStartEnd"} label={{ value: 'Date', angle: 0, position: 'insideBottomRight', offset:7, fontSize:"12px"}} style={{ fontSize: '12px'}}/>
                                    <YAxis minTickGap={8} domain={[0, 'dataMax + 0.5']} type={"number"} interval={"equidistantPreserveStartEnd"} label={{ value: 'Value', angle: -90, fontSize:"11px", position:'insideBottom', offset:35}} style={{ fontSize: '12px'}}/>
                                    <Tooltip cursor={{stroke: "#BABABA",strokeWidth: 1,strokeDasharray: "5 5"}} wrapperStyle={{ outline: "none" }} content={TooltipChartCustom} />
                                    <Legend iconSize={10} formatter={(value, entry, index) => <span className="text-xs font-navbar opacity-75">{prettyPrintParameter(value)}</span>}/>
                                    {skills[lastGamesSelectedSkill].skillResultsParameters.map((param,index)=>{
                                        return <Line type="monotone" dataKey={param} stroke={lineChartColors[index]} strokeWidth={1.5}/>
                                    })}
                                </LineChart>}
                            </div>
                        </div>

                    </div>


                    <div className="basis-[33%] flex flex-col items-center gap-4">
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
                    </div>

                </div>

                <Notice ref={noticeRef}/>
            </Container>
        )
    }
}

export default Profile;