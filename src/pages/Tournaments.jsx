import { useEffect, useRef, useState } from "react";
import Container from "../components/Container";
import { getAllOpenTournaments, subscribeToTournament } from "../firebase";
import Navbar from "../components/Navbar";
import { skills } from "../assets/data";

const Tournaments=(props)=>{
    const [isLoading,setIsLoading]=useState(true);
    const [subscribeLoading,setSubscribeLoading]=useState(false);
    const [selectedSkill,setSelectedSkill]=useState(0);
    const [tournaments,setTournaments]=useState({});
    const firstTournamentSubscribeButtonRef=useRef();

    useEffect(()=>{
        const fetchTournaments=async()=>{
            await findTournaments();
        }

        fetchTournaments();
    })

    const changeSelectedSkill=(skillNew)=>{
        setIsLoading(true);
        setSelectedSkill(skillNew);
        setTimeout(()=>setIsLoading(false),2000)
    }

    const findTournaments=async()=>{
        setIsLoading(true);

        const tournamentCopy={...tournaments};

        if(tournamentCopy[selectedSkill]==undefined){
            const [resp,tournamentsList]=await getAllOpenTournaments(selectedSkill);
        
            if(resp){
                tournamentCopy[selectedSkill]=tournamentsList;
                setTournaments(tournamentCopy);
            }else{
                console.log(tournamentsList);
            }
        }

        setIsLoading(false);
    }

    const subscribeTournament=async(tournamentIndex)=>{
        setSubscribeLoading(true);
        const [resp,message]=await subscribeToTournament(tournaments[selectedSkill][tournamentIndex].id);

        firstTournamentSubscribeButtonRef.current.innerHTML=message;
        firstTournamentSubscribeButtonRef.current.disabled=true;

        setSubscribeLoading(false);
    }

    const moreDetails=(tournamentIndex)=>{

    }

    return(
        <Container bg="bg-resultsBg" overflowHidden={true}>
            <Navbar isLogged={props.isSignedIn} user={props.user}/>

            <div className="text-white text-2xl mt-3">TOURNAMENTS</div>

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

                {tournaments[selectedSkill].length>0 && 
                <div className="relative self-start ml-10 flex flex-row gap-7 py-4 pl-4 pr-[50px] rounded-md bg-white bg-opacity-20 font-navbar overflow-hidden z-[2]">
                    <div className="flex flex-col gap-2">
                        <div className="text-white text-2xl leading-[24px] font-default">{tournaments[selectedSkill][0].name.toUpperCase()}</div>
                        <div className="max-w-[250px] text-white text-sm line-clamp-2">{tournaments[selectedSkill][0].description}</div>
                        
                        {tournaments[selectedSkill][0].status=="open" && <>
                        <div className="text-white text-base flex flex-row gap-3 items-center" title="Available places"> 
                            <i className="fi fi-sr-users leading-[0]"></i>
                            {tournaments[selectedSkill][0].numMaxUsers-tournaments[selectedSkill][0].subscribedUsers.length}
                        </div>
                        
                        {tournaments[selectedSkill][0].requirements.length==0 && <div className="text-white text-xs">Free Entry</div>}

                        </>}

                        <button className={"bg-white bg-opacity-30 mt-4 rounded-md text-base text-white py-1 text-center w-[150px] "+(tournaments[selectedSkill][0].matchesAllrequirements?"":"opacity-50")} 
                            disabled={!tournaments[selectedSkill][0].matchesAllrequirements || (tournaments[selectedSkill][0].subscribedUsers.find(u=>u==props.user.uid)!=undefined)} 
                            onClick={()=>tournaments[selectedSkill][0].status=="open"?subscribeTournament(0):moreDetails(0)}
                            title={tournaments[selectedSkill][0].matchesAllrequirements?"":"Not all requirements are matched"}
                            ref={firstTournamentSubscribeButtonRef}
                        >
                            <div className="flex justify-center items-center">
                            {!subscribeLoading?(tournaments[selectedSkill][0].status=="open"?
                                (tournaments[selectedSkill][0].subscribedUsers.find(u=>u==props.user.uid)==undefined?"Subscribe":"Already subcribed")
                                :"More Details"
                            ):""}

                            {subscribeLoading && <i className="fi fi-tr-loading text-white leading-[0] origin-center animate-rotation my-1"></i>}
                            </div>
                        </button>
                    </div>

                    {tournaments[selectedSkill][0].requirements.length!=0 && 
                    <div className="flex flex-col gap-2 border-l-2 border-white border-opacity-60 pl-4 py-2">
                        {tournaments[selectedSkill][0].requirements.map((req)=>{
                            return(
                                <div className="flex flex-row items-center gap-3">
                                    <div className="text-[20px] leading-[0]">
                                        {req.matched?<i class="fi fi-ss-check-circle text-mainGreen"></i>:<i class="fi fi-sr-cross-circle text-mainRed"></i>}    
                                    </div>
                                    <div className="text-white text-sm max-w-[200px] line-clamp-1">{req.description}</div>
                                </div>
                            )
                        })}
                    </div>}
                    
                    
                    <div className={"absolute top-0 right-0 h-full w-[30px] bg-opacity-60 flex items-center justify-center "+(tournaments[selectedSkill][0].status=="open"?"bg-mainGreen":"bg-yellow-gold")}>
                        <div className="text-white text-[18px] font-default font-thin origin-center rotate-[270deg]">{tournaments[selectedSkill][0].status.toUpperCase()}</div>
                    </div>
                </div>}

                {tournaments[selectedSkill].length==0 && <div className="text-white text-xl text-opacity-70">NO TOURNAMENTS FOUND</div>}
            
                <i className={"absolute text-[180px] leading-[0] text-white text-opacity-15 bottom-7 right-10 animate-fadeUp "+skills[selectedSkill].icon}/>
                </>}
            </div>
        </Container>
    )
};

export default Tournaments;