const calculateMaxValueExpByLv=(level)=>{
    //this function calculates the max level of experiemnce that has to be reached to upgrade to the next level
    //ths fomula is inspred by the sigmoid function. The maximum value reachable is 100k. Thanks to this formula
    //the maximum value is low in early levels (6k for lv 10, 14k for lv 20, ...) and increase this way until reached lv 40
    //where the max value of exp is 50k. From there ths growth will be much faster, but it will never go over 100k
    return Math.round(100000/(1+Math.pow(Math.E,-0.09*(level-40))));
}

//function which calulate the nex exp value and level given the skill,its parameters, its result, current level and current exp value
const calculateEarnedExpSkill=(skill,skillParameters,level,results,exp)=>{
    var maxExpValue=calculateMaxValueExpByLv(level);
    var expString="";  //string which express how the new earned exp is distribuited
    const oldExp=exp;

    switch(skill){
        case "FAST TYPING":
            //the division 0.5/avgTime is 1 if avgTime is 0.5; more avgTime is high, more the division->0
            //this way the less is avgTime, the more exp it will earned
            //if avgTime is 0.5 it will be earned 1500 exp
            const avgTimeEarnedExp=Math.round(1500*(0.5/results.avgTime));
            expString+="Avg Time: +"+avgTimeEarnedExp+" exp";
            exp+=avgTimeEarnedExp;

            //this works as the previous formula. The less is the time of the fastestWord and the more exp it will be taken
            //if fastest word is 0.4s it will be earned 1000 exp
            const fastestWordEarnedExp=Math.round(1000*(0.4/results.fastestWord.time));
            expString+="\nFastest Word: +"+fastestWordEarnedExp+" exp";
            exp+=fastestWordEarnedExp;
            
            //bonus exp based on how much words and chars have been used during the skill
            //the bonus is donated only if 500 earned exp are reached. If there are reached less the bonus is not assigned
            //since the player has done a bad performance
            if(exp-oldExp>=500){
                const bonusExp=skillParameters[0]*20+skillParameters[1]*20;  //20 exp is assigned per each word and per each char x word
                expString+="\nBonus: +"+bonusExp+" exp";
                exp+=bonusExp;   
            }
            
            break;
        default: 
            break;
    }

    const earnedExp=Math.round(exp-oldExp);

    //check if a new lv has been reached
    while(exp>=maxExpValue){
        exp=exp-maxExpValue;
        level=level+1;
        maxExpValue=calculateMaxValueExpByLv(level);
    }

    return [Math.round(exp),level,earnedExp,expString];
}

export {calculateMaxValueExpByLv, calculateEarnedExpSkill};