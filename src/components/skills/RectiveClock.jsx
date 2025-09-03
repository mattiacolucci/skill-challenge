import { useEffect, useRef, useState } from "react";
import Loading from "../Loading";
import { useNavigate } from "react-router-dom";
import { skills } from "../../assets/data";
import Chronometer from "../Chronometer";
import UserLevel from "../UserLevel";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { calculateEarnedExpSkill, prettyPrintParameter, skillParametersJoinPrint } from "../../utility";
import { calculateNewRankingPoints, storeGameResult } from "../../firebase";

const ReactiveClock=(props)=>{

    //user settings
    const username=props.user.username;
    const userProfileImage=props.user.photoURL;
    const [expValue,setExpValue]=useState(props.user.exp);
    const [userLv,setUserLv]=useState(props.user.lv);  //level of the user
    const [earnedExp,setEarnedExp]=useState(0);   //indicated exp eaerned by playing the single game
    const [levelUp,setLevelUp]=useState(false);  //true if after the game a new level has been reached
    const [earnedExpString,setEarnedExpString]=useState("");  //string which express how the exp earned in a game is distribuited
    const [rankingPoints,setRankingPoints]=useState(props.user.rankingPoints);   //ranking points
    const [earnedRankingPoints,setEarnedRankingPoints]=useState(0);  //represents earned ranking points
    const [earnedRankingPointsString,setEarnedRankingPointsString]=useState("");  //represents earned ranking points string

    //params
    const skillIndex=1; //index of the skill in the skills array
    const skillName="REACTIVE CLOCK";
    const skillParameters=skills[skillIndex].skillParametersPossibleValues[props.skillParameters];
    const num_clicks=skillParameters[0];

    //utils
    const [isLoading,setIsLoading]=useState(true);
    const [gameEnded,setGameEnded]=useState(false);
    const [showResults,setShowResults]=useState(false);
    const [isSoftLoading,setIsSoftLoading]=useState(false);
    const navigate=useNavigate();
    const chronometerRef=useRef();

    //skill related
    const circleDiameter=100; //diameter of the circle in px
    const [circles,setCircles] = useState([]);  //will contains all the data about the generated circles
    const [showCircle,setShowCircle] = useState(false); //true if the circle has to be shown
    const [results,setResults]=useState({});  //will contains the results of the game in terms of records
    const [dataChart,setDataChart]=useState();  //data to be displayed in the result chart
    const [showCircleResult,setShowCircleResult]=useState(-1); //indicates the circle for which the time needs to be shown in the graph once the user over it
    const screenRef = useRef();
    const resultsRef=useRef();

    const generateRandomCircle=()=>{
        const screenH = screenRef.current.getBoundingClientRect().height;
        const screenW = screenRef.current.getBoundingClientRect().width;
        const maxX = screenW - circleDiameter;
        const minX = 0;
        const maxY = screenH - circleDiameter;
        const minY = 0;

        const randX = Math.floor(Math.random() * (maxX - minX) + minX);
        const randY = Math.floor(Math.random() * (maxY - minY) + minY);

        setCircles(currentCircles => {   //this set state is done to avoid the problem that if i copy the state as circlesCopy = structuredClone(circles) the circles state may not be the updated one, and this may cause problems in case of sequential updates pf circles
            const circlesCopy = structuredClone(currentCircles);
            circlesCopy.push({x: (randX/screenW*100).toFixed(0)+"%", y: (randY/screenH*100).toFixed(0)+"%", id: circlesCopy.length, reactionTime:null});
            return circlesCopy;
        });
    }

    const newCircle = () =>{
        //generate random circle
        generateRandomCircle();

        //show the circle
        setShowCircle(true);

        //start the chronometer
        chronometerRef.current.startAndStop();
    }

    useEffect(()=>{
        setIsLoading(false);
    },[]);

    //WHEN EVERYTHING IS READY TO START THE GAME
    useEffect(()=>{
        if(isLoading==false){   //if we are ready to start the game
            //create the first circle and start the chronometer
            newCircle();
        }
    },[isLoading]);
    
    const handleClick=()=>{
        //hide the circle
        setShowCircle(false);
        
        //stop the chronometer
        chronometerRef.current.startAndStop();

        //get reaction time
        const reactionTime = chronometerRef.current.getTime()/1000;

        //zero the chronometer
        chronometerRef.current.zero();

        //set reaction time of the current clicked circle
        setCircles(currentCircles => {
            const circlesCopy = structuredClone(currentCircles);
            circlesCopy[circlesCopy.length-1].reactionTime = reactionTime;
            return circlesCopy;
        });

        //generate new circle if the number of circles that needs to be displayed has not been reached
        if(circles.length<num_clicks){
            setTimeout(newCircle,1000);
        }
    }

    //check game end
    useEffect(()=>{
        //if all circles have been clicked and all of them have a reaction time set, so have been clicked
        if(circles.length>=num_clicks && circles.map(c=>c.reactionTime).filter(r=>r==null).length==0){
            //game ended
            calcolateResults();
        }
    },[circles]);

    const calcolateResults=()=>{  //calculate results of the game
        //calculate total time, avg time and fastest circle
        const totalTime=circles.map(c=>c.reactionTime).reduce((a,b)=>a+b,0);
        const avgTime=totalTime/circles.length;
        const fastestCircle=circles.map(c=>c.reactionTime).sort()[0];

        //create data for the chart
        //the chart will display all the reaction times of each circle
        setDataChart(circles.map((c,i)=>{return {id:(i+1),time:c.reactionTime}}));

        const res={
            totTime:totalTime,
            avgTime:avgTime,
            fastestCircle:fastestCircle,
            distancesFromRecords:{
                "WR":{},
                "NR":{},
                "PB":{}
            }
        };
        
        //set the istance record for each result parameter and for each of PB, NR, WR
        //if a record is null it means it has not been already set, so set the distance between actual time and record
        //equals to null
        for (const param of skills[skillIndex].skillResultsParameters){
            for (const rec of ["PB","NR","WR"]){
                if(props.records[rec][param].record!=null){
                    res.distancesFromRecords[rec][param]=res[param]-props.records[rec][param].record;
                }else{
                    res.distancesFromRecords[rec][param]=null;
                }
            }
        }

        setResults(res);

        setGameEnded(true);
    }

    const goResults=async ()=>{
        //calculate earned exp and new level if it has been reached
        const [newExp,newLevel,newEarnedExp,newEarnedExpString]=calculateEarnedExpSkill(skillName,skillParameters,userLv,results,expValue);

        //calculate new ranking points
        const [response,newRankingPoints,rankingPointsString]=await calculateNewRankingPoints(rankingPoints,results[skills[skillIndex].skillPerformanceParameter],skillIndex,skillParameters);

        if(response){
            //store result on db
            setIsSoftLoading(true);

            /*const [resp,message]=await storeGameResult({
                skill:skillName, user:props.user.uid, totTime:parseFloat(results.totalTime.toFixed(3)),
                avgTime:parseFloat(results.avgTime.toFixed(3)), fastestCircle:parseFloat(results.fastestCircle.toFixed(3)), 
                date: new Date(), skillParameters:skillParametersJoinPrint(skillParameters)
            },skillIndex,props.skillParameters,props.records,results.distancesFromRecords,newLevel,newExp,newRankingPoints,props.tournament);
            
            if(resp){
                //go to results screen
                resultsRef.current.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});

                setShowResults(true);
            }else{
                console.log(message);
            }*/

            resultsRef.current.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
            setShowResults(true);
        }else{
            console.log(newRankingPoints);
        }

        setIsSoftLoading(false);

        //update lv, exp and ranking points after 2 sec
        setTimeout(()=>{setUserLv(newLevel);
            setEarnedExp(newEarnedExp);
            setLevelUp((newLevel>userLv)?true:false);
            setExpValue(newExp);
            setEarnedExpString(newEarnedExpString);
            setEarnedRankingPoints(newRankingPoints-rankingPoints);
            setRankingPoints(newRankingPoints);
            setEarnedRankingPointsString(rankingPointsString);
        },2000);
    }

    const ciclesClicked = <div className="flex gap-4">
        {circles.map((circle,index)=>{
            return <>{circle.reactionTime!=null && <div className="basis-[10%] flex flex-col items-center justify-start gap-2 border-r-2 pr-4 border-white animate-fadeUp" key={index}>
                <div className={"font-navbar text-base "+((index>6)?"text-white text-opacity-70":"text-blueOverBg")}>{"Circle "+(index+1)}</div>
                <div className={"w-10 h-10 rounded-[50%] "+((index>6)?"bg-white opacity-70":"bg-blueOverBg")}></div>
                {circle.reactionTime!=null && <div className="font-navbar text-white text-base">{circle.reactionTime.toFixed(3)+"s"}</div>}
            </div>}</>
        })}
    </div>;

    if(isLoading){
        return <Loading/>;
    }else{
        return<>
        <div className={"relative h-[200vh]"}>


        <div className="relative h-[100vh] w-screen flex flex-col items-center justify-center overflow-hidden gap-4 bg-red-600">

            <div className="relative w-screen flex-1 bg-green-500" ref={screenRef}>
                {showCircle && <div style={{width:circleDiameter/2+"px",height:circleDiameter/2+"px",left:circles[circles.length-1].x,top:circles[circles.length-1].y}} className="absolute bg-blue-600 rounded-[50%] animate-popUpFast cursor-pointer origin-center" onClick={()=>handleClick()}></div>}
            </div>

            <div className="relative w-screen flex flex-col gap-3 select-none p-4">
                <div className="flex flex-row gap-3 items-center">
                    <Chronometer ref={chronometerRef}/>
                    {//if the game is ended display the continue button
                    gameEnded && <button className="text-base text-white px-3 py-2 ml-auto bg-blue-700 self-end rounded-sm mt-auto" onClick={()=>goResults()}>CONTINUE ➣</button>}
                </div>
                
                {//show circles clicked and their reaction times
                    ciclesClicked
                }
            </div>
        </div>
        
        {/*game results*/}
        <div className="w-screen h-[100vh] bg-resultsBg text-white font-navbar font-semibold flex flex-col gap-5" ref={resultsRef}>
            {gameEnded && showResults && <>
                <div className="w-screen flex flex-row items-center mt-5">

                    <UserLevel className="basis-[33%] self-end pl-7" userLv={userLv} expValue={expValue} userProfileImage={userProfileImage}
                    levelUp={levelUp} username={username} earnedExp={earnedExp} earnedExpString={earnedExpString} displayUserInfo={true} 
                    rankingPoints={rankingPoints} earnedRankingPoints={earnedRankingPoints} earnedRankingPointsString={earnedRankingPointsString}/>

                    <div className="basis-[33%] font-default text-3xl self-center text-center">RESULTS</div>

                    <div className="basis-[33%] flex items-center justify-end">
                        <button className="text-base px-3 py-2 bg-blue-700 self-end rounded-sm ml-auto mr-7" onClick={()=>navigate("/")}>CONTINUE ➣</button>
                    </div>
                </div>

                <div className="h-min w-screen flex flex-row items-center">
                    <div className="h-[60vh] w-[calc(100vw/2-225px)] flex flex-col items-center justify-center gap-6">
                        <div className="text-white text-xl mt-3">CLICKS CHART</div>
                        <LineChart width={300} height={150} data={dataChart} margin={{bottom:10,right:10}} title="Clicks Chart" style={{alignSelf:"center"}}>
                            <XAxis minTickGap={10} dataKey="id" interval={"equidistantPreserveStartEnd"} label={{ value: 'Circle #', angle: 0, position: 'insideBottomRight', offset:-7, fontSize:"12px"}} style={{ fontSize: '12px'}}/>
                            <YAxis minTickGap={8} interval={"equidistantPreserveStartEnd"} label={{ value: 'Time (s)', angle: -90, fontSize:"10px", position:'insideBottom', offset:55}} style={{ fontSize: '12px'}}/>
                            <Line type="monotone" dataKey="time" stroke="#1c158f" dot={false} label={false} strokeWidth={1.5}/>
                        </LineChart>
                        <div className="text-white text-xl">CLICKS GRAPH</div>
                        <div className="relative flex-1 aspect-video glass-effect">
                            {circles.map((circle,index)=>{
                                return <div key={circle.id} style={{left:circle.x,top:circle.y}} onMouseOver={()=>setShowCircleResult(index)} onMouseOut={()=>setShowCircleResult(-1)} className="absolute w-5 h-5 bg-blue-600 rounded-[50%] animate-popUp flex items-center justify-center cursor-pointer">
                                        <div className="text-[7px]">{index}</div>
                                    </div>
                            })}

                            {showCircleResult!=-1 && 
                                <div style={{left:circles[showCircleResult].x,top:(parseInt(circles[showCircleResult].y.replace("%",""))+15)+"%"}} className="absolute p-2 bg-darkBlue rounded-md text-sm font-navbar animate-fadeUp">
                                    {circles[showCircleResult].reactionTime+"s"}    
                                </div>
                            }
                        </div>
                    </div>

                    <div className="h-max w-[450px] flex flex-col gap-1 bg-white bg-opacity-10 rounded-md px-3 py-1 pb-0 origin-center flex-none z-[2]">
                        
                        {/*Show the records distance for each result parameter*/}
                        {skills[skillIndex].skillResultsParameters.map((param,index)=>{
                            return(
                                <div className={"w-full flex flex-row p-2 pb-4 items-center "+(index<skills[skillIndex].skillResultsParameters.length-1?"border-b-2 border-white":"")} key={index}>
                                    <div className="flex flex-col basis-[50%] gap-1">
                                        <div className="text-xs font-normal">{prettyPrintParameter(param)}</div>
                                        <div className="text-xl self-center">{results[param].toFixed(3)+"s"}</div>
                                    </div>
                                    <div className="h-full flex flex-col basis-[50%] items-center border-l-2 border-white border-opacity-30 px-3">
                                        {[["PB","Personal Best"],["NR","National Record"],["WR","World record"]].map((rec,idx)=>{
                                            const recType=rec[0];
                                            const recString=rec[1];
                                            var bgString="";

                                            switch(recType){
                                                case "PB":
                                                    bgString="bg-blueOverBg bg-opacity-50";
                                                    break;
                                                case "NR":
                                                    bgString="bg-yellow-gold bg-opacity-50";
                                                    break;
                                                case "WR":
                                                    bgString="bg-yellow-gold bg-opacity-65";
                                                    break;
                                            }

                                            return <>{props.records[recType][param].record!=null && <div className="w-full flex flex-row justify-center items-center gap-2">
                                                <div className={"text-[9px] w-[20px] h-[20px] text-center leading-[20px] rounded-sm "+bgString} title={recString}>{recType}</div>
                                                <div className="text-base">{props.records[recType][param].record.toFixed(3)+"s"}</div>
                                                <div className={"text-[10px] "+((results.distancesFromRecords[recType][param]>0)?"text-yellow-gold":"text-mainGreen")}>
                                                    {(results.distancesFromRecords[recType][param]!=null)?("("+((results.distancesFromRecords[recType][param]>0)?"+":"")+results.distancesFromRecords[recType][param].toFixed(3)+"s)"):""}
                                                </div>
                                            </div>}</>

                                        })}
                                    </div>
                            </div>
                            )
                        })}
                    </div>

                    {/*Records badges*/}
                    <div className="h-full flex flex-col justify-center animate-record opacity-0 z-0 gap-[65px]">
                        {skills[skillIndex].skillResultsParameters.map((param,index)=>{
                            return (
                            <div className={"text-base w-[250px] text-nowrap px-3 py-[6px] text-black WR-clip-path "+
                                ((results.distancesFromRecords.WR[param]<0 || results.distancesFromRecords.WR[param]==null)?"bg-yellow-gold":((results.distancesFromRecords.NR[param]<0 || results.distancesFromRecords.NR[param]==null)?"bg-yellow-gold bg-opacity-80":((results.distancesFromRecords.PB[param]<0 || results.distancesFromRecords.PB[param]==null)?"bg-blueOverBg bg-opacity-70":"")))}
                            >{((results.distancesFromRecords.WR[param]<0 || results.distancesFromRecords.WR[param]==null)?"NEW WORLD RECORD":((results.distancesFromRecords.NR[param]<0 || results.distancesFromRecords.NR[param]==null)?"NEW NATIONAL RECORD":((results.distancesFromRecords.PB[param]<0 || results.distancesFromRecords.PB[param]==null)?"NEW PERSONAL BEST":"")))}</div>)
                        })}
                    </div>
                </div>

                <div className="mt-auto mb-4">
                    {ciclesClicked}    
                </div>
                </>
            }

            {isSoftLoading && <Loading/>}
        </div>
        
        </div>
        </>
    }
}

export default ReactiveClock;