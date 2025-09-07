
import { useRef, useState } from "react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";
import { searchUsers } from "../firebase";
import Notice from "../components/Notice";
import UserLevel from "../components/UserLevel";
import { skills } from "../assets/data";
import { prettyPrintParameter } from "../utility";

const SearchPlayers=(props)=>{
    const [player,setPlayer]=useState("");
    const [searchResults,setSearchResults]=useState([]);
    const [searchedStrings,setSearchedStrings]=useState([]);
    const [searchedPlayers,setSearchedPlayers]=useState([]);
    const [showResults,setShowResults]=useState(false);
    const [loading,setLoading]=useState(false);
    const noticeRef=useRef();

    //search players in the db
    const search = async ()=>{
        //check if the searched string is not empty
        if(player==""){
            noticeRef.current.triggerNotice("Please enter a username to search");
            return;
        }

        setLoading(true);
        setShowResults(false);
        setSearchResults([]);

        //check if the current search string has been already searched
        if(searchedStrings.includes(player)){
            //if it is, set the search results to the previous searched players which match the current string
            setSearchResults(searchedPlayers.filter(p=>p.username.toLowerCase().includes(player.toLowerCase())));
            setShowResults(true);
            setLoading(false);
            return;
        }

        var [resp,users] = await searchUsers(player);
        if(resp){ //if the search is successful, update the searched strings and players
            users = users.map(u=>{return{...u,showDetails:false}});
            
            setSearchedStrings(currentSearchedStrings=>[...currentSearchedStrings,player]);
            setSearchedPlayers(currentSearchedPlayers=>[...currentSearchedPlayers,...users]);
            setSearchResults(users);
            setShowResults(true);
        }else{  //else, display an error notice
            noticeRef.current.triggerNotice("Error searching players. Please try again");
        }
        setLoading(false);
    }

    const goBack = ()=>{
        setShowResults(false);
        setPlayer("");
    }

    const showDetails=(index)=>{
        const searchResultsCopy=structuredClone(searchResults);
        searchResultsCopy[index].showDetails=!searchResultsCopy[index].showDetails;
        setSearchResults(searchResultsCopy);
    }


    return(
        <Container bg="bg-resultsBg" overflowHidden={true}>
            <Navbar isLogged={props.isSignedIn} user={props.user}/>
            <div className="text-white font-default text-3xl mt-8">SEARCH PLAYERS</div>
            {!showResults && <div className={"absolute top-[50%] translate-y-[-50%] flex items-center gap-4 px-4 py-2 bg-white bg-opacity-10 rounded-md w-[60%] text-white text-opacity-70 "+(loading?"animate-fadeUpOut":"animate-popUp")} key={loading}>
                <input type="text" value={player} onChange={(e)=>setPlayer(e.target.value)} placeholder="Search players by username" className="flex-1 bg-transparent font-navbar text-lg outline-none placeholder:text-white placeholder:text-opacity-60"/>
                <i className="fi fi-br-search text-xl bg-white bg-opacity-15 rounded-md px-2 py-2 leading-[0] cursor-pointer transition-all hover:scale-[1.1]" onClick={()=>search()}></i>
            </div>}

            {loading && <div className="absolute flex top-[50%] translate-y-[-50%]">
                <i className="relative fi fi-tr-loading text-4xl text-white leading-[0] origin-center animate-rotation"></i>
                </div>
            }

            {showResults && !loading && 
                <div className="absolute top-[20vh] flex flex-col items-center p-4 gap-3 animate-popUp glass-effect rounded-md">
                    {searchResults.length==0 && <div className="text-white text-2xl font-default">NO PLAYERS FOUND WITH THIS USERNAME</div>}
                    
                    <div className="text-white text-xl font-default">PLAYERS FOR:"{player}"</div>

                    {searchResults.map((userData,i)=>{
                        return <div className={"flex flex-col bg-white bg-opacity-20 p-2 px-3 rounded-md transition-all "+(userData.showDetails?"h-max gap-2":"")} key={userData.username}>
                            <div className="flex flex-row items-center gap-2">
                                <UserLevel className={"!flex-row"} displayUserInfo={true} username={userData.username} userProfileImage={userData.profileImage} userLv={userData.lv} expValue={userData.exp} rankingPoints={userData.rankingPoints}/>
                                <div className="text-white text-sm cursor-pointer ml-3 leading-[0]" onClick={()=>showDetails(i)}>{userData.showDetails?"▲":"▼"}</div>
                            </div>

                            {userData.showDetails && <div className="w-full h-[1px] bg-white bg-opacity-40 mt-1"></div>}
                            <div className={"flex flex-col gap-2 transition-all overflow-hidden animate-popUp "+(userData.showDetails?"h-max p-2":"w-[1px] scale-y-0 h-[1px]")}>
                                <div className="w-full flex flex-row items-center gap-2">
                                    <div className="w-4 h-[2px] bg-white"></div>
                                    <div className="text-white text-base font-default opacity-90 ml-2">AVG PERFORMANCES</div>
                                    <div className="flex-1 h-[2px] bg-white"></div>
                                </div>
                                {Object.keys(userData.avgPerformances).map((skill)=>{
                                    return (<>
                                    <div className="text-white text-base font-navbar px-2 py-1 bg-mainBlue bg-opacity-60 rounded-md">{skill}</div>
                                    <div className="w-full flex flex-row items-center gap-2">
                                        {Object.keys(userData.avgPerformances[skill]).map((param)=>{
                                            const skillIndex = skills.findIndex(s => s.title==skill);
                                            const skillPerformanceParameterIndex = skills[skillIndex].skillResultsParameters.indexOf(skills[skillIndex].skillPerformanceParameter);
                                            const skillPerformanceParameterMetric = skills[skillIndex].skillResultsParametersMetrics[skillPerformanceParameterIndex];

                                            return <div className="flex flex-col items-center gap-2 bg-white bg-opacity-20 p-2 rounded-md" title={prettyPrintParameter(skills[skillIndex].skillPerformanceParameter)} key={userData.username+skill+param}>
                                                <div className="text-white text-sm font-navbar" title={prettyPrintParameter(skills[skillIndex].skillParameters.join("  -  "))}>{param}</div>
                                                <div className="text-white text-base">{userData.avgPerformances[skill][param].value+""+skillPerformanceParameterMetric}</div>
                                            </div>
                                        })}
                                    </div>
                                    </>)
                                })}
                            </div>
                        </div>
                    })}

                    <button className="w-max mt-3 bg-blue-700 text-white text-base px-3 py-1 rounded-sm transition-all hover:scale-[1.1]" onClick={()=>goBack()}>BACK ➣</button>
                </div>}

            <Notice ref={noticeRef} bg="bg-tooltipColor"/>
        </Container>
    );
}

export default SearchPlayers;