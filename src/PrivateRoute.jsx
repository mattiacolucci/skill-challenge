import { cloneElement } from "react";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Loading from "./components/Loading";

const PrivateRoute=(props)=>{
    const { pending, isSignedIn, user, auth } = useAuth();

    if(pending){
        return <Loading/>;
    }else{
        if(!isSignedIn){
            return <Login/>
        }else{
            return cloneElement(props.children, { isSignedIn, user });
        }
    }
}

export default PrivateRoute;