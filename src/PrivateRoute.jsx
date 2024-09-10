import { cloneElement } from "react";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Loading from "./components/Loading";
import { useParams } from "react-router-dom";

const PrivateRoute=(props)=>{
    const { pending, isSignedIn, user, auth } = useAuth();
    const routerParams=useParams();

    if(pending){
        return <Loading/>;
    }else{
        if(!isSignedIn){
            return <Login/>
        }else{
            return cloneElement(props.children, { isSignedIn, user, routerParams });
        }
    }
}

export default PrivateRoute;