import { useEffect, useRef, useState } from "react";
import words_list from "../../assets/words.json";
import Chronometer from "../Chronometer";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { calculateEarnedExpSkill, skillParametersJoinPrint } from "../../utility.jsx";
import UserLevel from "../UserLevel";
import Loading from "../Loading";
import { calculateNewRankingPoints, storeGameResult } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { skills } from "../../assets/data.js";

const FastTyping=(props)=>{
    //user settings
    const language="IT";
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
    const personalBestSingleWord=props.records.PB.fastestWord.record;  //personal best single word in sec
    const personalBestTotTime=props.records.PB.totTime.record;   //personal best tot time in sec
    const personalBestAvgTime=props.records.PB.avgTime.record  //personal best avg time in sec

    //national bests
    const nationalBestSingleWord=props.records.NR.fastestWord.record;
    const nationalBestTotTime=props.records.NR.totTime.record;
    const nationalBestAvgTime=props.records.NR.avgTime.record;

    //world bests
    const worldBestSingleWord=props.records.WR.fastestWord.record;
    const worldBestTotTime=props.records.WR.totTime.record;
    const worldBestAvgTime=props.records.WR.avgTime.record;

    //params
    const skillParameters=skills[0].skillParametersPossibleValues[props.skillParameters];
    const num_words=skillParameters[0];
    const num_chars=skillParameters[1];
    
    const inputRef=useRef();
    const chronometerRef=useRef();
    const resultsRef=useRef();
    const [isLoading,setIsLoading]=useState(true);
    const [isSoftLoading,setIsSoftLoading]=useState(false);
    const [wordInput,setWordInput]=useState("");
    const [wordsToWrite,setWordsToWrite]=useState([]);
    const [currentWordToWrite,setCurrentWordToWrite]=useState("");
    const [chronoTimeLastWord,setChronoTimeLastWord]=useState(0);
    const [gameEnded,setGameEnded]=useState(false);
    const [showResults,setShowResults]=useState(false);
    const [results,setResults]=useState({});
    const [dataCharType,setDataCharType]=useState([{time:0,charNum:0}]);
    const [recordLineWidth,setRecordLineWidth]=useState(0);

    const navigate=useNavigate();

    useEffect(()=>{
        //take all words of the language with length equals to the selected num of chars that the words has to have
        var allWords=words_list[language][num_chars];
        var wordsToPlay=[]

        //get "num_words" random words of length "num_chars"
        for(var i=0;i<num_words;i++){
            const selectedWord=Math.floor(Math.random()*allWords.length);
            wordsToPlay.push({   //for each word we have
                word:allWords[selectedWord], 
                state:"not done", //state: "not done", "correct", "wrong"
                time:0,  //time taken to type the word 
                personalBest:false  //indicates if the time taken to type the word is your personal best
            });
            allWords.splice(selectedWord, 1);
        }

        //set the words array to write
        setWordsToWrite(wordsToPlay);

        //set current word to write to the first one
        setCurrentWordToWrite(0);

        setIsLoading(false);
    },[]);

    //WHEN EVERYTHING IS READY TO START THE GAME
    useEffect(()=>{
        if(isLoading==false){   //if we are ready to start the game
            //focus on input field once the game is loaded
            inputRef.current.focus();

            //start the chronometer
            chronometerRef.current.startAndStop();
        }
    },[isLoading])

    //record line 
    useEffect(()=>{
        //calculate the width to increase of the coWR line every 10 ms
        const recordLineWidthEvery10ms=(100*10)/(worldBestTotTime*1000);

        //interval of record line
        const intervalLine = setInterval(()=>{
            setRecordLineWidth(lineWidth=>lineWidth+recordLineWidthEvery10ms);
        },10);

        if(recordLineWidth>=100 || gameEnded==true){
            clearInterval(intervalLine);
        }

        return ()=>clearInterval(intervalLine)
    },[gameEnded,recordLineWidth])

    //function called every time the input word changes
    const changeInputWord=(word)=>{
        //get current time
        const currentTime=chronometerRef.current.getTime();

        //if this is the first char typed of the game
        if(dataCharType.length==1){
            //calculate reaction time (time in which the first char is typed)
            setResults({...results,reactionTime:parseFloat((currentTime/1000).toFixed(3))})
        }

        //if the last char written is not a space
        if(word.slice(-1)!=" "){
            //set the iput value to the value itself but wth the first letter caps
            setWordInput(word.charAt(0).toUpperCase() + word.slice(1));

            //add the char typed and the time in order to build the final chart
            var dataCharTypeCopy=structuredClone(dataCharType);
            dataCharTypeCopy.push({"time":parseFloat((currentTime/1000).toFixed(1)),charNum:dataCharTypeCopy.at(-1).charNum+1});
            setDataCharType(dataCharTypeCopy);

        }else{  //if the last char written is a space
            //we need to check if the written word is equals to the one that has to be written

            //we first cut the last char which is a space
            word=word.substring(0, word.length - 1).toLowerCase();

            //then chack if the word writte is correct
            if(word==wordsToWrite[currentWordToWrite].word){  //if the written word is correct
                //the word is correct so we can go over with the next word
                const wordTypeTime=(currentTime-chronoTimeLastWord);
                var words=structuredClone(wordsToWrite);
                words[currentWordToWrite]["status"]="correct";
                words[currentWordToWrite]["time"]=(wordTypeTime/1000);

                setWordsToWrite(words);
                setCurrentWordToWrite(currentWordToWrite+1);  //update next word
                setWordInput("");  //clean input field
                setChronoTimeLastWord(currentTime);   //update time in which you write correctly the last word

                //if the current word is the last one, the game is over
                if(currentWordToWrite==num_words-1){
                    console.log("game end");

                    //add more points to the chart of number or written chars
                    var dataCharTypeCopy=structuredClone(dataCharType);
                    for(var i=0;i<dataCharType.length-1;i++){
                        const t1=dataCharType[i].time;
                        const t2=dataCharType[i+1].time;
                        const nPoints=Math.round((t2-t1)*10)/2;
                        for (var f=0;f<nPoints;f++){
                            dataCharTypeCopy.push({time:t1+(f*0.2),charNum:dataCharType[i].charNum});
                        }
                    }
                    setDataCharType(dataCharTypeCopy.sort(function(a, b) {
                        return a.time - b.time;
                    }));


                    //stop the chronometer
                    chronometerRef.current.startAndStop();

                    const totalTime=chronometerRef.current.getTime()/1000;
                    var wordsCopy=structuredClone(words);
                    const sortedWordsPerTime=wordsCopy.sort(function(a, b) {
                        return a.time - b.time;
                    });
                    const fastestWord={word:sortedWordsPerTime[0].word,time:sortedWordsPerTime[0].time};
                    const times=wordsCopy.map((w)=>w.time);
                    const avgTime=times.reduce((a, b) => a + b, 0)/times.length;

                    //if a record is null it means it has not been already set, so set the distance between actual time and record
                    //equals to null
                    const res={
                        totalTime:totalTime,
                        avgTime:avgTime,
                        fastestWord:fastestWord,
                        distancesFromRecords:{
                            "WR":{
                                totTime:(worldBestTotTime!=null)?totalTime-worldBestTotTime:null,
                                avgTime:(worldBestAvgTime!=null)?avgTime-worldBestAvgTime:null,
                                fastestWord:(worldBestSingleWord!=null)?fastestWord.time-worldBestSingleWord:null
                            },
                            "NR":{
                                totTime:(nationalBestTotTime!=null)?totalTime-nationalBestTotTime:null,
                                avgTime:(nationalBestAvgTime!=null)?avgTime-nationalBestAvgTime:null,
                                fastestWord:(nationalBestSingleWord!=null)?fastestWord.time-nationalBestSingleWord:null
                            },
                            "PB":{
                                totTime:(personalBestTotTime!=null)?totalTime-personalBestTotTime:null,
                                avgTime:(personalBestAvgTime!=null)?avgTime-personalBestAvgTime:null,
                                fastestWord:(personalBestSingleWord!=null)?fastestWord.time-personalBestSingleWord:null
                            }
                        }
                    };

                    setResults({...results,...res});

                    //disable input
                    inputRef.current.disabled=true;

                    setGameEnded(true);
                }
            }else{  //if the written word is not correct
                //the player has to rewrite the word
                var words=wordsToWrite;
                words[currentWordToWrite]["status"]="wrong";
                setWordsToWrite(words);
                setWordInput("");
            }
        }
    }

    const goResults=async ()=>{
        //calculate earned exp and new level if it has been reached
        const [newExp,newLevel,newEarnedExp,newEarnedExpString]=calculateEarnedExpSkill("FAST TYPING",skillParameters,userLv,results,expValue);

        //calculate new ranking points
        const [response,newRankingPoints,rankingPointsString]=await calculateNewRankingPoints(rankingPoints,results[skills[0].skillPerformanceParameter],0,skillParameters);

        if(response){
            //store result on db
            setIsSoftLoading(true);

            const [resp,message]=await storeGameResult({
                skill:"FAST TYPING", user:props.user.uid, totTime:parseFloat(results.totalTime.toFixed(3)),
                avgTime:parseFloat(results.avgTime.toFixed(3)), fastestWord:parseFloat(results.fastestWord.time.toFixed(3)), 
                date: new Date(), skillParameters:skillParametersJoinPrint(skillParameters)
            },0,props.skillParameters,props.records,results.distancesFromRecords,newLevel,newExp,newRankingPoints,props.tournament);

            if(resp){
                //go to results screen
                resultsRef.current.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});

                setShowResults(true);
            }else{
                console.log(message);
            }
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

    //component which display all typed words and the time in which it has been typed
    //this html has been defined here since it will be used in 2 different part of this component
    //this is done in order to prevent code duplication
    const wordTyped=<div className="w-screen px-4 flex flex-row gap-2 mt-auto mb-3 select-none content-start">
                        {wordsToWrite.filter(w=>w.status=="correct").map((word,index)=>{
                            return(
                                <div className="basis-[10%] flex flex-col gap-2 items-center animate-fadeUp" key={word.word}>
                                    <div className={"font-navbar text-base "+((index>6)?"text-white text-opacity-70":"text-blueOverBg")}>{word.time.toFixed(3)+"s"}</div>
                                    <div className={"w-full h-1 rounded-md "+((index>6)?"bg-white bg-opacity-70":"bg-blueOverBg")}></div>
                                    <div className="font-navbar text-white text-base">{word.word.charAt(0).toUpperCase() + word.word.slice(1)}</div>
                                </div>
                            )})
                        }
                    </div>
    
    if(isLoading){
        return <Loading/>;
    }else{
        return(
            <>
            <div className="relative h-[100vh] w-screen flex flex-col items-center justify-center overflow-hidden gap-5">
                <div className="absolute top-0 w-screen flex flex-col justify-start">
                    <div className="h-2 bg-yellow-gold self-start" style={{width:recordLineWidth+"vw"}}></div>
                    <div className="record-line-path bg-yellow-gold h-[6px] w-4" style={{marginLeft:"calc("+recordLineWidth+"vw - 8px)"}}></div>
                    <div className="bg-yellow-gold text-black p-1 w-[30px] text-center text-xs" style={{marginLeft:"calc("+recordLineWidth+"vw - 15px)"}}>WR</div>
                </div>

                <div className="text-xl text-white mt-10">FAST TYPING</div>
                <div className="w-[400px] h-[200px] flex flex-row flex-wrap content-start gap-3 overflow-hidden bg-white bg-opacity-70 p-3 rounded-md">
                    {wordsToWrite.map((word,index)=>{
                        //color of the word
                        var wordColor="";

                        if(currentWordToWrite==index){   //blue if is the current one and you are writing
                            wordColor="border-b-2 border-mainBlue";
                        }

                        switch(word.status){
                            case "correct":  //green if it was correct
                                wordColor="border-b-2 border-mainGreen";
                                break;
                            case "wrong":  //red if it was not correct
                                wordColor="border-b-2 border-mainRed";
                                break;
                            default:
                                break;
                        }

                        return  <div className={"text-base text-black font-navbar font-semibold px-2 py-1 h-min "+wordColor}
                        key={word.word}>{word.word.charAt(0).toUpperCase() + word.word.slice(1)}</div>
                    })}
                </div>
                <input type="text" className="w-[400px] py-2 px-4 text-base text-black font-navbar font-semibold bg-white 
                bg-opacity-70 rounded-md outline-none" ref={inputRef} value={wordInput} onChange={(e)=>changeInputWord(e.target.value)}/>
                
                <div className="w-screen flex flex-row items-center mt-5 px-16">
                    <Chronometer ref={chronometerRef}/>
                    {//if the game is ended display the continue button
                    gameEnded && <button className="text-base px-3 py-2 ml-auto bg-blue-700 self-end rounded-sm mt-auto" onClick={()=>goResults()}>CONTINUE ➣</button>}
                </div>

                {//display all words typed and the time in which they have been typed
                    wordTyped
                }

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
                    <div className="h-full w-[calc(100vw/2-225px)] flex flex-col items-center justify-center gap-6">
                        <div className="text-white text-xl">KEYPRESS CHART</div>
                        <LineChart width={300} height={150} data={dataCharType} margin={{bottom:10,right:10}} title="Keypress Chart" style={{alignSelf:"center"}}>
                            <XAxis minTickGap={10} dataKey="time" interval={"equidistantPreserveStartEnd"} label={{ value: 'Time (s)', angle: 0, position: 'insideBottomRight', offset:-7, fontSize:"12px"}} style={{ fontSize: '12px'}}/>
                            <YAxis minTickGap={8} interval={"equidistantPreserveStartEnd"} label={{ value: 'Num Of Typed Chars', angle: -90, fontSize:"10px", position:'insideBottom', offset:55}} style={{ fontSize: '12px'}}/>
                            <Line type="monotone" dataKey="charNum" stroke="#1c158f" dot={false} label={false} strokeWidth={1.5}/>
                        </LineChart>
                        <div className="text-white text-sm text-center">
                            REACTION TIME<br/>
                            <span className="text-xs text-white text-opacity-80">{results.reactionTime+"s"}</span>
                        </div>
                    </div>

                    <div className="h-full w-[450px] flex flex-col gap-1 bg-white bg-opacity-10 rounded-md px-3 py-1 pb-0 origin-center flex-none z-[2]">

                        <div className="w-full border-b-2 border-white flex flex-row p-2 pb-4 items-center">
                            <div className="flex flex-col basis-[50%] gap-1">
                                <div className="text-xs font-normal">TOTAL TIME</div>
                                <div className="text-xl self-center">{results.totalTime.toFixed(3)+"s"}</div>
                            </div>
                            <div className="h-full flex flex-col basis-[50%] items-center border-l-2 border-white border-opacity-30 px-3">
                                {personalBestTotTime!=null && <div className="w-full flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-blueOverBg bg-opacity-50 rounded-sm" title="Personal Best">PB</div>
                                    <div className="text-base">{personalBestTotTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distancesFromRecords.PB.totTime>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {(results.distancesFromRecords.PB.totTime!=null)?("("+((results.distancesFromRecords.PB.totTime>0)?"+":"")+results.distancesFromRecords.PB.totTime.toFixed(3)+"s)"):""}
                                    </div>
                                </div>}
                                {nationalBestTotTime!=null && 
                                <div className="w-full flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-50 rounded-sm" title="National Record">NR</div>
                                    <div className="text-base">{nationalBestTotTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distancesFromRecords.NR.totTime>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {(results.distancesFromRecords.NR.totTime!=null)?("("+((results.distancesFromRecords.NR.totTime>0)?"+":"")+results.distancesFromRecords.NR.totTime.toFixed(3)+"s)"):""}
                                    </div>
                                </div>}
                                {worldBestTotTime!=null && 
                                <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-65 rounded-sm" title="World Record">WR</div>
                                    <div className="text-base">{worldBestTotTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distancesFromRecords.WR.totTime>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {(results.distancesFromRecords.WR.totTime!=null)?("("+((results.distancesFromRecords.WR.totTime>0)?"+":"")+results.distancesFromRecords.WR.totTime.toFixed(3)+"s)"):""}
                                    </div>
                                </div>}
                            </div>
                        </div>

                        <div className="w-full border-b-2 border-white flex flex-row p-2 pb-4 items-center">
                            <div className="flex flex-col basis-[50%] gap-1">
                                <div className="text-xs font-normal">AVG TIME</div>
                                <div className="text-xl self-center">{results.avgTime.toFixed(3)+"s"}</div>
                            </div>
                            <div className="h-full flex flex-col basis-[50%] items-center border-l-2 border-white border-opacity-30 px-3">
                                {personalBestAvgTime!=null && <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-blueOverBg bg-opacity-50 rounded-sm" title="Personal Best">PB</div>
                                    <div className="text-base">{personalBestAvgTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distancesFromRecords.PB.avgTime>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {(results.distancesFromRecords.PB.avgTime!=null)?("("+((results.distancesFromRecords.PB.avgTime>0)?"+":"")+results.distancesFromRecords.PB.avgTime.toFixed(3)+"s)"):""}
                                    </div>
                                </div>}
                                {nationalBestAvgTime!=null && 
                                <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-50 rounded-sm" title="National Record">NR</div>
                                    <div className="text-base">{nationalBestAvgTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distancesFromRecords.NR.avgTime>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {(results.distancesFromRecords.NR.avgTime!=null)?("("+((results.distancesFromRecords.NR.avgTime>0)?"+":"")+results.distancesFromRecords.NR.avgTime.toFixed(3)+"s)"):""}
                                    </div>
                                </div>}
                                {worldBestAvgTime!=null && <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-65 rounded-sm" title="World Record">WR</div>
                                    <div className="text-base">{worldBestAvgTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distancesFromRecords.WR.avgTime>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {(results.distancesFromRecords.WR.avgTime!=null)?("("+((results.distancesFromRecords.WR.avgTime>0)?"+":"")+results.distancesFromRecords.WR.avgTime.toFixed(3)+"s)"):""}
                                    </div>
                                </div>}
                            </div>
                        </div>

                        <div className="w-full flex flex-row p-2 pb-4 items-center">
                            <div className="flex flex-col basis-[50%] gap-1">
                                <div className="text-xs font-normal">FASTEST WORD</div>
                                <div className="text-xl self-center">{results.fastestWord.time.toFixed(3)+"s"}</div>
                            </div>
                            <div className="h-full flex flex-col basis-[50%] items-center border-l-2 border-white border-opacity-30 px-3">
                                {personalBestSingleWord!=null && <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-blueOverBg bg-opacity-50 rounded-sm" title="Personal Best">PB</div>
                                    <div className="text-base">{personalBestSingleWord.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distancesFromRecords.PB.fastestWord>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {(results.distancesFromRecords.PB.fastestWord!=null)?("("+((results.distancesFromRecords.PB.fastestWord>0)?"+":"")+results.distancesFromRecords.PB.fastestWord.toFixed(3)+"s)"):""}
                                    </div>
                                </div>}
                                {nationalBestSingleWord!=null && <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-50 rounded-sm" title="National Record">NR</div>
                                    <div className="text-base">{nationalBestSingleWord.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distancesFromRecords.NR.fastestWord>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {(results.distancesFromRecords.NR.fastestWord!=null)?("("+((results.distancesFromRecords.NR.fastestWord>0)?"+":"")+results.distancesFromRecords.NR.fastestWord.toFixed(3)+"s)"):""}
                                    </div>
                                </div>}
                                {worldBestSingleWord!=null && <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-65 rounded-sm" title="World Record">WR</div>
                                    <div className="text-base">{worldBestSingleWord.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distancesFromRecords.WR.fastestWord>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {(results.distancesFromRecords.WR.fastestWord!=null)?("("+((results.distancesFromRecords.WR.fastestWord>0)?"+":"")+results.distancesFromRecords.WR.fastestWord.toFixed(3)+"s)"):""}
                                    </div>
                                </div>}
                            </div>
                        </div>
                    </div>

                    {/*Records badges*/}
                    <div className="h-full flex flex-col justify-around animate-record opacity-0 z-0">
                        <div className={"text-base w-[250px] text-nowrap px-3 py-[6px] text-black WR-clip-path "+
                            ((results.distancesFromRecords.WR.totTime<0 || results.distancesFromRecords.WR.totTime==null)?"bg-yellow-gold":((results.distancesFromRecords.NR.totTime<0 || results.distancesFromRecords.NR.totTime==null)?"bg-yellow-gold bg-opacity-80":((results.distancesFromRecords.PB.totTime<0 || results.distancesFromRecords.PB.totTime==null)?"bg-blueOverBg bg-opacity-70":"")))}
                        >{((results.distancesFromRecords.WR.totTime<0 || results.distancesFromRecords.WR.totTime==null)?"NEW WORLD RECORD":((results.distancesFromRecords.NR.totTime<0 || results.distancesFromRecords.NR.totTime==null)?"NEW NATIONAL RECORD":((results.distancesFromRecords.PB.totTime<0 || results.distancesFromRecords.PB.totTime==null)?"NEW PERSONAL BEST":"")))}</div>
                        
                        <div className={"text-base w-[250px] text-nowrap px-3 py-[6px] text-black WR-clip-path "+
                            ((results.distancesFromRecords.WR.avgTime<0 || results.distancesFromRecords.WR.avgTime==null)?"bg-yellow-gold":((results.distancesFromRecords.NR.avgTime<0 || results.distancesFromRecords.NR.avgTime==null)?"bg-yellow-gold bg-opacity-80":((results.distancesFromRecords.PB.avgTime<0 || results.distancesFromRecords.PB.avgTime==null)?"bg-blueOverBg bg-opacity-70":"")))}
                        >{((results.distancesFromRecords.WR.avgTime<0 || results.distancesFromRecords.WR.avgTime==null)?"NEW WORLD RECORD":((results.distancesFromRecords.NR.avgTime<0 || results.distancesFromRecords.NR.avgTime==null)?"NEW NATIONAL RECORD":((results.distancesFromRecords.PB.avgTime<0 || results.distancesFromRecords.PB.avgTime==null)?"NEW PERSONAL BEST":"")))}</div>

                        <div className={"text-base w-[250px] text-nowrap px-3 py-[6px] text-black WR-clip-path "+
                            ((results.distancesFromRecords.WR.fastestWord<0 || results.distancesFromRecords.WR.fastestWord==null)?"bg-yellow-gold":((results.distancesFromRecords.NR.fastestWord<0 || results.distancesFromRecords.NR.fastestWord==null)?"bg-yellow-gold bg-opacity-80":((results.distancesFromRecords.PB.fastestWord<0 || results.distancesFromRecords.PB.fastestWord==null)?"bg-blueOverBg bg-opacity-70":"")))}
                        >{((results.distancesFromRecords.WR.fastestWord<0 || results.distancesFromRecords.WR.fastestWord==null)?"NEW WORLD RECORD":((results.distancesFromRecords.NR.fastestWord<0 || results.distancesFromRecords.NR.fastestWord==null)?"NEW NATIONAL RECORD":((results.distancesFromRecords.PB.fastestWord<0 || results.distancesFromRecords.PB.fastestWord==null)?"NEW PERSONAL BEST":"")))}</div>
                    </div>
                </div>
                
                <div className="self-center">WORDS TYPED</div>

                {//display all words typed and the time in which they have been typed
                    wordTyped
                }
                
                </>}

                {isSoftLoading && <Loading/>}
            </div>
            </>
        )
    }
}

export default FastTyping;