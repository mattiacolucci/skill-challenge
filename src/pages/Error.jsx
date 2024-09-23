import { Link, useLocation } from "react-router-dom";
import Container from "../components/Container"
import { useEffect } from "react";

const Error=()=>{
    const location=useLocation();
    

    useEffect(()=>{
        console.log(location.state.message);
    },[])

    return(
        <Container overflowHidden={true} bg="bg-resultsBg">
            <div className="w-full flex flex-row h-[8vh] items-center border-b-2 border-white">
                <div className="text-white text-lg font-default pl-3 basis-[30%]"><Link to="/">SKILL CHALLENGE</Link></div>
            </div>

            <div className="w-full !flex-1 flex flex-row items-center gap-5">
                <div className="h-full basis-[70%] bg-tooltipColor error-container-path flex flex-col items-start justify-center gap-3 pl-10 z-[2] animate-fadeLeft">
                    <div className="text-white text-3xl">SOMETHING GONE WRONG!</div>
                    <div className="text-white font-navbar text-base">An error have been occured.<br/>Please try again.</div>
                </div>

                <i className="text-mainBlue text-opacity-40 fi fi-br-not-found text-[200px] rotate-45 ml-[-200px] animate-popUp"></i>
            </div>
        </Container>
    )
}

export default Error;