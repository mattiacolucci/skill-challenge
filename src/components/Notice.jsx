import { forwardRef, useImperativeHandle, useState } from "react";

const Notice=forwardRef((props,ref)=>{
    const [text,setText]=useState("");
    const [showNotice,setShowNotice]=useState(false);

    //expose triggerNotice function to components which uses this notice
    useImperativeHandle(ref,()=>({

        triggerNotice(text,callbackFunction=()=>{}){
            //set the notice text and show it
            setText(text);
            setShowNotice(true);

            //after 4 secs the notice disappear and callback is executed
            setTimeout(()=>{
                setShowNotice(false);
                callbackFunction();
            },4000);
        }

    }));

    return(<>
        {showNotice && 
        <div className='absolute b-5 left-[50%] translate-x-[-50%] p-1 px-4 border-b-2 border-white glass-effect text-white font-navbar animate-notice'>
            {text}
        </div>}
        </>
    );
});

export default Notice;