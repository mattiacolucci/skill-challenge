import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

const Chronometer=forwardRef((props, ref) => {
    // state to store time
    const [time, setTime] = useState(0);

    // state to check stopwatch running or not
    const [isRunning, setIsRunning] = useState(false);
    
    var intervalId;

    useEffect(() => {
        const startTime=new Date();
        if (isRunning) {
          // setting time from 0 to 1 every 10 milisecond using javascript setInterval method
          intervalId = setInterval(() => {setTime(Date.now() - startTime);}, 100);
        }
        return ()=>clearInterval(intervalId)
    }, [isRunning]);

    //expose function to external components
    useImperativeHandle(ref, () => ({

        startAndStop(){
            setIsRunning(!isRunning);
        },
        
        getTime(){
            return time;
        }
    
    }));

    const seconds = (time / 1000).toFixed(3)

    return(
        <div className="text-3xl text-white select-none">
            {(((seconds<10)?"0":"")+seconds)+"s"}
        </div>
    )
});

export default Chronometer;