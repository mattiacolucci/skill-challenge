import { skillAvgPerformanceRanking } from "./assets/data";

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


//function used to parse a jwt in a json
function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

//get country name by ip of the client
const getCountryByIp=async ()=>{
    const req = await fetch("https://ipapi.co/json/");
    const data = await req.json();
    return data.country;
}

const prettyPrintDate=(date)=>{
    return date.getFullYear() +"-"+(((date.getMonth()+1) < 10)?"0":"") + (date.getMonth()+1) +"-"+ ((date.getDate() < 10)?"0":"") + date.getDate();
}

const prettyPrintDateAndHours=(date)=>{
    return date.getFullYear() +"-"+(((date.getMonth()+1) < 10)?"0":"") + (date.getMonth()+1) +"-"+ ((date.getDate() < 10)?"0":"") + date.getDate() + "  "+
    ((date.getHours() < 10)?"0":"") + date.getHours() +":"+ ((date.getMinutes() < 10)?"0":"") + date.getMinutes() +":"+ ((date.getSeconds() < 10)?"0":"") + date.getSeconds();

}

const prettyPrintParameter=(param)=>{
    param=param.split(/(?=[A-Z])/).join(" ").toLowerCase();
    const words = param.split(" ");

    for (let i = 0; i < words.length; i++) {
        if(words[i][0]!=undefined){
            words[i] = words[i][0].toUpperCase() + words[i].substr(1);
        }
    }

    return words.join(" ");
}

const TooltipChartCustom=(props)=>{
    return(
        <div className="text-[10px] font-light bg-tooltipColor p-1 px-[6px] rounded-sm" >
            {props.payload.map(v => 
                <p style={{color:v.color,opacity:0.8}}>
                    <span className="font-navbar font-semibold">{prettyPrintParameter(v.dataKey)+":"}</span>
                    <span className="opacity-70">{" "+v.value}</span>
                </p>)
            }
            <div className="text-[10px] text-white text-opacity-65 font-navbar font-semibold">{(props.payload.length!=0)?prettyPrintDate(props.payload[0].payload.date.toDate()):""}</div>
        </div>
    )
}

function numberMod(n, m) {
    return ((n % m) + m) % m;
}

function calculateAvgAccumulately(avg,n,xn){
    return parseFloat(((avg*n+xn)/(n+1)).toFixed(3));
}

function calculateEstimatedAvgPerformanceBasedOnRankingPoints(rankingPoints,skillTitle,skillParameters){
    const ranges=skillAvgPerformanceRanking[skillTitle].ranges;
    const relativeParameter=skillAvgPerformanceRanking[skillTitle].relativeParameter;
    const additioner=skillAvgPerformanceRanking[skillTitle].additioner;

    var avgPerformance;

    //cicle for all ranges finding in which one contains current ranking point
    for(const i in ranges){
        const rangeMin=ranges[i].rangeRankingPoints[0];
        const rangeMax=ranges[i].rangeRankingPoints[1];

        if(rangeMin<=rankingPoints && rankingPoints<=rangeMax){
            //we found the ranking range and so calculate the avg performance
            //if the found range is a single range, we got the avg performance, else we have to calculate it
            if(ranges[i].singleRange){
                avgPerformance=ranges[i].avgPerformance;
                break;
            }else{
                //the range represents multiple ranges
                avgPerformance=ranges[i].avgPerformance - Math.trunc((rankingPoints-rangeMin)/50)*ranges[i].subtractator;
                break;
            }
        }
    }

    //update the avgPerformance found if skills parameters are different from the one used to caluclate it
    const addition = skillParameters.map((p,index)=>(p-relativeParameter[index])*additioner[index]);
    avgPerformance=avgPerformance+addition.reduce((a,b)=>a+b,0);

    return avgPerformance;
}

const filterUserLeaderboard=(array)=>{
    var arrayFiltered=[];

    if(array==[]){
        return arrayFiltered;
    }

    for(const i in array){
        if(!arrayFiltered.find(g=>g.user==array[i].data().user)){
            arrayFiltered.push({...array[i].data(),id:array[i].id});
        }
    }

    return arrayFiltered;
}

const skillParametersJoinPrint=(skillParameters)=>{
    return skillParameters.join("-");
}

const calculateCurrentRoundTournament=(games)=>{
    return parseInt(Object.keys(games).sort().reverse()[0]);
}

//calculates number of rounds for each tournaments this way: log_2(numUsers)=Nrounds
//so we have that numUsers=2^Nrounds
const calculateNumRoundsTournaments=(numUsers)=>{
    return Math.log2(numUsers);
}

export {calculateMaxValueExpByLv, calculateEarnedExpSkill, parseJwt, getCountryByIp, TooltipChartCustom, prettyPrintDate, 
    prettyPrintParameter, numberMod, calculateAvgAccumulately, calculateEstimatedAvgPerformanceBasedOnRankingPoints,
    filterUserLeaderboard, skillParametersJoinPrint, calculateCurrentRoundTournament, prettyPrintDateAndHours, calculateNumRoundsTournaments};