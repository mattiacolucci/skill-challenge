import { useEffect, useState } from "react";
import Container from "../components/Container"
import Navbar from "../components/Navbar"
import Loading from "../components/Loading";
import { initializeGiveItATry } from "../firebase";

const GiveItATry=(props)=>{
    const [loading,setLoading]=useState(false);

    useEffect(()=>{
        const fetchData=async()=>{

        }

        fetchData();
    },[]);

    const prova = async()=>{
        console.log("clicked");
        const [p,k] = await initializeGiveItATry();

        if(p){
            console.log("OOKKK");
        }else{
            console.log(k);
        }
    }

    if(loading){
        return <Loading/>;
    }else{
        return(
            <Container bg="bg-resultsBg" overflowHidden={true}>
                <Navbar isLogged={props.isSignedIn} user={props.user}/>

                <button onClick={()=>prova()}>PROVA</button>
    
            </Container>
        );
    }
}

export default GiveItATry;