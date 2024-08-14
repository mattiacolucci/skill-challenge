import { useEffect, useRef, useState } from "react";
import words_list from "../../assets/words.json";
import Chronometer from "../Chronometer";

const FastTyping=(props)=>{
    const language="IT";
    const num_words=props.skillsParameters[0];
    const num_chars=props.skillsParameters[1];
    const inputRef=useRef();
    const chronometerRef=useRef();
    const [isLoading,setIsLoading]=useState(true);
    const [wordInput,setWordInput]=useState("");
    const [wordsToWrite,setWordsToWrite]=useState([]);
    const [currentWordToWrite,setCurrentWordToWrite]=useState("");

    useEffect(()=>{
        //take all words of the language with length equals to the selected num of chars that the words has to have
        var allWords=words_list[language][num_chars];
        var wordsToPlay=[]

        //get "num_words" random words of length "num_chars"
        for(var i=0;i<num_words;i++){
            const selectedWord=Math.floor(Math.random()*allWords.length);
            wordsToPlay.push({word:allWords[selectedWord], state:"not done"});
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
                var words=wordsToWrite;
                words[currentWordToWrite]["status"]="correct";
                setWordsToWrite(words);
                setCurrentWordToWrite(currentWordToWrite+1);  //update next word
                setWordInput("");  //clean input field

                //if the current word is the last one, the game is over
                if(currentWordToWrite==num_words-1){
                    console.log("game end");

                    //stop the chronometer
                    chronometerRef.current.startAndStop();

                    //disable input
                    inputRef.current.disabled=true;
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

    if(!isLoading){
        return(
            <>
            <div className="w-[400px] h-[200px] flex flex-row flex-wrap content-start gap-3 overflow-hidden bg-white bg-opacity-70 p-3 rounded-md">
                {wordsToWrite.map((word,index)=>{
                    //color of the word
                    var wordColor="";

                    if(currentWordToWrite==index){   //blue if is the current one and you are writing
                        wordColor="border-b-2 border-blue-700";
                    }

                    switch(word.status){
                        case "correct":  //green if it was correct
                            wordColor="border-b-2 border-green-600";
                            break;
                        case "wrong":  //red if it was not correct
                            wordColor="border-b-2 border-red-600";
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
            
            <Chronometer ref={chronometerRef}/>
            </>
        )
    }
}

export default FastTyping;