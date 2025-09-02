import { useEffect, useRef, useState } from "react";
import Loading from "../Loading";
import { useNavigate } from "react-router-dom";
import { skills } from "../../assets/data";
import Chronometer from "../Chronometer";
import UserLevel from "../UserLevel";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { calculateEarnedExpSkill, skillParametersJoinPrint } from "../../utility";
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
    
    //personal bests
    const personalBestCircle=props.records.PB.fastestCircle.record;  //personal best fastest circle in sec
    const personalBestTotTime=props.records.PB.totTime.record;   //personal best tot time in sec
    const personalBestAvgTime=props.records.PB.avgTime.record  //personal best avg time in sec

    //national bests
    const nationalBestCircle=props.records.NR.fastestCircle.record;
    const nationalBestTotTime=props.records.NR.totTime.record;
    const nationalBestAvgTime=props.records.NR.avgTime.record;

    //world bests
    const worldBestCircle=props.records.WR.fastestCircle.record;
    const worldBestTotTime=props.records.WR.totTime.record;
    const worldBestAvgTime=props.records.WR.avgTime.record;

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
    const screenRef = useRef();
    const resultsRef=useRef();

    const generateRandomCircle=()=>{
        const screenH = screenRef.current.offsetHeight;
        const screenW = screenRef.current.offsetWidth;
        const randX = Math.floor(Math.random() * (screenW - circleDiameter/2)) + circleDiameter/2;
        const randY = Math.floor(Math.random() * (screenH - circleDiameter/2)) + circleDiameter/2;

        setCircles(currentCircles => {   //this set state is done to avoid the problem that if i copy the state as circlesCopy = structuredClone(circles) the circles state may not be the updated one, and this may cause problems in case of sequential updates pf circles
            const circlesCopy = structuredClone(currentCircles);
            circlesCopy.push({x: randX, y: randY, id: circlesCopy.length, reactionTime:null});
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
        }else{  //game ended
            calcolateResults();
        }
    }

    const calcolateResults=()=>{  //calculate results of the game
        //calculate total time, avg time and fastest circle
        const totalTime=circles.map(c=>c.reactionTime).reduce((a,b)=>a+b,0);
        const avgTime=totalTime/circles.length;
        const fastestCircle=circles.map(c=>c.reactionTime).sort()[0];

        //create data for the chart
        //the chart will display all the reaction times of each circle
        setDataChart(circles.map((c,i)=>{return {id:(i+1),time:c.reactionTime}}));

        //if a record is null it means it has not been already set, so set the distance between actual time and record
        //equals to null
        const res={
            totalTime:totalTime,
            avgTime:avgTime,
            fastestCircle:fastestCircle,
            distancesFromRecords:{
                "WR":{
                    totTime:(worldBestTotTime!=null)?totalTime-worldBestTotTime:null,
                    avgTime:(worldBestAvgTime!=null)?avgTime-worldBestAvgTime:null,
                    fastestCircle:(worldBestCircle!=null)?fastestCircle-worldBestCircle:null
                },
                "NR":{
                    totTime:(nationalBestTotTime!=null)?totalTime-nationalBestTotTime:null,
                    avgTime:(nationalBestAvgTime!=null)?avgTime-nationalBestAvgTime:null,
                    fastestCircle:(nationalBestCircle!=null)?fastestCircle-nationalBestCircle:null
                },
                "PB":{
                    totTime:(personalBestTotTime!=null)?totalTime-personalBestTotTime:null,
                    avgTime:(personalBestAvgTime!=null)?avgTime-personalBestAvgTime:null,
                    fastestCircle:(personalBestCircle!=null)?fastestCircle-personalBestCircle:null
                }
            }
        };

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

    if(isLoading){
        return <Loading/>;
    }else{
        return<>
        <div className={"relative h-[200vh]"}>


        <div className="relative h-[100vh] w-screen flex flex-col items-center justify-center overflow-hidden gap-4 bg-red-600">

            <div className="relative w-screen flex-1 bg-green-500" ref={screenRef}>
                {showCircle && <div style={{width:circleDiameter/2+"px",height:circleDiameter/2+"px",left:circles[circles.length-1].x,top:circles[circles.length-1].y}} className="absolute bg-blue-600 rounded-[50%] animate-popUp cursor-pointer" onClick={()=>handleClick()}></div>}
            </div>

            <div className="relative w-screen flex flex-col gap-3 select-none p-4">
                <div className="flex flex-row gap-3 items-center">
                    <Chronometer ref={chronometerRef}/>
                    {//if the game is ended display the continue button
                    gameEnded && <button className="text-base px-3 py-2 ml-auto bg-blue-700 self-end rounded-sm mt-auto" onClick={()=>goResults()}>CONTINUE ➣</button>}
                </div>
                <div className="flex gap-4">
                    {circles.map((circle,index)=>{
                        return <div className="flex flex-col items-center justify-start gap-2 border-r-2 pr-4 border-white" key={index}>
                            <div className="font-navbar text-white text-base">{"Circle "+(index+1)}</div>
                            <div className="w-10 h-10 rounded-[50%] bg-white opacity-75 "></div>
                            {circle.reactionTime!=null && <div className="font-navbar text-white text-base">{circle.reactionTime.toFixed(3)+"s"}</div>}
                        </div>
                    })}
                </div>
            </div>
        </div>
        
        {/*game results*/}
        <div className="w-screen h-[100vh] bg-resultsBg text-white font-navbar font-semibold flex flex-col gap-5" ref={resultsRef}>
            {gameEnded && <>
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
                    <div className="h-full w-[calc(100vw/2-225px)] flex flex-col items-center justify-center gap-6">
                        <div className="text-white text-xl">CLICKS CHART</div>
                        <LineChart width={300} height={150} data={dataChart} margin={{bottom:10,right:10}} title="Clicks Chart" style={{alignSelf:"center"}}>
                            <XAxis minTickGap={10} dataKey="id" interval={"equidistantPreserveStartEnd"} label={{ value: 'Id', angle: 0, position: 'insideBottomRight', offset:-7, fontSize:"12px"}} style={{ fontSize: '12px'}}/>
                            <YAxis minTickGap={8} interval={"equidistantPreserveStartEnd"} label={{ value: 'Time (s)', angle: -90, fontSize:"10px", position:'insideBottom', offset:55}} style={{ fontSize: '12px'}}/>
                            <Line type="monotone" dataKey="time" stroke="#1c158f" dot={false} label={false} strokeWidth={1.5}/>
                        </LineChart>
                    </div>
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