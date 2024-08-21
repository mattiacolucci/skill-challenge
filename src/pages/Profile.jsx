import { useEffect, useState } from "react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";
import { parseJwt } from "../utility";
import Loading from "../components/Loading";
import { getUserData } from "../firebase";
import UserLevel from "../components/UserLevel";

const Profile=(props)=>{
    const [isLoading,setIsLoading]=useState(true);
    const [userData,setUserdata]=useState({});

    useEffect(()=>{
        const fetchUserData=async ()=>{
            const [response,userData] = await getUserData(props.user.uid);
            
            if(response){
                setUserdata({name:props.user.displayName,profileImage:props.user.photoURL,...userData});
            }else{
                console.log(userData);
            }

            setIsLoading(false);
        }

        fetchUserData();
    })

    if(isLoading){
        return <Loading/>
    }else{
        return(
            <Container bg="bg-resultsBg">
                <Navbar isLogged={props.isSignedIn} user={props.user}/>
                
                <div className="w-screen flex flex-row items-center mt-5">
                    <div className="basis-[33%] flex flex-col items-center gap-3">
                        <img src={userData.profileImage} className="w-[80px] h-[80px] rounded-full border-2 border-blueOverBg"/>
                        <div className="text-white font-default text-2xl w-full line-clamp-1 text-center">{userData.name.toUpperCase()}</div>
                        <UserLevel className="items-center" userLv={userData.lv} expValue={userData.exp} userProfileImage={userData.profileImage}
                        username={userData.name}/>
                    </div>
                </div>
            </Container>
        )
    }
}

export default Profile;