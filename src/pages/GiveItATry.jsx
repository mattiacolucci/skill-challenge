import { useEffect, useRef, useState } from "react";
import Container from "../components/Container"
import Navbar from "../components/Navbar"
import Loading from "../components/Loading";
import { getGiveItATryInfo, initializeGiveItATry } from "../firebase";
import Notice from "../components/Notice";
import { useNavigate } from "react-router-dom";
import { skills } from "../assets/data";
import { prettyPrintDate, prettyPrintParameter, skillParametersJoinPrint } from "../utility";

const GiveItATry=(props)=>{
    const [loading,setLoading]=useState(true);
    const [giveItAtry,setGiveItATry]=useState({});
    const [selectedRankingType,setSelectedRankingType]=useState(0);
    const noticeRef=useRef();
    const navigate=useNavigate();

    useEffect(()=>{
        const fetchData=async()=>{
            var [resp,data] = await getGiveItATryInfo();
            if(resp){
                const skillIndex = skills.findIndex(s=>s.title==data.skill);

                //order results in the challenge and season ranking
                data.top100Attempts.sort((a,b)=>a.value-b.value);
                data.top100SeasonPoints.sort((a,b)=>b.value-a.value);

                setGiveItATry({...data,skillIndex:skillIndex});
                setLoading(false);
            }else{
                noticeRef.current.triggerNotice("Failed in read data",()=>navigate("/"));
            }
        }

        fetchData();
    },[]);

    if(loading){
        return <Loading/>;
    }else{
        return(
            <Container bg="bg-resultsBg" overflowHidden={true}>
                <Navbar isLogged={props.isSignedIn} user={props.user}/>

                <div className="w-full h-full flex flex-row flex-wrap">
                    <div className="relative w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 220" preserveAspectRatio="none" className="h-[100px] w-full">
                            <path fill="rgba(147, 197, 253,0.13)" fillOpacity="1" d="M0,192L48,192C96,192,192,192,288,192C384,192,480,192,576,197.3C672,203,768,213,864,186.7C960,160,1056,96,1152,85.3C1248,75,1344,117,1392,138.7L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                        </svg>

                        <div className="absolute top-6 left-5 text-white text-2xl font-default animate-fadeLeft">GIVE IT A TRY!</div>
                    </div>
                    <div className="relative basis-[70%] h-full border-r-2 border-white flex flex-col p-4">
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

                        <i className={skills[giveItAtry.skillIndex].icon+" text-[300px] text-white text-opacity-10 absolute z-0 right-6 bottom-4"}></i>
                    </div>

                    <div className="basis-[30%] h-full flex flex-col items-center gap-3">
                        <div className="relative w-max flex flex-row items-center gap-5 bg-tooltipColor rounded-md p-1 px-3">
                            <div className="text-white font-default text-[16px] w-[150px] text-center z-[2] cursor-pointer" onClick={()=>setSelectedRankingType(0)}>SEASON</div>
                            <div className="text-white font-default text-[16px] w-[150px] text-center z-[2] cursor-pointer" onClick={()=>setSelectedRankingType(1)}>CHALLENGE</div>

                            <div className={"absolute top-[50%] translate-y-[-50%] left-3 h-[70%] bg-mainBlue bg-opacity-40 w-[150px] rounded-md transition-all duration-500 "+((selectedRankingType==0)?"left-3":"left-[182px]")}></div>
                        </div>

                        <div className="h-[65vh] flex flex-col items-center rounded-md gap-1 p-3 overflow-y-auto">
                            {selectedRankingType==0 && giveItAtry.top100SeasonPoints.map((user,index)=>{
                                return <div className="flex flex-row justify-start items-center gap-3 py-1">
                                    <div className={"w-min text-white text-[12px] h-[18px] leading-[18px] text-center rounded-sm px-[5px] "+
                                    (((index+1)>3)?"bg-white bg-opacity-30":(((index+1)==3)?"bg-yellow-gold bg-opacity-30":((index+1)==2)?"bg-gray-500 bg-opacity-60":"bg-yellow-gold bg-opacity-65"))}>{index+1}</div>
                                    <div className="w-[125px] line-clamp-1 text-ellipsis text-nowrap text-start text-white font-default text-sm" title={user.username}>{user.username}</div>
                                    <div className={"text-end text-white font-navbar text-sm "+(index==0?"text-opacity-100":"text-opacity-75")}>{user.value}</div>
                                </div>
                            })}

                            {selectedRankingType==1 && giveItAtry.top100Attempts.map((attempt,index)=>{
                                const metric = skills[giveItAtry.skillIndex].skillResultsParametersMetrics[skills[giveItAtry.skillIndex].skillResultsParameters.indexOf(skills[giveItAtry.skillIndex].skillPerformanceParameter)]
                                return <div className="flex flex-row justify-start items-center gap-3 py-1">
                                    <div className={"w-min text-white text-[12px] h-[18px] leading-[18px] text-center rounded-sm px-[5px] "+
                                    (((index+1)>3)?"bg-white bg-opacity-30":(((index+1)==3)?"bg-yellow-gold bg-opacity-30":((index+1)==2)?"bg-gray-500 bg-opacity-60":"bg-yellow-gold bg-opacity-65"))}>{index+1}</div>
                                    <div className="w-[125px] line-clamp-1 text-ellipsis text-nowrap text-start text-white font-default text-sm" title={attempt.username}>{attempt.username}</div>
                                    <div className={"text-end text-white font-navbar text-sm "+(index==0?"text-opacity-100":"text-opacity-75")}>
                                        {index==0?
                                        attempt.value.toFixed(3)+metric:
                                        "+"+(attempt.value-giveItAtry.top100Attempts[0].value).toFixed(3)}
                                    </div>
                                </div>
                            })}

                            {selectedRankingType==0 && giveItAtry.top100SeasonPoints.length==0 && <div className="text-white text-opacity-75 font-default text-lg">NO PLAYERS PLAYED</div>}
                            {selectedRankingType==1 && giveItAtry.top100Attempts.length==0 && <div className="text-white text-opacity-75 font-default text-lg">NO PLAYERS PLAYED</div>}
                        </div>

                    </div>
                </div>

                <Notice ref={noticeRef}/>
    
            </Container>
        );
    }
}

export default GiveItATry;