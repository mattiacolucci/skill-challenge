import React, { cloneElement, useRef, useState } from 'react';
import Notice from '../components/Notice.jsx';
import { checkUserExists, createUserAccount, signInWithGooglePopup } from '../firebase.js';
import { useNavigate } from 'react-router-dom';
import { Option, Select } from '@material-tailwind/react';
import { useCountries } from "use-react-countries";
import { getCountryByIp } from '../utility.js';

const Login = () => {
    const [country,setCountry]=useState("");
    const noticeRef=useRef();
    const navigate=useNavigate();
    const {countries}=useCountries();
    countries.sort(function(a, b) {
        return a.name > b.name ? 1 : -1;
    });

    
    const signin = async () => {
        //make auth with google
        const googleResponse = await googleSignIn();

        //check if the authed user exists in the db and so if this is its first login
        if(await checkUserExists()){
            //if login went good and user exists display the notice and after them, go to the home
            noticeRef.current.triggerNotice("Welcome "+googleResponse.user.displayName+"!",()=>navigate("/"));
        }else{
            //if user does not exists, get country by the ip and add it to the db
            const countryName=await getCountryByIp();

            const [userCreated,message]=await createUserAccount(countryName);

            if(userCreated){
                noticeRef.current.triggerNotice("Welcome "+googleResponse.user.displayName+"!",()=>navigate("/"));
            }else{
                noticeRef.current.triggerNotice("Login failed, please try again");
            }
        }
    }

    // Sign in with google
    const googleSignIn=async ()=>{
        try{
            const response = await signInWithGooglePopup();
            return response;
        }catch(e){
            noticeRef.current.triggerNotice("Login Failed");
            return false;
        }
    }
    
    return (
        <div className="relative w-screen h-screen flex flex-col items-center bg-darkBlue overflow-hidden">
            <div className='h-[30vh] text-white text-3xl font-default pt-10'>SKILL CHALLENGE</div>
            <div className='w-[300px] flex flex-col gap-4 glass-effect items-center p-3 pb-5 rounded-md'>
                <div className='text-white text-xl font-default'>LOGIN</div>
                <input type='text' className='w-[90%] px-4 py-[6px] outline-none rounded-md bg-white bg-opacity-60 font-navbar text-sm
                 placeholder:text-black placeholder:text-opacity-60' placeholder='Username'/>
                <input type='password' className='w-[90%] px-4 py-[6px] outline-none rounded-md bg-white bg-opacity-60 font-navbar text-sm
                 placeholder:text-black placeholder:text-opacity-60' placeholder='Password'/>
                
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
                </Select>

                <div className='w-full flex flex-row items-center gap-2'>
                    <div className='flex-1 h-[2px] bg-white bg-opacity-40'></div>
                    <div className='text-white text-sm'>Or</div>
                    <div className='flex-1 h-[2px] bg-white bg-opacity-40'></div>
                </div>

                <div className='bg-white bg-opacity-50 text-black p-2 rounded-md flex flex-row items-center gap-2 font-navbar cursor-pointer' onClick={()=>signin()}>Sign In WIth Google <i class="fi fi-brands-google leading-[0]"></i></div>
            </div>

            <Notice ref={noticeRef}/>
        </div>
    );
}

export default Login;