import { useEffect, useRef, useState } from "react";
import words_list from "../../assets/words.json";
import Chronometer from "../Chronometer";

const FastTyping=(props)=>{
    //user settings
    const language="IT";
    const personalBestSingleWord=1.000;  //personal best single word in sec
    const personalBestTotTime=10.000;   //personal best tot time in sec
    const personalBestAvgTime=1.200  //personal best avg time in sec

    //national bests
    const nationalBestSingleWord=0.876;
    const nationalBestTotTime=2.876;
    const nationalBestAvgTime=1.098;

    //world bests
    const worldBestSingleWord=0.672;
    const worldBestTotTime=2.387;
    const worldBestAvgTime=0.876;

    //params
    const num_words=props.skillsParameters[0];
    const num_chars=props.skillsParameters[1];
    
    const inputRef=useRef();
    const chronometerRef=useRef();
    const resultsRef=useRef();
    const [isLoading,setIsLoading]=useState(true);
    const [wordInput,setWordInput]=useState("");
    const [wordsToWrite,setWordsToWrite]=useState([]);
    const [currentWordToWrite,setCurrentWordToWrite]=useState("");
    const [chronoTimeLastWord,setChronoTimeLastWord]=useState(0);
    const [gameEnded,setGameEnded]=useState(false);
    const [results,setResults]=useState({});

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

    //function called every time the input word changes
    const changeInputWord=(word)=>{
        //if the last char written is not a space
        if(word.slice(-1)!=" "){
            //set the iput value to the value itself but wth the first letter caps
            setWordInput(word.charAt(0).toUpperCase() + word.slice(1));
        }else{  //if the last char written is a space
            //we need to check if the written word is equals to the one that has to be written

            //we first cut the last char which is a space
            word=word.substring(0, word.length - 1).toLowerCase();

            //then chack if the word writte is correct
            if(word==wordsToWrite[currentWordToWrite].word){  //if the written word is correct
                //the word is correct so we can go over with the next word
                const currentTime=chronometerRef.current.getTime();
                const wordTypeTime=(currentTime-chronoTimeLastWord);
                var words=structuredClone(wordsToWrite);
                words[currentWordToWrite]["status"]="correct";
                words[currentWordToWrite]["time"]=(wordTypeTime/1000);

                //check if the player did its personal best time for single word type
                if(wordTypeTime<personalBestSingleWord){
                    words[currentWordToWrite]["personalBest"]=true;
                }

                setWordsToWrite(words);
                setCurrentWordToWrite(currentWordToWrite+1);  //update next word
                setWordInput("");  //clean input field
                setChronoTimeLastWord(currentTime);   //update time in which you write correctly the last word

                //if the current word is the last one, the game is over
                if(currentWordToWrite==num_words-1){
                    console.log("game end");

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
                    const res={
                        totalTime:totalTime,distanceTotTimeFromPB:totalTime-personalBestTotTime,
                        distanceTotTimeFromNR:totalTime-nationalBestTotTime, distanceTotTimeFromWR:totalTime-worldBestTotTime,
                        avgTime:avgTime,distanceAvgTimeFromPB:avgTime-personalBestAvgTime,
                        distanceAvgTimeFromNR:avgTime-nationalBestAvgTime, distanceAvgTimeFromWR: avgTime-worldBestAvgTime,
                        fastestWord:fastestWord, distanceFastestWordFromPB:fastestWord.time-personalBestSingleWord,
                        distanceFastestWordFromNR:fastestWord.time-nationalBestSingleWord, distanceFastestWordFromWR: fastestWord.time-worldBestSingleWord
                    };

                    console.log(wordsCopy);
                    setResults(res);

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

    const goResults=()=>{
        //go to results screen
        resultsRef.current.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
    }

    if(!isLoading){
        return(
            <>
            <div className="relative h-[100vh] w-screen flex flex-col items-center justify-center overflow-hidden gap-5">
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
                    gameEnded && <button className="text-base px-3 py-2 ml-auto bg-blue-700 self-end rounded-sm mt-auto" onClick={goResults}>CONTNUE ➣</button>}
                </div>

                <div className="w-screen px-4 flex flex-row gap-2 mt-auto mb-3 select-none content-start">
                    {wordsToWrite.filter(w=>w.status=="correct").map((word,index)=>{
                        return(
                            <div className="basis-[10%] flex flex-col gap-2 items-center">
                                <div className={"font-navbar text-base "+((index>6)?"text-white text-opacity-70":"text-blueOverBg")}>{word.time.toFixed(3)+"s"}</div>
                                <div className={"w-full h-1 rounded-md "+((index>6)?"bg-white bg-opacity-70":"bg-blueOverBg")}></div>
                                <div className="font-navbar text-white text-base">{word.word.charAt(0).toUpperCase() + word.word.slice(1)}</div>
                                {word.personalBest && <div className="text-sm px-2 py-1 bg-yellow-gold bg-opacity-60 rounded-md">PB</div>}
                            </div>
                        )})
                    }
                </div>
            </div>
            
            {/*game results*/}

            {gameEnded && <div className="w-screen h-[100vh] bg-[#0c0b1f] text-white font-navbar font-semibold flex flex-col gap-5" ref={resultsRef}>
                <div className="font-default text-3xl self-center mt-5">RESULTS</div>
                <div className="h-min w-screen flex flex-row items-center">
                    <div className="h-full w-[450px] flex flex-col gap-1 bg-white bg-opacity-10 rounded-md px-3 py-1 origin-center ml-[calc(100vw/2-225px)] flex-none">

                        <div className="w-full border-b-2 border-white flex flex-row p-2 pb-4 items-center">
                            <div className="flex flex-col basis-[50%] gap-1">
                                <div className="text-xs font-normal">TOTAL TIME</div>
                                <div className="text-xl self-center">{results.totalTime.toFixed(3)+"s"}</div>
                            </div>
                            <div className="h-full flex flex-col basis-[50%] items-center border-l-2 border-white border-opacity-30 px-3">
                                <div className="w-full flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-blueOverBg bg-opacity-50 rounded-sm" title="Personal Best">PB</div>
                                    <div className="text-base">{personalBestTotTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distanceTotTimeFromPB>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {"("+((results.distanceTotTimeFromPB>0)?"+":"")+results.distanceTotTimeFromPB.toFixed(3)+"s)"}
                                    </div>
                                </div>
                                <div className="w-full flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-50 rounded-sm" title="National Record">NR</div>
                                    <div className="text-base">{nationalBestTotTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distanceTotTimeFromNR>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {"("+((results.distanceTotTimeFromNR>0)?"+":"")+results.distanceTotTimeFromNR.toFixed(3)+"s)"}
                                    </div>
                                </div>
                                <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-65 rounded-sm" title="World Record">WR</div>
                                    <div className="text-base">{worldBestTotTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distanceTotTimeFromWR>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {"("+((results.distanceTotTimeFromWR>0)?"+":"")+results.distanceTotTimeFromWR.toFixed(3)+"s)"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full border-b-2 border-white flex flex-row p-2 pb-4 items-center">
                            <div className="flex flex-col basis-[50%] gap-1">
                                <div className="text-xs font-normal">AVG TIME</div>
                                <div className="text-xl self-center">{results.avgTime.toFixed(3)+"s"}</div>
                            </div>
                            <div className="h-full flex flex-col basis-[50%] items-center border-l-2 border-white border-opacity-30 px-3">
                                <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-blueOverBg bg-opacity-50 rounded-sm" title="Personal Best">PB</div>
                                    <div className="text-base">{personalBestAvgTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distanceAvgTimeFromPB>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {"("+((results.distanceAvgTimeFromPB>0)?"+":"")+results.distanceAvgTimeFromPB.toFixed(3)+"s)"}
                                    </div>
                                </div>
                                <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-50 rounded-sm" title="National Record">NR</div>
                                    <div className="text-base">{nationalBestAvgTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distanceAvgTimeFromNR>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {"("+((results.distanceAvgTimeFromNR>0)?"+":"")+results.distanceAvgTimeFromNR.toFixed(3)+"s)"}
                                    </div>
                                </div>
                                <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-65 rounded-sm" title="World Record">WR</div>
                                    <div className="text-base">{worldBestAvgTime.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distanceAvgTimeFromWR>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {"("+((results.distanceAvgTimeFromWR>0)?"+":"")+results.distanceAvgTimeFromWR.toFixed(3)+"s)"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full flex flex-row p-2 pb-4 items-center">
                            <div className="flex flex-col basis-[50%] gap-1">
                                <div className="text-xs font-normal">FASTEST WORD</div>
                                <div className="text-xl self-center">{results.fastestWord.time.toFixed(3)+"s"}</div>
                            </div>
                            <div className="h-full flex flex-col basis-[50%] items-center border-l-2 border-white border-opacity-30 px-3">
                                <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-blueOverBg bg-opacity-50 rounded-sm" title="Personal Best">PB</div>
                                    <div className="text-base">{personalBestSingleWord.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distanceFastestWordFromPB>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {"("+((results.distanceFastestWordFromPB>0)?"+":"")+results.distanceFastestWordFromPB.toFixed(3)+"s)"}
                                    </div>
                                </div>
                                <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-50 rounded-sm" title="National Record">NR</div>
                                    <div className="text-base">{nationalBestSingleWord.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distanceFastestWordFromNR>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {"("+((results.distanceFastestWordFromNR>0)?"+":"")+results.distanceFastestWordFromNR.toFixed(3)+"s)"}
                                    </div>
                                </div>
                                <div className="flex flex-row justify-center items-center gap-2">
                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] bg-yellow-gold bg-opacity-65 rounded-sm" title="World Record">WR</div>
                                    <div className="text-base">{worldBestSingleWord.toFixed(3)+"s"}</div>
                                    <div className={"text-[10px] "+((results.distanceFastestWordFromWR>0)?"text-yellow-gold":"text-mainGreen")}>
                                        {"("+((results.distanceFastestWordFromWR>0)?"+":"")+results.distanceFastestWordFromWR.toFixed(3)+"s)"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/*Records badges*/}
                    <div className="h-full flex flex-col justify-around">
                        <div className={"text-base w-[250px] text-nowrap px-3 py-[6px] text-black WR-clip-path "+
                            ((results.distanceTotTimeFromWR<0)?"bg-yellow-gold":((results.distanceTotTimeFromNR<0)?"bg-yellow-gold bg-opacity-80":((results.distanceTotTimeFromPB<0)?"bg-blueOverBg bg-opacity-70":"")))}
                        >{((results.distanceTotTimeFromWR<0)?"NEW WORLD RECORD":((results.distanceTotTimeFromNR<0)?"NEW NATIONAL RECORD":((results.distanceTotTimeFromPB<0)?"NEW PERSONAL BEST":"")))}</div>
                        
                        <div className={"text-base w-[250px] text-nowrap px-3 py-[6px] text-black WR-clip-path "+
                            ((results.distanceTotTimeFromWR<0)?"bg-yellow-gold":((results.distanceAvgTimeFromNR<0)?"bg-yellow-gold bg-opacity-80":((results.distanceAvgTimeFromPB<0)?"bg-blueOverBg bg-opacity-70":"")))}
                        >{((results.distanceAvgTimeFromWR<0)?"NEW WORLD RECORD":((results.distanceAvgTimeFromNR<0)?"NEW NATIONAL RECORD":((results.distanceAvgTimeFromPB<0)?"NEW PERSONAL BEST":"")))}</div>

                        <div className={"text-base w-[250px] text-nowrap px-3 py-[6px] text-black WR-clip-path "+
                            ((results.distanceFastestWordFromWR<0)?"bg-yellow-gold":((results.distanceFastestWordFromNR<0)?"bg-yellow-gold bg-opacity-80":((results.distanceFastestWordFromPB<0)?"bg-blueOverBg bg-opacity-70":"")))}
                        >{((results.distanceFastestWordFromWR<0)?"NEW WORLD RECORD":((results.distanceFastestWordFromNR<0)?"NEW NATIONAL RECORD":((results.distanceFastestWordFromPB<0)?"NEW PERSONAL BEST":"")))}</div>
                    </div>
                    
                </div>
            </div>}
            </>
        )
    }
}

export default FastTyping;