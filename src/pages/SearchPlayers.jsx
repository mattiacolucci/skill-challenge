
import { useRef, useState } from "react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";
import { searchUsers } from "../firebase";
import Notice from "../components/Notice";

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
            console.log("www")
            //if it is, set the search results to the previous searched players which match the current string
            setSearchResults(searchedPlayers.filter(p=>p.username.toLowerCase().includes(player.toLowerCase())));
            setShowResults(true);
            setLoading(false);
            return;
        }

        const [resp,users] = await searchUsers(player);
        if(resp){
            //if the search is successful, update the searched strings and players
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
                <div className="absolute top-[50%] translate-y-[-50%] flex flex-col items-center p-4 gap-3 animate-popUp glass-effect rounded-md">
                    {searchResults.length==0 && <div className="text-white text-2xl font-default">NO PLAYERS FOUND WITH THIS USERNAME</div>}
                    
                    {searchResults.map((userData,i)=>{
                        return <div className="w-full flex flex-row bg-white bg-opacity-20 items-center gap-2 p-1 px-3 rounded-md" key={userData.username}>
                            <img className="w-[20px] h-[20px] rounded-full" src={userData.profileImage}></img>
                            <div className="text-white text-[17px] font-navbar line-clamp-1">{userData.username}</div>
                            <div className="ml-3 h-[22px] px-2 text-white text-[11px] leading-[22px] rounded-sm bg-mainBlue bg-opacity-60" title="Ranking Points">
                                <i className="fi fi-sr-bahai text-blueOverBg text-[9px] !leading-0 p-0"></i>
                                &ensp;
                                {userData.rankingPoints}
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