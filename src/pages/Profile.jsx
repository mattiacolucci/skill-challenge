import { useEffect, useState } from "react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import { useCountries } from "use-react-countries";
import { getUserData } from "../firebase";
import UserLevel from "../components/UserLevel";

const Profile=(props)=>{
    const [isLoading,setIsLoading]=useState(true);
    const [userData,setUserdata]=useState({});
    const {countries}=useCountries();
    countries.sort(function(a, b) {
        return a.name > b.name ? 1 : -1;
    });

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
                    <div className="basis-[33%] flex flex-col items-center gap-4">
                        <img src={userData.profileImage} className="w-[80px] h-[80px] rounded-full border-2 border-blueOverBg"/>
                        <div className="text-white font-default text-2xl w-full line-clamp-1 text-center">{userData.name.toUpperCase()}</div>

                        <div className="flex flex-row gap-3 items-center">
                            <img src={countries.filter(c=>c.name==userData.country)[0].flags.svg} className="h-[30px] w-[30px] rounded-full object-cover border-2 border-mainBlue"/>
                            <div className="text-white text-sm font-navbar">{userData.country.toUpperCase()}</div>
                        </div>

                        <UserLevel className="items-center" userLv={userData.lv} expValue={userData.exp} userProfileImage={userData.profileImage}
                        username={userData.name}/>

                        {false && 
                        <Select
                            size="lg"
                            label="Select Country"
                            labelProps={{className:"text-white"}}
                            containerProps={{className:"!w-[90%] !min-w-[90%]"}}
                            menuProps={{className:"!top-[50px] !max-h-[150px]"}}
                            selected={(element) =>
                            element &&
                            cloneElement(element, {
                                disabled: true,
                                className:
                                "flex items-center opacity-100 px-0 gap-2 pointer-events-none text-white text-opacity-70",
                            })
                            }
                            value={country}
                            onChange={(value)=>setCountry(value)}
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
                    </div>
                </div>
            </Container>
        )
    }
}

export default Profile;