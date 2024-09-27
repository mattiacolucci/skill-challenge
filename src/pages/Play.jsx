import { useEffect, useRef, useState } from "react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";
import { skills } from "../assets/data";
import FastTyping from "../components/skills/FastTyping";
import { getSkillLeaderboard, getUserData, getUserPersonalBest } from "../firebase";
import Loading from "../components/Loading";


const Play=(props)=>{
    const playScreenRef=useRef();
    const playCountDownRef=useRef();
    const [selectionState,setSelectionState]=useState(0);
    const [selectedSkill,setSelectedSkill]=useState((props.skill==undefined)?-1:props.skill);  //-1 if not passed a specific value
    const [skillsParameters,setSkillsParameters]=useState((props.parameters==undefined)?0:props.parameters);  //0 if not passed a specific value
    const [userData,setUserData]=useState({});  //state which contains user profile data and record done in the selected skill
    const [records,setRecords]=useState({});  //state which contains all NR and WR records of the selected skill
    const [isLoading,setIsLoading]=useState(false);
    const [tournamentChecked,setTournamentChecked]=useState(false);

    //check if this play session is for a tournament duel
    //check is done just after the playCountDownRef is ready to be used
    useEffect(()=>{
        const checkIfTournament=async()=>{
            if(props.tournament!=undefined){
                //if this is a tournament duel, start the game directly
                setTournamentChecked(true);
                await goPlayScreen();
            }
        }

        if(!tournamentChecked){
            checkIfTournament();
        }
    },[playCountDownRef.current])

    const continueState=()=>{
        setSelectionState(selectionState+1);
    }

    const backState=()=>{
        setSelectionState(selectionState-1);
    }

    const selectSkill=(value)=>{
        //update selected skill
        setSelectedSkill(value);
    }

    /*const updateParameter=(index,min,max,value)=>{
        //copy paramets array
        var parametersCopy=[...skillsParameters];

        //do not update value if it is not between min and max
        if(value<min && value!=""){
            parametersCopy[index]=min;
        }else if(value>max){
            parametersCopy[index]=max;
        }else{  //update value otherwise
            parametersCopy[index]=parseFloat(value);
        }
        //update state
        setSkillsParameters(parametersCopy);
    }*/

    //function which fetch user data and records for the selected skill and scroll down the page on the play screen
    const goPlayScreen=async ()=>{
        setIsLoading(true);

        //fetch user data
        const [response,data]=await getUserData(props.user.uid);

        if(response){
            setUserData({...props.user,...data});

            //fetch skill leaderboard
            const [resp,skillRecords] = await getSkillLeaderboard(selectedSkill,skillsParameters,data.country,1);

            if(resp){
                skillRecords.PB={};
                //fetch user personal bests
                for(const param in skills[selectedSkill].skillResultsParameters){
                    const resultParameter=skills[selectedSkill].skillResultsParameters[param];
                    const [res,personalBest]=await getUserPersonalBest(props.user.uid,selectedSkill,skillsParameters,resultParameter);
                    if(res){
                        skillRecords.PB[resultParameter]=personalBest;
                    }else{
                        navigate("/error",{state:{message:personalBest}});
                        return;
                    }
                }

                console.log(skillRecords)
                setRecords(skillRecords);
            }else{
                navigate("/error",{state:{message:skillRecords}});
                return;
            }

        }else{
            navigate("/error",{state:{message:data}});
            return;
        }

        //set selection state to 3, so the "3,2,1,go" is displayed
        setSelectionState(3);

        //go to the play screen of the page
        playScreenRef.current.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});

        //make appear the "3,2,1,go" with a settimeout
        setTimeout(()=>playCountDownRef.current.innerHTML=3,2000);
        setTimeout(()=>playCountDownRef.current.innerHTML=2,3000);
        setTimeout(()=>playCountDownRef.current.innerHTML=1,4000);
        setTimeout(()=>playCountDownRef.current.innerHTML="GO!",5000);

        //set selection 4 so the game skill is displayed
        setTimeout(()=>{setSelectionState(4)},5500);

        setIsLoading(false);
    }
    
    return(
        <Container overflowHidden={true}>
            <Navbar isLogged={props.isSignedIn} user={props.user}/>
            <div className="w-[90vw] h-[90vh] mt-[2vh] border-l-2 border-white border-opacity-70 flex flex-col items-center pl-7 pb-3">
                <div className={"w-full flex flex-col px-6 py-3 border-b-2 border-white border-opacity-70 shadow-none gap-4 transition-all duration-500 "+((selectionState==0)?"flex-1":"h-min")}>
                    <div className={"text-white "+((selectionState==0)?"text-2xl":"text-lg")}>SELECT SKILLS</div>
                    {selectionState==0 &&<>
                        <div className="text-sm font-navbar font-medium">Select the skill which you want to play</div>
                        <div className="w-full flex-1 flex flex-row overflow-hidden">
                            <div className={"flex gap-4 items-center pl-3 overflow-x-auto overflow-y-hidden "
                            +((selectedSkill!=-1)?"w-[75%]":"w-[100%]")}>   {/*if none skill has been selected width is 100%, else 75%*/}
                                {skills.map((skill,index)=>{
                                    return(
                                        <div className="relative glass-effect w-[150px] h-[150px] rounded-lg flex flex-none flex-col items-center gap-3 pt-3 cursor-pointer transition-all duration-300 overflow-hidden hover:scale-110"
                                        onClick={()=>selectSkill(index)}
                                        key={"skill "+index}>
                                            <div className="text-base line-clamp-1">{skill.title}</div>
                                            <i className={skill.icon+" text-6xl text-white text-opacity-80"}></i>
                                            <div className={"absolute bottom-0 z-2 w-full bg-blue-700 leading-[30px] text-center transition-all duration-300 "+((selectedSkill==index)?"h-[30px]":"h-0")}>SELECTED</div>
                                        </div>
                                    )
                                })}
                            </div>
                            {//if a skill has been selected, display its description
                            selectedSkill!=-1 && <div className={"flex flex-col items-center p-3 px-5 gap-2 border-l-2 border-white border-opacity-50 "+((selectedSkill!=-1)?"flex-1":"w-0")}>
                                <div className="text-large">SKILL DESCRIPTION</div>
                                <div className="text-base text-justify font-navbar font-medium line-clamp-[6]" title={skills[selectedSkill].description}>{skills[selectedSkill].description}</div>
                            </div>}
                            
                        </div>

                        {//if a skill has been selected, display the continue button
                        selectedSkill!=-1 && <button className="text-base px-3 py-2 bg-blue-700 self-end rounded-sm mt-auto" onClick={continueState}>CONTINUE ➣</button>}
                    </>}
                </div>

                <div className={"w-full flex flex-col px-6 py-3 border-b-2 border-white border-opacity-70 shadow-none overflow-hidden gap-4 transition-all duration-500 "+((selectionState==1)?"flex-1":"h-min")}>
                    <div className={"text-white "+((selectionState==1)?"text-2xl":"text-lg")}>SELECT PARAMETERS</div>
                    {selectionState==1 &&  //if the skill has been selected, display skills parameters selection
                    <>
                        <div className="text-sm font-navbar font-medium">
                            {skills[selectedSkill].parametersDescription}
                        </div>

                        <div className="w-full flex flex-row gap-4 flex-wrap">
                            {skills[selectedSkill].skillParametersPossibleValues.map((skillParams,paramsIndex)=>{
                                return(
                                    <div className="flex flex-col items-center" key={"param"+paramsIndex}>
                                        <div className={"flex flex-row items-center gap-3 p-2 px-3 glass-effect rounded-md cursor-pointer "+(skillsParameters==paramsIndex?"border-2 border-mainBlue":"")} onClick={()=>setSkillsParameters(paramsIndex)}>
                                            {skillParams.map((p,index)=>{
                                                return(<>
                                                    <div className="flex flex-col gap-2 items-center">
                                                        <div className="text-white text-xs font-navbar">{skills[selectedSkill].skillParametersLongName[index]}</div>
                                                        <div className="text-white text-xl font-default">{p}</div>
                                                    </div>
                                                    {index<(skillParams.length-1) && <div className="bg-white bg-opacity-50 w-[2px] h-[80%]"></div>}
                                                    </>
                                                )
                                            })}    
                                        </div>
                                        <div className={"px-2 text-white bg-blue-700 rounded-br-md rounded-bl-md transition-all duration-300 overflow-hidden "+(skillsParameters==paramsIndex?"h-[30px] leading-[30px]":"h-0")}>SELECTED</div> 
                                    </div>
                                    
                                )
                            })}
                        </div>
                
                        <div className="w-full flex mt-auto">
                            <button className="text-base px-3 py-2 bg-blue-700 self-end rounded-sm" onClick={backState}>⮘ BACK</button>
                            <button className="text-base px-3 py-2 bg-blue-700 self-end rounded-sm ml-auto" onClick={continueState}>CONTINUE ➣</button>
                        </div>
                    </>}
                </div>

                <div className={"relative w-full flex flex-col px-6 py-3 border-b-2 border-white border-opacity-70 shadow-none overflow-hidden gap-4 transition-all duration-500 z-[1] "+((selectionState==2)?"flex-1":"h-min")}>
                    <div className={"text-white "+((selectionState==2)?"text-2xl":"text-lg")}>PLAY</div>
                    {selectionState==2 &&  //if skills parameters are selcted, display play section
                    <>
                        <div className="w-[80%] text-sm font-navbar font-medium text-justify whitespace-pre-line">
                            <span className="text-base font-semibold border-l-2 pl-2 border-white border-opacity-80">INSTRUCTIONS TO PLAY</span><br/><br/>
                            {skills[selectedSkill].playInstructions}
                        </div>

                        <i className={skills[selectedSkill].icon+" text-[300px] text-white text-opacity-15 absolute z-0 right-4"}></i>

                        <div className="w-full flex mt-auto z-[1]">
                            <button className="text-base px-3 py-2 bg-blue-700 self-end rounded-sm" onClick={backState}>⮘ BACK</button>
                            <button className="text-base px-3 py-2 bg-blue-700 self-end rounded-sm ml-auto" onClick={()=>goPlayScreen()}>PLAY ➣</button>
                        </div>
                    </>}
                </div>
            </div>
            

            {/*PLAY SCREEN*/}
            <div className={(selectionState!=4)?"relative h-[100vh] w-screen flex flex-col items-center justify-center overflow-hidden gap-5":"relative h-[200vh]"} ref={playScreenRef}>
                
                {selectionState==3 && <div className="absolute text-7xl text-white text-opacity-50" ref={playCountDownRef}>READY?</div>}


                {selectionState==4 && //if the game has started, display the game
                    <>
                    {/*display the respective game based on the skill selected. A callback to call 
                    when the game skill ends is passed to the game skill component and skills parameters
                    are passed too*/}
                    {selectedSkill==0 && 
                    <FastTyping 
                        skillParameters={skillsParameters} 
                        user={userData} 
                        records={records}
                        tournament={props.tournament}
                    />}
                    </>
                }

            </div>
            
            {isLoading && <Loading/>}
        </Container>
    )
}

export default Play;