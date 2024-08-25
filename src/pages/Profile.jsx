import { cloneElement, useEffect, useRef, useState } from "react";
import Container from "../components/Container";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import { useCountries } from "use-react-countries";
import { getUserData, signOutWithGoogle, updateUserCountry, updateUserUsername } from "../firebase";
import UserLevel from "../components/UserLevel";
import Notice from "../components/Notice";
import { useNavigate } from "react-router-dom";
import { Option, Select } from "@material-tailwind/react";

const Profile=(props)=>{
    const [isLoading,setIsLoading]=useState(true);
    const [userData,setUserdata]=useState({});

    //edit country
    const [showCountryChange,setShowCountryChange]=useState(false);
    const [newCountry,setNewCountry]=useState("");

    //edit username
    const [showEditUsername,setShowEditUsername]=useState(false);
    const [newUsername,setNewUsername]=useState("");

    const noticeRef=useRef();
    const navigate=useNavigate();
    const {countries}=useCountries();
    countries.sort(function(a, b) {
        return a.name > b.name ? 1 : -1;
    });

    useEffect(()=>{
        const fetchUserData=async ()=>{
            const [response,userData] = await getUserData(props.user.uid);
            
            if(response){
                setUserdata({name:props.user.displayName,profileImage:props.user.photoURL,...userData});
                setNewCountry(userData.country);
                setNewUsername(userData.username);
            }else{
                console.log(userData);
            }

            setIsLoading(false);
        }

        fetchUserData();
    },[])

    const signOut=async ()=>{
        try{
            noticeRef.current.triggerNotice("Signing out...",async()=>{await signOutWithGoogle();navigate("/")});
        }catch(e){
            noticeRef.current.triggerNotice(e.message);
        }
    }

    const changeCountry=async()=>{
        const [resp,message]=await updateUserCountry(newCountry);
        
        if(resp){
            setUserdata({...userData,country:newCountry});
            noticeRef.current.triggerNotice("Country updated!");
        }else{
            noticeRef.current.triggerNotice("Update failed");
        }

        setShowCountryChange(false);
    }

    const changeUsername=async()=>{
        const [resp,message]=await updateUserUsername(newUsername);
        
        if(resp){
            setUserdata({...userData,username:newUsername});
            noticeRef.current.triggerNotice("Country updated!");
        }else{
            noticeRef.current.triggerNotice("Update failed");
        }

        setShowCountryChange(false);
    }

    if(isLoading){
        return <Loading/>
    }else{
        return(
            <Container bg="bg-resultsBg" overflowHidden={true}>
                <Navbar isLogged={props.isSignedIn} user={props.user}/>
                
                <div className="w-screen flex flex-row mt-5">
                    <div className="basis-[33%] flex flex-col items-center gap-4">
                        <img src={userData.profileImage} className="w-[80px] h-[80px] rounded-full border-2 border-blueOverBg"/>
                        <div className="text-white font-default text-2xl w-full line-clamp-1 text-center">{userData.username.toUpperCase()}</div>

                        {showEditUsername && <input type="text" className="w-[50%] pl-3 rounded-sm outline-none bg-white bg-opacity-50" value={newUsername} onChange={(e)=>setNewUsername(e.target.value)}/>}

                        {showEditUsername && 
                        <div className="flex flex-row items-center gap-3">
                            <div className="flex flex-row items-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainBlue" onClick={()=>changeUsername()}>
                                <i className="fi fi-rr-pen-square leading-[0] text-[8px]"></i>
                                Save username
                            </div>

                            <div className="flex flex-row items-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainRed" onClick={()=>setShowEditUsername(false)}>
                                <i className="fi fi-br-cross leading-[0] text-[8px]"></i>
                                Cancel
                            </div>
                        </div>}
                        
                        <div className="flex flex-row gap-3 items-center">
                            <img src={countries.filter(c=>c.name==userData.country)[0].flags.svg} className="h-[30px] w-[30px] rounded-full object-cover border-2 border-mainBlue"/>
                            <div className="text-white text-sm font-navbar">{userData.country.toUpperCase()}</div>
                        </div>

                        {showCountryChange && 
                        <Select
                            size="lg"
                            label="Select Country"
                            labelProps={{className:"text-white"}}
                            containerProps={{className:"!w-[50%] !min-w-[50%]"}}
                            menuProps={{className:"!top-[50px] !max-h-[150px]"}}
                            selected={(element) =>
                            element &&
                            cloneElement(element, {
                                disabled: true,
                                className:
                                "flex items-center opacity-100 px-0 gap-2 pointer-events-none text-white text-opacity-70",
                            })
                            }
                            value={newCountry}
                            onChange={(value)=>setNewCountry(value)}
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

                        {showCountryChange && 
                        <div className="flex flex-row items-center gap-3">
                            <div className="flex flex-row items-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainBlue" onClick={()=>changeCountry()}>
                                <i className="fi fi-rr-pen-square leading-[0] text-[8px]"></i>
                                Save country
                            </div>

                            <div className="flex flex-row items-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainRed" onClick={()=>setShowCountryChange(false)}>
                                <i className="fi fi-br-cross leading-[0] text-[8px]"></i>
                                Cancel
                            </div>
                        </div>}

                        <UserLevel className="items-center" userLv={userData.lv} expValue={userData.exp} userProfileImage={userData.profileImage}
                        username={userData.name}/>

                        <div className="text-white font-default text-2xl mt-7">RECORDS</div>

                        <div className="h-[150px] p-2 w-[200px] flex flex-col gap-2 items-center overflow-auto">
                            {Object.keys(userData.records).map((skill)=>{
                                return(<>
                                    <div className="w-full flex flex-row items-center gap-2">
                                        <div className="text-white text-opacity-50 font-default self-start text-sm">{skill}</div>
                                        <div className="flex-1 h-[2px] bg-white bg-opacity-40"></div>
                                    </div>
                                        {userData.records[skill].map((record)=>{
                                            return (
                                            <div className="flex flex-row items-center gap-2">
                                                <div className={"text-[9px] w-[20px] h-[20px] text-center leading-[20px] "+((record.recordType=="PB")?"bg-blueOverBg bg-opacity-50":((record.recordType=="NR")?"bg-yellow-gold bg-opacity-50":"bg-yellow-gold bg-opacity-65"))}>
                                                    {record.recordType}
                                                </div>
                                                
                                                <div className="text-white text-opacity-60 text-xs">{record.date.toDate().toISOString().split('T')[0]}</div>
                                            </div>
                                            )
                                        })}
                                </>)
                            })}
                        </div>
                    </div>

                    <div className="basis-[33%] flex flex-col items-center gap-4">
                        
                    </div>

                    <div className="basis-[33%] flex flex-col items-center gap-4">
                        <div className="text-white text-2xl font-default">USER SETTINGS</div>

                        {!showEditUsername && 
                        <div className="flex flex-row w-[120px] items-center justify-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainBlue" onClick={()=>setShowEditUsername(true)}>
                            <i className="fi fi-rr-pen-square leading-[0] text-[8px]"></i>
                            Edit username
                        </div>}

                        {!showCountryChange && 
                        <div className="flex flex-row w-[120px] items-center justify-center gap-2 text-white font-navbar text-xs cursor-pointer p-1 rounded-sm bg-mainBlue" onClick={()=>setShowCountryChange(true)}>
                            <i className="fi fi-rr-pen-square leading-[0] text-[8px]"></i>
                            Edit country
                        </div>}

                        <button className="bg-mainRed text-white p-1 px-3 font-navbar outline-none rounded-sm" onClick={()=>signOut()}>Sign Out</button>
                    </div>

                </div>

                <Notice ref={noticeRef}/>
            </Container>
        )
    }
}

export default Profile;