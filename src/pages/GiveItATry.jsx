import { useEffect, useRef, useState } from "react";
import Container from "../components/Container"
import Navbar from "../components/Navbar"
import Loading from "../components/Loading";
import { getGiveItATryInfo, getUserGiveItATryInfo, initializeGiveItATry } from "../firebase";
import Notice from "../components/Notice";
import { useNavigate } from "react-router-dom";
import { skills } from "../assets/data";
import { prettyPrintDate, prettyPrintParameter, skillParametersJoinPrint } from "../utility";

const GiveItATry=(props)=>{
    const [loading,setLoading]=useState(true);
    const [giveItAtry,setGiveItATry]=useState({});
    const [userData,setUserData]=useState({});
    const [isPlayScreen,setIsPlayScreen]=useState(false);
    const [selectedRankingType,setSelectedRankingType]=useState(0);
    const noticeRef=useRef();
    const navigate=useNavigate();

    useEffect(()=>{
        const fetchData=async()=>{
            //get give it a try informations
            var [resp,data] = await getGiveItATryInfo();

            if(resp){
                data.skillIndex = skills.findIndex(s=>s.title==data.skill);
                data.skillParametersIndex = skills[data.skillIndex].skillParametersPossibleValues.findIndex(p=>skillParametersJoinPrint(p)==data.skillParameters);

                //order results in the challenge and season ranking
                data.top100Attempts.sort((a,b)=>a.value-b.value);
                data.top100SeasonPoints.sort((a,b)=>b.value-a.value);

                //get user tentative and season points
                const [respUser,dataUser]=await getUserGiveItATryInfo(props.user.uid);
                
                if(respUser){
                    setUserData(dataUser);
                    setGiveItATry(data);
                    setLoading(false);
                }else{
                    navigate("/error",{state:{message:"Error in fetching the data"}});
                }
            }else{
                navigate("/error",{state:{message:"Error in fetching the data"}});
            }
        }

        fetchData();
    },[]);

    const checkPlay=()=>{
        //if the user has not attempted this challenge
        if(userData.tentative==0){
            setIsPlayScreen(true);
        }else{
            setLoading(false);
            noticeRef.current.triggerNotice(mex);
        }
    }

    if(isPlayScreen){
        return <Play 
            user={props.user}
            skill={giveItAtry.skillIndex}
            parameters={giveItAtry.skillParametersIndex}
            giveItAtry={true}
        />;
    }
    if(loading){
        return <Loading/>;
    }else{
        return(
            <Container bg="bg-resultsBg" overflowHidden={true}>
                <Navbar isLogged={props.isSignedIn} user={props.user}/>

                <div className="w-full flex flex-row">
                    <div className="relative w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 220" preserveAspectRatio="none" className="h-[100px] w-full">
                            <path fill="rgba(147, 197, 253,0.13)" fillOpacity="1" d="M0,192L48,192C96,192,192,192,288,192C384,192,480,192,576,197.3C672,203,768,213,864,186.7C960,160,1056,96,1152,85.3C1248,75,1344,117,1392,138.7L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                        </svg>

                        <div className="absolute top-6 left-5 text-white text-2xl font-default animate-fadeLeft">GIVE IT A TRY!</div>
                    </div>
                </div>

                <div className="w-full !flex-1 flex flex-row gap-5">
                    <div className="relative basis-[65%] h-full flex flex-col p-4">
                        <div className="w-[80%] py-3 px-3 text-2xl bg-white bg-opacity-[0.12] rounded-md">{giveItAtry.skill}
                            <span className="font-navbar text-base ml-3">
                                {"("}{giveItAtry.skillParameters.split("-").map((param,index)=>{
                                    const isLastIndex=(index==skills[giveItAtry.skillIndex].skillParameters.length-1);
                                    return <>
                                        <span className="text-xs text-white text-opacity-70">{prettyPrintParameter(skills[giveItAtry.skillIndex].skillParametersLongName[index])}</span>
                                        <span className="text-base text-white text-opacity-100">{": "+param+((!isLastIndex)?" / ":"")}</span>
                                    </>
                                    })}{")"}
                            </span></div>
                        <div className="w-max ml-5 py-2 px-3 pr-10 text-white text-sm text-opacity-75 bg-white bg-opacity-[0.09] rounded-b-lg font-navbar">{"Ends in date: "}<span className="text-base ml-2 text-white text-opacity-100">{prettyPrintDate(giveItAtry.expirationDate.toDate())}</span></div>

                        <div className="ml-5 mt-5 w-[75%] p-5 border-l-2 border-white text-white text-base text-wrap font-navbar">
                            {skills[giveItAtry.skillIndex].description}<br/><br/>{skills[giveItAtry.skillIndex].playInstructions}
                        </div>

                        <button className="bg-whiteOverDarkBlue rounded-sm mt-5 text-lg text-white py-1 w-[150px] self-center shadow-[0px_0px_12px_3px_rgba(255,255,255,0.2)] transition-all duration-300 hover:scale-110 hover:bg-white hover:bg-opacity-30" onClick={()=>checkPlay()}>PLAY</button>

                        <i className={skills[giveItAtry.skillIndex].icon+" text-[300px] text-white text-opacity-[0.07] absolute z-0 right-6 bottom-[-150px]"}></i>
                    </div>
                    
                    <div className="w-[2px] h-[70%] self-center bg-white bg-opacity-30"></div>

                    <div className="flex-1 h-full flex flex-col items-center gap-3">
                        <div className="relative w-max flex flex-row items-center gap-5 bg-tooltipColor rounded-md p-1 px-3">
                            <div className="text-white font-default text-[16px] w-[150px] text-center z-[2] cursor-pointer" onClick={()=>setSelectedRankingType(0)}>SEASON</div>
                            <div className="text-white font-default text-[16px] w-[150px] text-center z-[2] cursor-pointer" onClick={()=>setSelectedRankingType(1)}>CHALLENGE</div>

                            <div className={"absolute top-[50%] translate-y-[-50%] left-3 h-[70%] bg-mainBlue bg-opacity-40 w-[150px] rounded-md transition-all duration-500 "+((selectedRankingType==0)?"left-3":"left-[182px]")}></div>
                        </div>

                        <div className="flex-1 w-full flex flex-row justify-center gap-6 p-3">
                            
                            <div className="relative h-full w-[2px] overflow-hidden">
                                <div className="absolute w-[2px] bg-white bg-opacity-30 h-6 verticalLine-box-shadow animate-verticalLine"></div>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <div className="h-[80%] flex flex-col items-center gap-1 overflow-y-auto px-2">
                                    {selectedRankingType==0 && giveItAtry.top100SeasonPoints.map((user,index)=>{
                                        return <div className="flex flex-row justify-start items-center gap-3 py-1">
                                            <div className={"w-min text-white text-[12px] h-[18px] leading-[18px] text-center rounded-sm px-[5px] "+
                                            (((index+1)>3)?"bg-white bg-opacity-30":(((index+1)==3)?"bg-yellow-gold bg-opacity-30":((index+1)==2)?"bg-gray-500 bg-opacity-60":"bg-yellow-gold bg-opacity-65"))}>{index+1}</div>
                                            <div className="w-[125px] line-clamp-1 text-ellipsis text-nowrap text-start text-white font-default text-sm" title={user.username}>{user.username}</div>
                                            <div className={"w-[50px] text-end text-white font-navbar text-sm "+(index==0?"text-opacity-100":"text-opacity-75")}>{user.value}</div>
                                        </div>
                                    })}

                                    {selectedRankingType==1 && giveItAtry.top100Attempts.map((attempt,index)=>{
                                        const metric = skills[giveItAtry.skillIndex].skillResultsParametersMetrics[skills[giveItAtry.skillIndex].skillResultsParameters.indexOf(skills[giveItAtry.skillIndex].skillPerformanceParameter)]
                                        return <div className="flex flex-row justify-start items-center gap-3 py-1">
                                            <div className={"w-min text-white text-[12px] h-[18px] leading-[18px] text-center rounded-sm px-[5px] "+
                                            (((index+1)>3)?"bg-white bg-opacity-30":(((index+1)==3)?"bg-yellow-gold bg-opacity-30":((index+1)==2)?"bg-gray-500 bg-opacity-60":"bg-yellow-gold bg-opacity-65"))}>{index+1}</div>
                                            <div className="w-[125px] line-clamp-1 text-ellipsis text-nowrap text-start text-white font-default text-sm" title={attempt.username}>{attempt.username}</div>
                                            <div className={"w-[50px] text-end text-white font-navbar text-sm "+(index==0?"text-opacity-100":"text-opacity-75")}>
                                                {index==0?
                                                attempt.value.toFixed(3)+metric:
                                                "+"+(attempt.value-giveItAtry.top100Attempts[0].value).toFixed(3)}
                                            </div>
                                        </div>
                                    })}

                                    {selectedRankingType==0 && giveItAtry.top100SeasonPoints.length==0 && <div className="text-white text-opacity-75 font-default text-lg">NO PLAYERS PLAYED</div>}
                                    {selectedRankingType==1 && giveItAtry.top100Attempts.length==0 && <div className="text-white text-opacity-75 font-default text-lg">NO PLAYERS PLAYED</div>}
                                </div>

                                {/* show user data in the ranking if not present in the top 100 */}
                                {selectedRankingType==0 && giveItAtry.top100SeasonPoints.filter(p=>p.username.toLowerCase()==userData.username.toLowerCase()).length==0 && <>
                                    <div className="w-full h-[2px] bg-white bg-opacity-70"></div>
                                    <div className="flex flex-row justify-start items-center gap-3 py-1">
                                        <div className="w-[18px] h-[18px] rounded-sm bg-white bg-opacity-30"></div>
                                        <div className="w-[125px] line-clamp-1 text-ellipsis text-nowrap text-start text-white font-default text-sm" title={userData.username}>{userData.username}</div>
                                        <div className="w-[50px] text-end text-white font-navbar text-sm text-opacity-75">
                                            {userData.seasonPoints}
                                        </div>
                                    </div></>
                                }
                                {selectedRankingType==1 && giveItAtry.top100Attempts.filter(p=>p.username.toLowerCase()==userData.username.toLowerCase()).length==0 && <>
                                    <div className="w-full h-[2px] bg-white bg-opacity-70"></div>
                                    <div className="flex flex-row justify-start items-center gap-3 py-1">
                                        <div className="w-[18px] h-[18px] rounded-sm bg-white bg-opacity-30"></div>
                                        <div className="w-[125px] line-clamp-1 text-ellipsis text-nowrap text-start text-white font-default text-sm" title={userData.username}>{userData.username}</div>
                                        <div className="w-[50px] text-end text-white font-navbar text-sm text-opacity-75">
                                            {userData.tentative==0?"None":"+"+(userData.tentative-giveItAtry.top100Attempts[0].value).toFixed(3)}
                                        </div>
                                    </div></>
                                }
                            </div>

                            <div className="relative h-full w-[2px] overflow-hidden">
                                <div className="absolute w-[2px] bg-white bg-opacity-30 h-6 verticalLine-box-shadow animate-verticalLine"></div>
                            </div>
                        </div>

                    </div>
                </div>

                <Notice ref={noticeRef}/>
    
            </Container>
        );
    }
}

export default GiveItATry;