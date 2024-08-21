import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

const Navbar=(props)=>{
    return(
        <div className="w-screen h-[8vh] border-b-2 border-b-white flex items-center px-3 bg-blue-950 bg-opacity-30 gap-4">
            <Link className="text-lg text-white select-none" to="/">SKILL CHALLENGE</Link>
            {props.isLogged &&
                <Link to="/profile" className="ml-auto"><div className="flex items-center h-[30px] gap-3 bg-white bg-opacity-30 px-3 rounded-md">
                    <img src={props.user.photoURL} className="w-[20px] h-[20px] rounded-full"/>
                    <div className="text-sm text-white select-none max-w-[150px] line-clamp-1 font-default">{props.user.displayName.toUpperCase()}</div>
                </div></Link>
            }
            {!props.isLogged && <>
            <Link to="/login" className="ml-auto"><button className="h-[27px] rounded-md bg-blueOverBg bg-opacity-50 text-white font-navbar px-2 text-sm">Sign in</button></Link>
            </>}
        </div>
    )
}

export default Navbar;