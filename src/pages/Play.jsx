import { useEffect, useRef, useState } from "react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";
import { skills } from "../assets/data";
import FastTyping from "../components/skills/FastTyping";
import { getSkillLeaderboard, getUserData } from "../firebase";
import Loading from "../components/Loading";


const Play=(props)=>{
    const playScreenRef=useRef();
    const playCountDownRef=useRef();
    const [selectionState,setSelectionState]=useState(0);
    const [selectedSkill,setSelectedSkill]=useState(-1);
    const [skillsParameters,setSkillsParameters]=useState([]);
    const [userData,setUserData]=useState({});  //state which contains user profile data and record done in the selected skill
    const [records,setRecords]=useState({});  //state which contains all NR and WR records of the selected skill
    const [isLoading,setIsLoading]=useState(false);

    const continueState=()=>{
        setSelectionState(selectionState+1);
    }

    const backState=()=>{
        setSelectionState(selectionState-1);
    }

    const selectSkill=(value)=>{
        //set default values for skill's parameters
        switch(value){
            case 0:
                setSkillsParameters([1,4]);
                break;
            case 1:
                setSkillsParameters([5]);
            default:
                break;
        }

        //update selected skill
        setSelectedSkill(value);
    }

    const updateParameter=(index,min,max,value)=>{
        //copy paramets array
        var parametersCopy=[...skillsParameters];

        //do not update value if it is not between min and max
        if(value<min && value!=""){
            parametersCopy[index]=min;
        }else if(value>max){
            parametersCopy[index]=max;
        }else{  //update value otherwise
            parametersCopy[index]=value;
        }
        //update state
        setSkillsParameters(parametersCopy);
    }

    //function which fetch user data and records for the selected skill and scroll down the page on the play screen
    const goPlayScreen=async ()=>{
        setIsLoading(true);

        //fetch user data
        const [response,data]=await getUserData(props.user.uid);

        if(response){
            setUserData({...props.user,lv:data.lv,exp:data.exp});

            //fetch skill leaderboard
            const [resp,skillRecords] = await getSkillLeaderboard(selectedSkill,skillsParameters,data.country,1);

            console.log(skillRecords)

            if(resp){
                setRecords(skillRecords);
            }else{
                console.log(data);
            }

        }else{
            console.log(data);
        }

        //set selection state to 3, so the "3,2,1,go" is displayed
        setSelectionState(3);

        setIsLoading(false);
    }

    useEffect(()=>{
        if(!isLoading && selectionState==3){
            //go to the play screen of the page
            playScreenRef.current.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});

            //make appear the "3,2,1,go" with a settimeout
            setTimeout(()=>playCountDownRef.current.innerHTML=3,2000);
            setTimeout(()=>playCountDownRef.current.innerHTML=2,3000);
            setTimeout(()=>playCountDownRef.current.innerHTML=1,4000);
            setTimeout(()=>playCountDownRef.current.innerHTML="GO!",5000);

            //set selection 4 so the game skill is displayed
            setTimeout(()=>{setSelectionState(4)},5500);
        }
    },[isLoading])

    if(isLoading){
        return <Loading/>;
    }else{
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
    
                            <div className="w-full flex flex-col gap-4">
                                {selectedSkill==0 && //parameters for skill 1
                                <>
                                <div className="w-[350px] flex flex-row gap-4 items-center">
                                    <div className="text-lg font-navbar font-semibold">Number of words <span className="text-xs">(1-15)</span></div>
                                    <input type="number" className="ml-auto text-base px-3 py-1 border-0 border-b-2 font-navbar border-white outline-none bg-white bg-opacity-30" min={1} max={15}
                                    onChange={(e)=>updateParameter(0,1,15,e.target.value)} value={skillsParameters[0]}/>
                                </div>
                                <div className="w-[350px] flex flex-row gap-4 items-center">
                                    <div className="text-lg font-navbar font-semibold">Number of chars per word <span className="text-xs">(2-10)</span></div>
                                    <input type="number" className="ml-auto text-base px-3 py-1 border-0 border-b-2 font-navbar border-white outline-none bg-white bg-opacity-30" min={2} max={10} 
                                    onChange={(e)=>updateParameter(1,2,10,e.target.value)} value={skillsParameters[1]}/>
                                </div></>}
    
                                {selectedSkill==1 && //parameters for skill 2
                                <div className="w-[350px] flex flex-row gap-4 items-center">
                                    <div className="text-lg font-navbar font-semibold">Number of clicks <span className="text-xs">(1-20)</span></div>
                                    <input type="number" className="ml-auto text-base px-3 py-1 border-0 border-b-2 font-navbar border-white outline-none bg-white bg-opacity-30" min={1} max={20}
                                    onChange={(e)=>updateParameter(0,1,20,e.target.value)} value={skillsParameters[0]}/>
                                </div>
                                }
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
                        {selectedSkill==0 && <FastTyping skillsParameters={skillsParameters} user={userData} records={records}/>}
                        </>
                    }
    
                </div>
            </Container>
        )
    }
}

export default Play;