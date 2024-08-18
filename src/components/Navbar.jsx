import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

const Navbar=()=>{
    return(
        <div className="w-screen h-[8vh] border-b-2 border-b-white flex items-center px-3 bg-blue-950 bg-opacity-30 gap-4">
            <Link className="text-lg text-white select-none" to="/">SKILL CHALLENGE</Link>
            <div className="ml-auto flex items-center h-[30px] gap-3 bg-white bg-opacity-30 px-3 rounded-md">
                <div className="text-blue-700 text-base">
                    <FontAwesomeIcon icon={faUser}/>
                </div>
                <div className="text-base text-white select-none">User</div>
            </div>
            <button className="h-[27px] rounded-md bg-darkBlue text-white font-navbar px-2 text-sm">Sign up</button>
            <button className="h-[27px] rounded-md bg-blueOverBg bg-opacity-50 text-white font-navbar px-2 text-sm">Sign in</button>
        </div>
    )
}

export default Navbar;