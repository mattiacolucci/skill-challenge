import { cloneElement, useEffect, useState } from "react";
import Container from "../components/Container"
import { skills } from "../assets/data";
import { getSkillLeaderboard, getUserData } from "../firebase";
import { prettyPrintParameter } from "../utility";
import { useCountries } from "use-react-countries";
import { Option, Select } from "@material-tailwind/react";

const Leaderboard=(props)=>{
    const [selectedType,setSelectedType]=useState(0);
    const [menuHover,setMenuHover]=useState(false);

    //indicates parameters selected for the search
    const [selectedLeaderboard,setSelectedLeaderboard]=useState({skill:0,skillsParameters:0,type:"WR",country:""});
    //indicates parameters relative to the current done searched
    const [searchedLeaderboard,setSearchedLeaderboard]=useState({skill:0,skillsParameters:0,type:"WR",country:""});

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

    const {countries}=useCountries();
    countries.sort(function(a, b) {
        return a.name > b.name ? 1 : -1;
    });

    useEffect(()=>{
        const fetchData=async()=>{
            const [response,userData]=await getUserData(props.user.uid);

            if(response){
                const selectedLeaderboardCopy=structuredClone(selectedLeaderboard);
                selectedLeaderboardCopy.country=userData.country;

                await getLeaderboard(selectedLeaderboardCopy,{...userData,id:props.user.uid});
                setSelectedLeaderboard(selectedLeaderboardCopy);
                setIsLoading(false);
            }else{
                console.log(userData);
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
        //or if never fetched the selcted type of leaderboard (World or National) of the selected skill
        //or if never fetched the National leaderboard of the selected country
        //fetch it.
        //This way we do not get leaderboards alread fetched from the db, in order to limitate the number of reads done.
        //We fetch only first 20 users for each leaderboard
        if(leaderboardCopy[selectedLeaderboard.skill]==undefined || 
            leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.type]==undefined ||
            (selectedLeaderboard.type=="NR" && leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.type][selectedLeaderboard.country]==undefined)
        ){
            dbResp=await getSkillLeaderboard(props.user.uid,selectedLeaderboard.skill,
                skills[selectedLeaderboard.skill].skillParametersPossibleValues[selectedLeaderboard.skillsParameters],
                selectedLeaderboard.country,20,selectedLeaderboard.type);
            
            console.log("Leaderboard read from db");
        }
        //else, the leaderboard type is WR and I have already fetched it

        const resp=dbResp[0];
        const leaderboardDB=dbResp[1];

        if(resp==null || resp){
            //get user data of each user
            for(const key in leaderboardDB){
                for(const key2 in leaderboardDB[key]){
                    if(leaderboardDB[key][key2].user!=null){
                        for(const i in leaderboardDB[key][key2].user){
                            //if we have not already fetched this used data, fetch it
                            if(!leaderboardUsersCopy.find(e=>e.id==leaderboardDB[key][key2].user[i])){
                                const user=await getUserData(leaderboardDB[key][key2].user[i]);
                                leaderboardUsersCopy.push({...user,id:leaderboardDB[key][key2].user[i]});
                            }
                        }
                    }
                }
            }

            //store fetched leaderboard
            if(leaderboardDB!=null){
                //if never fetched this skill, initialize it
                if(leaderboardCopy[selectedLeaderboard.skill]==undefined){
                    leaderboardCopy[selectedLeaderboard.skill]={};
                }

                //if never fetched WR or NR for the skill, initialize it
                if(leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.type]==undefined){
                    leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.type]={};
                }

                //if fetched NR, since leaderboardDB is not null, this country has never been fetched and so store leaderboard
                //relative to that country
                if(selectedLeaderboard.type=="NR"){
                    leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.type][selectedLeaderboard.country]=leaderboardDB[selectedLeaderboard.type];
                }else{
                    //if fetched WR, store the World leaderboard relative to the selected skill
                    leaderboardCopy[selectedLeaderboard.skill][selectedLeaderboard.type]=leaderboardDB[selectedLeaderboard.type];
                }
            }

            setLeaderboardUsers(leaderboardUsersCopy);
            setLeaderboard(leaderboardCopy);
            setSearchedLeaderboard(selectedLeaderboard);
        }else{
            console.log(leaderboard);
        }
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

    const changeSelectedCountry=(newCountry)=>{
        const copy=structuredClone(selectedLeaderboard);
        copy.country=newCountry;
        setSelectedLeaderboard(copy);
    }

    const searchLeaderboard=async()=>{
        setIsLoading(true);
        await getLeaderboard(selectedLeaderboard);
        setIsLoading(false);
    }

    return(
        <Container overflowHideen={true} bg="bg-resultsBg">
            <div className="text-white text-2xl mt-3">LEADERBOARD</div>

            <div className="relative flex flex-row items-center gap-5 bg-tooltipColor rounded-md p-1 px-3">
                <div className="text-white font-default text-[16px] w-[150px] text-center z-[2] cursor-pointer" onClick={()=>setSelectedType(0)}>LEADERBOARD</div>
                <div className="text-white font-default text-[16px] w-[150px] text-center z-[2] cursor-pointer" onClick={()=>setSelectedType(1)}>RANKING</div>

                <div className={"absolute top-[50%] translate-y-[-50%] left-3 h-[70%] bg-mainBlue bg-opacity-40 w-[150px] rounded-md transition-all duration-500 "+((selectedType==0)?"left-3":"left-[182px]")}></div>
            </div>

            {selectedType==0 && //leaderboard
                <div className="w-screen mt-2 !flex-1 flex flex-row py-4 gap-3 pr-3">
                    <div className={(menuHover?"basis-[18%]":"basis-[36px]")+" h-full flex flex-col items-center gap-4 border-r-2 border-white border-opacity-60 p-2 px-3 transition-all duration-300"} onMouseOver={()=>setMenuHover(true)} onMouseLeave={()=>setMenuHover(false)}>
                        {skills.map((skill,index)=>{
                            return(
                                <div className={
                                    (menuHover?"w-full":"w-[36px] py-2")+
                                    " flex flex-row items-center gap-3 p-1 px-2 rounded-md overflow-hidden cursor-pointer "
                                    +(selectedLeaderboard.skill==index?"bg-mainBlue bg-opacity-30":"bg-white bg-opacity-15")}
                                onClick={()=>changeSelectedSkill(index)} key={skill.title}>
                                    <i className={"text-white text-[20px] leading-[0] "+skill.icon}></i>
                                    {menuHover && <div className="text-white font-default line-clamp-1">{skill.title}</div>}
                                </div>
                            )
                        })}

                        <div className="w-full h-[2px] bg-white bg-opacity-70 mt-auto"></div>

                        <div className={(menuHover?"w-full":"w-[36px]")+" text-white text-[18px] h-[36px] leading-[36px] rounded-md text-center cursor-pointer "+(selectedLeaderboard.type=="WR"?"bg-mainBlue bg-opacity-30":"bg-white bg-opacity-15")}
                        onClick={()=>changeSelectedType("WR")}>
                            {menuHover?"WORLD":"W"}
                        </div>
                        <div className={(menuHover?"w-full":"w-[36px]")+" text-white text-[18px] h-[36px] leading-[36px] rounded-md text-center cursor-pointer "+(selectedLeaderboard.type=="NR"?"bg-mainBlue bg-opacity-30":"bg-white bg-opacity-15")}
                        onClick={()=>changeSelectedType("NR")}>
                            {menuHover?"NATIONAL":"N"}
                        </div>

                        {selectedLeaderboard.type=="NR" && menuHover &&
                        <Select
                            size="lg"
                            label="Select Country"
                            labelProps={{className:"text-white"}}
                            containerProps={{className:"!w-full !min-w-full"}}
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
                            {countries.map(({ name, flags }) => (
                            <Option key={name} value={name} className="flex items-center gap-2">
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
                            src={countries.filter(c=>c.name==selectedLeaderboard.country)[0].flags.svg}
                            className="h-5 w-5 rounded-full object-cover"
                        />}

                        <div className="w-full h-[2px] bg-white bg-opacity-70"></div>

                        <div className={
                            (menuHover?"w-full":"w-[36px] py-2")+
                            " flex flex-row items-center justify-center gap-3 p-1 px-2 rounded-md overflow-hidden cursor-pointer bg-mainBlue"}
                        onClick={()=>searchLeaderboard()}>
                            <i className={"fi fi-rr-search text-white text-[20px] leading-[0]"}></i>
                            {menuHover && <div className="text-white font-default line-clamp-1">SEARCH</div>}
                        </div>
                    </div>

                    <div className="relative h-full flex-1 flex flex-row items-center p-2 gap-3">
                        {!isLoading && searchedLeaderboard.type=="WR" && Object.keys(leaderboard[searchedLeaderboard.skill][searchedLeaderboard.type]).map((skillResultParameter)=>{
                            return(
                                <div className="h-full flex-1 flex flex-col items-center gap-2 bg-tooltipColor rounded-md p-2" key={skillResultParameter}>
                                    <div className="w-[80%] text-white text-center text-base font-navbar p-1 px-2 bg-mainBlue bg-opacity-40 rounded-md">{prettyPrintParameter(skillResultParameter)}</div>
                                    {leaderboard[searchedLeaderboard.skill][searchedLeaderboard.type][skillResultParameter].user!=null && 
                                    leaderboard[searchedLeaderboard.skill][searchedLeaderboard.type][skillResultParameter].user.map((user,index)=>{
                                        const value = leaderboard[searchedLeaderboard.skill][searchedLeaderboard.type][skillResultParameter].record[index];
                                        const userData = leaderboardUsers.filter(u=>u.id==user)[0];

                                        return(
                                            <div className="w-full flex flex-row bg-white bg-opacity-20 items-center justify-between p-1 px-3 rounded-md">
                                                <div className={"text-white text-[14px] h-[20px] leading-[20px] text-center rounded-md px-[6px] "+
                                                (((index+1)>3)?"bg-white bg-opacity-30":(((index+1)==3)?"bg-yellow-gold bg-opacity-30":((index+1)==2)?"bg-gray-700 bg-opacity-50":"bg-yellow-gold bg-opacity-65"))}>{index+1}</div>
                                                <div className="flex flex-row gap-4 items-center">
                                                    <img className="w-[20px] h-[20px] rounded-full" src={userData.profileImage}></img>
                                                    <div className="text-white font-navbar">{userData.username}</div>
                                                </div>
                                                <div className="text-white text-opacity-70 font-default">{value}</div>
                                            </div>
                                        )
                                    })}

                                    {leaderboard[searchedLeaderboard.skill][searchedLeaderboard.type][skillResultParameter].user==null &&
                                    <div className="text-white text-opacity-70">NO RESULTS FOUND</div>
                                    }
                                </div>
                            )
                        })}

                        {!isLoading && searchedLeaderboard.type=="NR" && Object.keys(leaderboard[searchedLeaderboard.skill][searchedLeaderboard.type][searchedLeaderboard.country]).map((skillResultParameter)=>{
                            return(
                                <div className="h-full flex-1 flex flex-col items-center gap-2 bg-tooltipColor rounded-md p-2" key={skillResultParameter}>
                                    <div className="w-[80%] text-white text-center text-base font-navbar p-1 px-2 bg-mainBlue bg-opacity-40 rounded-md">{prettyPrintParameter(skillResultParameter)}</div>
                                    {leaderboard[searchedLeaderboard.skill][searchedLeaderboard.type][searchedLeaderboard.country][skillResultParameter].user!=null && 
                                    leaderboard[searchedLeaderboard.skill][searchedLeaderboard.type][searchedLeaderboard.country][skillResultParameter].user.map((user,index)=>{
                                        const value = leaderboard[searchedLeaderboard.skill][searchedLeaderboard.type][searchedLeaderboard.country][skillResultParameter].record[index];
                                        const userData = leaderboardUsers.filter(u=>u.id==user)[0];

                                        return(
                                            <div className="w-full flex flex-row bg-white bg-opacity-20 items-center justify-between p-1 px-3 rounded-md">
                                                <div className={"text-white text-[14px] h-[20px] leading-[20px] text-center rounded-md px-[6px] "+
                                                (((index+1)>3)?"bg-white bg-opacity-30":(((index+1)==3)?"bg-yellow-gold bg-opacity-30":((index+1)==2)?"bg-gray-700 bg-opacity-50":"bg-yellow-gold bg-opacity-65"))}>{index+1}</div>
                                                <div className="flex flex-row gap-4 items-center">
                                                    <img className="w-[20px] h-[20px] rounded-full" src={userData.profileImage}></img>
                                                    <div className="text-white font-navbar">{userData.username}</div>
                                                </div>
                                                <div className="text-white text-opacity-70 font-default">{value}</div>
                                            </div>
                                        )
                                    })}

                                    {leaderboard[searchedLeaderboard.skill][searchedLeaderboard.type][searchedLeaderboard.country][skillResultParameter].user==null &&
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

        </Container>
    )
}

export default Leaderboard;