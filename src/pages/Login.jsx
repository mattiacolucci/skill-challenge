import React from 'react';
import {signInWithGooglePopup}  from '../firebase.js';

const Login = () => {

    // Sign in with google
    const signin = async () => {
        try{
            const response = await signInWithGooglePopup();
            console.log(response);
        }catch(e){
            console.log(e);
        }
    }
    
    return (
        <div>
            <center>
                <button style={{"marginTop" : "200px"}} 
                onClick={()=>signin()}>Sign In with Google</button>
            </center>
        </div>
    );
}

export default Login;