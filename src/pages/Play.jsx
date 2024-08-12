import { useState } from "react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";
import { skills } from "../assets/data";


const Play=()=>{
    const [selectionState,setSelectionState]=useState(0);
    const [selectedSkill,setSelectedSkill]=useState(-1);

    const continueState=()=>{
        setSelectionState(selectionState+1);
    }

    const backState=()=>{
        setSelectionState(selectionState-1);
    }

    const selectSkill=(value)=>{
        setSelectedSkill(value);
    }

    return(
        <Container>
            <Navbar/>
            <div className="w-[90vw] flex-1 mt-5 border-l-2 border-white border-opacity-70 flex flex-col items-center pl-7">
                <div className={"w-full flex flex-col px-6 py-3 border-b-2 border-white border-opacity-70 shadow-none gap-4 transition-all duration-500 "+((selectionState==0)?"flex-1":"h-min")}>
                    <div className={"text-white "+((selectionState==0)?"text-2xl":"text-xl")}>SELECT SKILLS</div>
                    {selectionState==0 &&<>
                        <div className="text-sm font-navbar font-medium">Select the skill which you want to play</div>
                        <div className="w-full flex-1 flex flex-row overflow-hidden">
                            <div className={"flex gap-4 items-center border-r-2 border-white border-opacity-50 pl-3 overflow-x-auto overflow-y-hidden "
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
                            selectedSkill!=-1 && <div className={"flex flex-col items-center p-3 px-5 gap-2 "+((selectedSkill!=-1)?"flex-1":"w-0")}>
                                <div className="text-large">SKILL DESCRIPTION</div>
                                <div className="text-base text-justify font-navbar font-medium line-clamp-[7]" title={skills[selectedSkill].description}>{skills[selectedSkill].description}</div>
                            </div>}
                           
                        </div>

                        {//if a skill has been selected, display the continue button
                        selectedSkill!=-1 && <button className="px-3 py-2 bg-blue-700 self-end rounded-sm mt-auto" onClick={continueState}>CONTNUE ➣</button>}
                    </>}
                </div>
                <div className={"w-full flex flex-col px-6 py-3 border-b-2 border-white border-opacity-70 shadow-none overflow-hidden gap-4 transition-all duration-500 "+((selectionState==1)?"flex-1":"h-min")}>
                    <div className={"text-white "+((selectionState==1)?"text-2xl":"text-xl")}>SELECT PARAMETERS</div>
                    {selectionState==1 &&<>
                        <div className="text-sm font-navbar font-medium">Select the number of words you want for the selected skill</div>
                        <div className="w-full flex mt-auto">
                            <button className="px-3 py-2 bg-blue-700 self-end rounded-sm" onClick={backState}>⮘ BACK</button>
                            <button className="px-3 py-2 bg-blue-700 self-end rounded-sm ml-auto" onClick={continueState}>CONTNUE ➣</button>
                        </div>
                    </>}
                </div>
                <div className={"w-full flex flex-col px-6 py-3 border-b-2 border-white border-opacity-70 shadow-none overflow-hidden gap-4 transition-all duration-500 "+((selectionState==2)?"flex-1":"h-min")}>
                    <div className={"text-white "+((selectionState==2)?"text-2xl":"text-xl")}>PLAY</div>
                </div>
            </div>
        </Container>
    )
}

export default Play;