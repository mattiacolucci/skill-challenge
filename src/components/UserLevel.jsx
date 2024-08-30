import { useEffect, useState } from "react";
import { calculateMaxValueExpByLv } from "../utility.jsx";

const UserLevel = (props)=>{
    const [maxValueExp,setMaxValueExp]=useState(calculateMaxValueExpByLv(props.userLv));
    const [expWidth,setExpWidth]=useState((props.expValue/maxValueExp)*100);   //width of the bar indicating the experience of the player

    //each time props changes, update max exp value and exp width
    useEffect(()=>{
        setMaxValueExp(calculateMaxValueExpByLv(props.userLv));
        setExpWidth((props.expValue/maxValueExp)*100);
    },[props])

    return(
        <div className={"flex flex-col gap-3 "+props.className}>
            {props.displayUserInfo && <div className="flex flex-row items-center gap-3 ml-1">
                <img src={props.userProfileImage} className="w-[25px] h-[25px] rounded-full"/>
                <div className="max-w-[200px] line-clamp-1 font-default font-normal">{props.username.toUpperCase()}</div>
            </div>}
            <div className="flex flex-row items-center">
                <div className="w-6 h-6 leading-6 text-center bg-mainBlue rounded-[3px] text-white font-default text-xs font-thin">{props.userLv}</div>
                <div className="relative w-[100px] h-4 bg-darkBlue bg-opacity-65 overflow-hidden flex items-center justify-center">
                    <div className="text-white text-[10px] font-semibold font-navbar z-[2] text-opacity-80">{props.expValue+"/"+maxValueExp}</div>
                    <div className="absolute h-full bg-mainBlue bg-opacity-80 left-0 transition-all duration-500" style={{width:expWidth+"%"}}></div>
                </div>

                <div className="ml-3 h-[22px] px-2 text-white text-[10px] leading-[22px] rounded-sm bg-mainBlue bg-opacity-60" title="Ranking Points">
                    <i className="fi fi-sr-bahai text-blueOverBg text-[9px] !leading-0 p-0"></i>
                    &ensp;
                    {props.rankingPoints}
                </div>

                <div className="flex flex-col items-center">
                    {props.earnedRankingPoints!=undefined && <div className="text-white text-[10px] ml-2" title={props.earnedRankingPointsString}>{((props.earnedRankingPoints>0)?"+":"")+props.earnedRankingPoints+" points"}</div>}
                    {props.earnedExp!=undefined && <div className="text-white text-[10px] ml-2" title={props.earnedExpString}>{"+"+props.earnedExp+" exp"}</div>}
                </div>

                {props.levelUp && <div className="text-mainGreen text-[10px] ml-2 animate-fadeUp">⮙ Level Up</div>}
            </div>
        </div>
    )
}

export default UserLevel;