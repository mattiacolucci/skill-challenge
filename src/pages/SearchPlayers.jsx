
import { useState } from "react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";

const SearchPlayers=(props)=>{
    const [player,setPlayer]=useState("");
    const [loading,setLoading]=useState(false);

    return(
        <Container overflowHideen={true} bg="bg-resultsBg">
            <Navbar isLogged={props.isSignedIn} user={props.user}/>
            <div className={"absolute top-[50%] translate-y-[-50%] flex items-center gap-4 px-4 py-2 bg-white bg-opacity-10 rounded-md w-[60%] text-white text-opacity-70 "+(loading?"animate-fadeUpOut":"animate-popUp")} key={loading}>
                <input type="text" value={player} onChange={(e)=>setPlayer(e.target.value)} placeholder="Search players by username" className="flex-1 bg-transparent font-navbar text-lg outline-none placeholder:text-white placeholder:text-opacity-60"/>
                <i class="fi fi-br-search text-xl bg-white bg-opacity-15 rounded-md px-2 py-2 leading-[0] cursor-pointer transition-all hover:scale-[1.1]" onClick={()=>setLoading(true)}></i>
            </div>

            {loading &&
                <i className="absolute fi fi-tr-loading text-4xl text-white leading-[0] origin-center animate-rotation"></i>
            }
        </Container>
    );
}

export default SearchPlayers;