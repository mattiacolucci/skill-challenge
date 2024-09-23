import { cloneElement, useEffect, useState } from "react";
import Container from "../components/Container"
import { countries, skills } from "../assets/data";
import { getRankingPointsLeaderboard, getSkillLeaderboard, getUserData } from "../firebase";
import { prettyPrintParameter } from "../utility";
import { Option, Select } from "@material-tailwind/react";
import { Link } from "react-router-dom";

const Leaderboard=(props)=>{
    const [selectedType,setSelectedType]=useState(0);
    const [menuHover,setMenuHover]=useState(false);

    //indicates parameters selected for the search
    const [selectedLeaderboard,setSelectedLeaderboard]=useState({skill:0,skillsParameters:0,type:"WR",country:""});
    //indicates parameters relative to the current done searched
    const [searchedLeaderboard,setSearchedLeaderboard]=useState({skill:0,skillsParameters:0,type:"WR",country:""});

    //indicates parameters selected for the search
    const [selectedRanking,setSelectedRanking]=useState({type:"WR",country:""});
    //indicates parameters relative to the current done searched
    const [searchedRanking,setSearchedRanking]=useState({type:"WR",country:""});

    /*leaderboard composed this way:
    {skill:
        skillParameter:
            WR:
                {}
            NR:
                Italy:
                    {}
    }
    */
    const [leaderboard,setLeaderboard]=useState({});
    const [leaderboardUsers,setLeaderboardUsers]=useState([]);
    const [isLoading,setIsLoading]=useState(true);

    const [ranking,setRanking]=useState({});

    const countriesData=countries;
    countriesData.sort(function(a, b) {
        return a.name > b.name ? 1 : -1;
    });

    useEffect(()=>{
        const fetchData=async()=>{
            const [response,userData]=await getUserData(props.user.uid);

            if(response){
                //store selected country for both ranking and leaderboard
                const selectedLeaderboardCopy=structuredClone(selectedLeaderboard);
                const selectedRankingCopy=structuredClone(selectedRanking);
                selectedLeaderboardCopy.country=userData.country;
                selectedRankingCopy.country=userData.country;
                setSelectedRanking(selectedRankingCopy);

                //get leaderboard with selected parameters
                await getLeaderboard(selectedLeaderboardCopy,{...userData,id:props.user.uid});
                setSelectedLeaderboard(selectedLeaderboardCopy);
                setIsLoading(false);
            }else{
                navigate("/error",{state:{message:userData}});
                return;
            }

            setIsLoading(false);
        }

        fetchData();
    },[])

    //function to get the leaderboard relative to the selcted skill, parameters and type (World or National)(and country if National)
    //It does not fetch the leaderboard relative to selected parameters from the db, if it has been alread fetched, in order to limit the
    //number of reads
    const getLeaderboard=async(selectedLeaderboard,userToAdd=null)=>{
        const leaderboardUsersCopy=structuredClone(leaderboardUsers);
        const leaderboardCopy=structuredClone(leaderboard);
        var dbResp=[null,null];

        if(userToAdd!=null){
            leaderboardUsersCopy.push(userToAdd);
        }

        //if never fetched leaderboard of selected skill
        //or if never fetched the selcted parameters of the selected skill
        //or if never fetched the selcted type of leaderboard (World or National) of the selected skill and its parameters
        //or if never fetched the National leaderboard of the selected country
        //fetch it.
        //This way we do not get leaderboards alread fetched from the db, in order to limitate the number of reads done.
        //We fetch only first 20 users for each leaderboard
        if(leaderboardCopy[selectedLeaderboard.skill]==undefined || 
            leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.skillsParameters]==undefined ||
            leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.skillsParameters][selectedLeaderboard.type]==undefined ||
            (selectedLeaderboard.type=="NR" && leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.skillsParameters][selectedLeaderboard.type][selectedLeaderboard.country]==undefined)
        ){
            dbResp=await getSkillLeaderboard(selectedLeaderboard.skill,
                selectedLeaderboard.skillsParameters,selectedLeaderboard.country,20,selectedLeaderboard.type);
            
            console.log("Leaderboard read from db");
        }
        //else, the leaderboard type is WR and I have already fetched it

        const resp=dbResp[0];
        const leaderboardDB=dbResp[1];

        //if leaderboard is get correctly
        if(resp==null || resp){
            //get user data of each user in the leaderboard, if never fetched before
            //so loop thorugh all users in the leaderboard, check if it was alread fetched, if it not, fetch it
            for(const key in leaderboardDB){
                for(const key2 in leaderboardDB[key]){
                    if(leaderboardDB[key][key2].user!=null){
                        for(const i in leaderboardDB[key][key2].user){
                            //if we have not already fetched this used data, fetch it
                            if(leaderboardUsersCopy.find(e=>e.id==leaderboardDB[key][key2].user[i])==undefined){
                                const [resp,user]=await getUserData(leaderboardDB[key][key2].user[i]);
                                if(resp){
                                    leaderboardUsersCopy.push({...user,id:leaderboardDB[key][key2].user[i]});
                                }
                            }
                        }
                    }
                }
            }

            //store fetched leaderboard
            if(leaderboardDB!=null){
                //if never fetched a leaderboard of the selected skill, initialize it
                if(leaderboardCopy[selectedLeaderboard.skill]==undefined){
                    leaderboardCopy[selectedLeaderboard.skill]={};
                }

                //if never fetched a leaderboard of the selected skills parameters and skill itself, initialize it
                if(leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.skillsParameters]==undefined){
                    leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.skillsParameters]={};
                }

                //if never fetched a leaderboard WR or NR for the selected skill, initialize it
                if(leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.skillsParameters][selectedLeaderboard.type]==undefined){
                    leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.skillsParameters][selectedLeaderboard.type]={};
                }

                //if fetched NR, since leaderboardDB is not null, this country has never been fetched and so store leaderboard
                //relative to that country
                if(selectedLeaderboard.type=="NR"){
                    leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.skillsParameters][selectedLeaderboard.type][selectedLeaderboard.country]=leaderboardDB[selectedLeaderboard.type];
                }else{
                    //if fetched WR, store the World leaderboard relative to the selected skill
                    leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.skillsParameters][selectedLeaderboard.type]=leaderboardDB[selectedLeaderboard.type];
                }
            }

            console.log(leaderboardCopy);

            setLeaderboardUsers(leaderboardUsersCopy);
            setLeaderboard(leaderboardCopy);
            setSearchedLeaderboard(selectedLeaderboard);
        }else{
            navigate("/error",{state:{message:leaderboard}});
            return;
        }
    }

    const getRanking=async()=>{
        const rankingCopy=structuredClone(ranking);
        const leaderboardUsersCopy=structuredClone(leaderboardUsers);

        //if the selected ranking has never been fetched, fetch it
        if(rankingCopy[selectedRanking.type]==undefined || (selectedRanking.type=="NR" && rankingCopy[selectedRanking.type][selectedRanking.country]==undefined)){
            const [response,rankingLeaderboard]=(selectedRanking.type=="WR")?await getRankingPointsLeaderboard(20):await getRankingPointsLeaderboard(20,null,selectedRanking.country);

            if(response){
                //check if there are users never fetched
                for(const i in rankingLeaderboard){
                    if(leaderboardUsersCopy.find(u=>u.id==rankingLeaderboard[i].id)==undefined){
                        leaderboardUsersCopy.push(rankingLeaderboard[i]);
                    }
                }

                //store the ranking

                if(rankingCopy[selectedRanking.type]==undefined){
                    rankingCopy[selectedRanking.type]=(selectedRanking.type=="WR")?[]:{};
                }

                if(selectedRanking.type=="NR"){
                    rankingCopy[selectedRanking.type][selectedRanking.country]=rankingLeaderboard;
                }else{
                    rankingCopy[selectedRanking.type]=rankingLeaderboard;
                }
            }else{
                navigate("/error",{state:{message:rankingLeaderboard}});
                return;
            }
        }

        setRanking(rankingCopy);
        setLeaderboardUsers(leaderboardUsersCopy);
        setSearchedRanking(selectedRanking);
    }

    const changeSelectedSkill=(newSkill)=>{
        const copy=structuredClone(selectedLeaderboard);
        copy.skill=newSkill;
        setSelectedLeaderboard(copy);
    }

    const changeSelectedType=(newType)=>{
        const copy=structuredClone(selectedLeaderboard);
        copy.type=newType;
        setSelectedLeaderboard(copy);
    }

    const changeSelectedRankingType=(newType)=>{
        const copy=structuredClone(selectedRanking);
        copy.type=newType;
        setSelectedRanking(copy);
    }

    const changeSelectedCountry=(newCountry)=>{
        const copy=structuredClone(selectedLeaderboard);
        copy.country=newCountry;
        setSelectedLeaderboard(copy);
    }

    const changeSelectedRankingCountry=(newCountry)=>{
        const copy=structuredClone(selectedRanking);
        copy.country=newCountry;
        setSelectedRanking(copy);
    }
    
    const changeSelectedSkillParameters=(newParameters)=>{
        const copy=structuredClone(selectedLeaderboard);
        copy.skillsParameters=newParameters;
        setSelectedLeaderboard(copy);
    }

    const changeType=async (newType)=>{
        if(newType!=selectedType){
            setSelectedType(newType);
            switch(newType){
                case 0:
                    await searchLeaderboard();
                    break;
                case 1:
                    await searchRanking();
                    break;
                default:
                    break;
            }
        }
    }

    const searchLeaderboard=async()=>{
        setIsLoading(true);
        await getLeaderboard(selectedLeaderboard);
        setIsLoading(false);
    }

    const searchRanking=async()=>{
        setIsLoading(true);
        await getRanking();
        setIsLoading(false);
    }

    return(
        <Container overflowHideen={true} bg="bg-resultsBg">
            <div className="w-full flex flex-row">
                <div className="text-white text-lg font-default pl-3 basis-[30%] mt-2"><Link to="/">SKILL CHALLENGE</Link></div>
                <div className="text-white text-2xl basis-[40%] text-center mt-3">{selectedType==0?"LEADERBOARD":"RANKING"}</div>
            </div>

            <div className="relative flex flex-row items-center gap-5 bg-tooltipColor rounded-md p-1 px-3">
                <div className="text-white font-default text-[16px] w-[150px] text-center z-[2] cursor-pointer" onClick={()=>changeType(0)}>LEADERBOARD</div>
                <div className="text-white font-default text-[16px] w-[150px] text-center z-[2] cursor-pointer" onClick={()=>changeType(1)}>RANKING</div>

                <div className={"absolute top-[50%] translate-y-[-50%] left-3 h-[70%] bg-mainBlue bg-opacity-40 w-[150px] rounded-md transition-all duration-500 "+((selectedType==0)?"left-3":"left-[182px]")}></div>
            </div>

            {selectedType==0 && //leaderboard
                <div className="w-screen !flex-1 flex flex-row py-4 gap-3 pr-3 overflow-hidden">
                    <div className={(menuHover?"basis-[18%]":"basis-[36px]")+" h-full flex flex-col items-center gap-4 border-r-2 border-white border-opacity-60 p-2 px-3 transition-all duration-300"} onMouseOver={()=>setMenuHover(true)} onMouseLeave={()=>setMenuHover(false)}>
                        <div className={"w-full flex flex-col h-[150px] gap-4 "+(menuHover?"overflow-auto pr-2":"overflow-hidden")}>
                            {skills.map((skill,index)=>{
                                return(
                                    <div className={
                                        (menuHover?"w-full":"w-[36px]")+
                                        " flex flex-row flex-none items-center gap-3 px-2 py-2 rounded-md overflow-hidden cursor-pointer "
                                        +(selectedLeaderboard.skill==index?"bg-mainBlue bg-opacity-30":"bg-white bg-opacity-15")}
                                    onClick={()=>changeSelectedSkill(index)} key={skill.title}>
                                        <i className={"text-white text-[20px] leading-[0] "+skill.icon}></i>
                                        {menuHover && <div className="text-white text-[15px] leading-[15px] font-default line-clamp-1" title={skill.title}>{skill.title}</div>}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="w-full h-[2px] bg-white bg-opacity-70"></div>

                        <div className={(menuHover?"w-full pb-1 overflow-x-auto overflow-y-hidden":"w-[36px]  overflow-hidden")+" flex flex-row gap-2 items-center"}>
                            {menuHover && <>{skills[selectedLeaderboard.skill].skillParametersPossibleValues.map((param,index)=>{
                                return(
                                    <div className={(selectedLeaderboard.skillsParameters==index?"bg-mainBlue bg-opacity-30":"bg-white bg-opacity-15")+" rounded-md flex-none p-1 px-2 text-white text-[15px] cursor-pointer line-clamp-1"}
                                    key={param.join("")+" "+index} onClick={()=>changeSelectedSkillParameters(index)}>
                                        {param.join(" - ")}    
                                    </div>
                                )
                            })}</>}

                            {!menuHover && <div className="w-[36px] bg-mainBlue bg-opacity-30 rounded-md flex-none p-1 px-2 text-white text-[15px] cursor-pointer line-clamp-1">
                                {skills[selectedLeaderboard.skill].skillParametersPossibleValues[selectedLeaderboard.skillsParameters].join(" - ")}    
                            </div>}
                        </div>

                        <div className="w-full h-[2px] bg-white bg-opacity-70"></div>

                        <div className={(menuHover?"w-full":"w-[32px]")+" text-white text-[16px] h-[32px] leading-[32px] rounded-md text-center cursor-pointer "+(selectedLeaderboard.type=="WR"?"bg-mainBlue bg-opacity-30":"bg-white bg-opacity-15")}
                        onClick={()=>changeSelectedType("WR")}>
                            {menuHover?"WORLD":"W"}
                        </div>
                        <div className={(menuHover?"w-full":"w-[32px]")+" text-white text-[16px] h-[32px] leading-[32px] rounded-md text-center cursor-pointer "+(selectedLeaderboard.type=="NR"?"bg-mainBlue bg-opacity-30":"bg-white bg-opacity-15")}
                        onClick={()=>changeSelectedType("NR")}>
                            {menuHover?"NATIONAL":"N"}
                        </div>

                        {selectedLeaderboard.type=="NR" && menuHover &&
                        <Select
                            size="md"
                            label="Select Country"
                            labelProps={{className:"text-white"}}
                            containerProps={{className:"!w-full !min-w-full"}}
                            menuProps={{className:"!max-h-[200px]"}}
                            selected={(element) =>
                            element &&
                            cloneElement(element, {
                                disabled: true,
                                className:
                                "flex items-center opacity-100 px-0 gap-2 pointer-events-none text-white text-opacity-70",
                            })
                            }
                            value={selectedLeaderboard.country}
                            onChange={(value)=>changeSelectedCountry(value)}
                        >
                            {countriesData.map(({ name, isoCountryCode, flags }) => (
                            <Option key={name} value={isoCountryCode} className="flex items-center gap-2">
                                <img
                                src={flags.svg}
                                alt={name}
                                className="h-5 w-5 rounded-full object-cover"
                                />
                                {name}
                            </Option>
                            ))}
                        </Select>}

                        {selectedLeaderboard.type=="NR" && !menuHover && 
                        <img
                            src={countriesData.find(c=>c.isoCountryCode==selectedLeaderboard.country).flags.svg}
                            className="h-5 w-5 rounded-full object-cover"
                        />}

                        <div className="w-full h-[2px] bg-white bg-opacity-70 mt-auto"></div>

                        <div className={
                            (menuHover?"w-full":"w-[36px] py-2")+
                            " flex flex-row items-center justify-center gap-3 p-1 px-2 rounded-md overflow-hidden cursor-pointer bg-mainBlue"}
                        onClick={()=>searchLeaderboard()}>
                            <i className={"fi fi-rr-search text-white text-[20px] leading-[0]"}></i>
                            {menuHover && <div className="text-white font-default line-clamp-1">SEARCH</div>}
                        </div>
                    </div>

                    <div className="relative h-full flex-1 flex flex-row items-center p-2 gap-3">
                        {!isLoading && Object.keys(
                            (searchedLeaderboard.type=="WR")?
                            leaderboard[searchedLeaderboard.skill][searchedLeaderboard.skillsParameters][searchedLeaderboard.type]:  //if type="WR", map leaderboard[skill][WR]
                            leaderboard[searchedLeaderboard.skill][searchedLeaderboard.skillsParameters][searchedLeaderboard.type][searchedLeaderboard.country]  //if type="NR", map leaderboard[skill][NR][country]
                        ).map((skillResultParameter)=>{
                            const currentLeaderboard=(searchedLeaderboard.type=="WR")?
                            leaderboard[searchedLeaderboard.skill][searchedLeaderboard.skillsParameters][searchedLeaderboard.type][skillResultParameter]:   //if type="WR", currentLeaderboard=leaderboard[skill][WR][param]
                            leaderboard[searchedLeaderboard.skill][searchedLeaderboard.skillsParameters][searchedLeaderboard.type][searchedLeaderboard.country][skillResultParameter];  //if type="NR", currentLeaderboard=leaderboard[skill][NR][country][param]

                            return(
                                <div className="h-full flex-1 flex flex-col items-center gap-2 bg-tooltipColor rounded-md p-2" key={skillResultParameter}>
                                    <div className="w-full text-white text-center text-base font-navbar p-1 px-2 bg-mainBlue bg-opacity-30 rounded-tl-md rounded-tr-md">{prettyPrintParameter(skillResultParameter)}</div>
                                    {currentLeaderboard.user!=null && 
                                    currentLeaderboard.user.map((user,index)=>{
                                        const value = currentLeaderboard.record[index];
                                        const userData = leaderboardUsers.filter(u=>u.id==user)[0];

                                        return(
                                            <div className="w-full flex flex-row bg-white bg-opacity-20 items-center justify-center gap-2 p-1 px-3 rounded-md" key={userData.username+" "+skillResultParameter}>
                                                <div className="basis-[22%]">
                                                    <div className={"w-min text-white text-[14px] h-[20px] leading-[20px] text-center rounded-md px-[6px] "+
                                                    (((index+1)>3)?"bg-white bg-opacity-30":(((index+1)==3)?"bg-yellow-gold bg-opacity-30":((index+1)==2)?"bg-gray-500 bg-opacity-60":"bg-yellow-gold bg-opacity-65"))}>{index+1}</div>
                                                </div>
                                                <div className="basis-[56%] flex flex-row gap-4 items-center">
                                                    <img className="w-[20px] h-[20px] rounded-full" src={userData.profileImage}></img>
                                                    <div className="text-white text-[15px] font-navbar line-clamp-1">{userData.username}</div>
                                                </div>
                                                <div className="basis-[22%] flex flex-row items-center justify-end gap-2">
                                                    {index==0 && 
                                                    <div className="text-[9px] w-[20px] h-[20px] text-center leading-[20px] rounded-sm bg-yellow-gold bg-opacity-50">
                                                        {searchedLeaderboard.type}
                                                    </div>}
                                                    <div className="text-white text-right text-opacity-80 font-default">{value}</div>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {currentLeaderboard.user==null &&
                                    <div className="text-white text-opacity-70">NO RESULTS FOUND</div>
                                    }
                                </div>
                            )
                        })}

                        {isLoading &&
                            <i className="fi fi-tr-loading absolute left-[50%] tanslate-x-[-50%] text-[40px] text-white leading-[0] origin-center animate-rotation"></i>
                        }
                    </div>

                </div>
            }

            {selectedType==1 && //ranking
                <div className="w-screen !flex-1 flex flex-row py-4 gap-3 pr-3 overflow-hidden">
                    <div className={(menuHover?"basis-[18%]":"basis-[36px]")+" h-full flex flex-col items-center gap-4 border-r-2 border-white border-opacity-60 p-2 px-3 transition-all duration-300"} onMouseOver={()=>setMenuHover(true)} onMouseLeave={()=>setMenuHover(false)}>
                        <div className={(menuHover?"w-full":"w-[32px]")+" text-white text-[16px] h-[32px] leading-[32px] rounded-md text-center cursor-pointer "+(selectedRanking.type=="WR"?"bg-mainBlue bg-opacity-30":"bg-white bg-opacity-15")}
                        onClick={()=>changeSelectedRankingType("WR")}>
                            {menuHover?"WORLD":"W"}
                        </div>
                        <div className={(menuHover?"w-full":"w-[32px]")+" text-white text-[16px] h-[32px] leading-[32px] rounded-md text-center cursor-pointer "+(selectedRanking.type=="NR"?"bg-mainBlue bg-opacity-30":"bg-white bg-opacity-15")}
                        onClick={()=>changeSelectedRankingType("NR")}>
                            {menuHover?"NATIONAL":"N"}
                        </div>

                        {selectedRanking.type=="NR" && menuHover &&
                        <Select
                            size="md"
                            label="Select Country"
                            labelProps={{className:"text-white"}}
                            containerProps={{className:"!w-full !min-w-full"}}
                            menuProps={{className:"!top-[50px] !max-h-[200px]"}}
                            selected={(element) =>
                            element &&
                            cloneElement(element, {
                                disabled: true,
                                className:
                                "flex items-center opacity-100 px-0 gap-2 pointer-events-none text-white text-opacity-70",
                            })
                            }
                            value={selectedRanking.country}
                            onChange={(value)=>changeSelectedRankingCountry(value)}
                        >
                            {countriesData.map(({ name, isoCountryCode, flags }) => (
                            <Option key={name} value={isoCountryCode} className="flex items-center gap-2">
                                <img
                                src={flags.svg}
                                alt={name}
                                className="h-5 w-5 rounded-full object-cover"
                                />
                                {name}
                            </Option>
                            ))}
                        </Select>}

                        {selectedRanking.type=="NR" && !menuHover && 
                        <img
                            src={countriesData.find(c=>c.isoCountryCode==selectedRanking.country).flags.svg}
                            className="h-5 w-5 rounded-full object-cover"
                        />}

                        <div className="w-full h-[2px] bg-white bg-opacity-70 mt-auto"></div>

                        <div className={
                            (menuHover?"w-full":"w-[36px] py-2")+
                            " flex flex-row items-center justify-center gap-3 p-1 px-2 rounded-md overflow-hidden cursor-pointer bg-mainBlue"}
                        onClick={()=>searchRanking()}>
                            <i className={"fi fi-rr-search text-white text-[20px] leading-[0]"}></i>
                            {menuHover && <div className="text-white font-default line-clamp-1">SEARCH</div>}
                        </div>
                    </div>

                    <div className="relative w-[450px] ml-[calc(50%-225px-60px)] flex flex-col gap-2 items-center bg-tooltipColor p-3 rounded-md">
                        {!isLoading && <>
                            <div className="w-full text-white text-center text-base font-navbar p-1 px-2 bg-mainBlue bg-opacity-30 rounded-tl-md rounded-tr-md">{searchedRanking.type=="WR"?"World Ranking":(countries.find(c=>c.isoCountryCode==searchedRanking.country).name+" Ranking")}</div>
                            {(
                                (searchedRanking.type=="WR")?
                                ranking[searchedRanking.type]:  //if type="WR", map ranking[WR]
                                ranking[searchedRanking.type][searchedRanking.country]  //if type="NR", map ranking[NR][country]
                            ).map((user,index)=>{

                                return(
                                    <div className="w-full flex flex-row bg-white bg-opacity-20 items-center gap-2 p-1 px-3 rounded-md" key={user.user}>
                                        <div className="basis-[20%]">
                                            <div className={"w-min text-white text-[14px] h-[20px] leading-[20px] text-center rounded-md px-[6px] "+
                                            (((index+1)>3)?"bg-white bg-opacity-30":(((index+1)==3)?"bg-yellow-gold bg-opacity-30":((index+1)==2)?"bg-gray-500 bg-opacity-60":"bg-yellow-gold bg-opacity-65"))}>{index+1}</div>
                                        </div>
                                        <div className="basis-[60%] flex flex-row gap-4 items-center">
                                            <img className="w-[20px] h-[20px] rounded-full" src={user.profileImage}></img>
                                            <div className="text-white text-[15px] font-navbar line-clamp-1">{user.user}</div>
                                        </div>
                                        <div className="basis-[20%] flex flex-row items-center justify-end">
                                            <div className="w-[60px] h-[22px] px-2 flex flex-row gap-1 items-center text-white bg-mainBlue bg-opacity-60 rounded-md">
                                                <i className="fi fi-sr-bahai text-blueOverBg text-[9px] p-0"></i>
                                                <div className="text-[12px]">{user.rankingPoints}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            {(searchedRanking.type=="WR")?
                            (ranking[searchedRanking.type].length==0 &&<div className="text-white text-opacity-70">NO RESULTS FOUND</div>):
                            (ranking[searchedRanking.type][searchedRanking.country].length==0 &&<div className="text-white text-opacity-70">NO RESULTS FOUND</div>)
                            }
                            </>
                        }

                        {isLoading &&
                            <i className="fi fi-tr-loading absolute top-[50%] tanslate-y-[-50%] text-[40px] text-white leading-[0] origin-center animate-rotation"></i>
                        }
                    </div>
                </div>
            }

        </Container>
    )
}

export default Leaderboard;