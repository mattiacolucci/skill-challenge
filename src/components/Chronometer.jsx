import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

const Chronometer=forwardRef((props, ref) => {
    // state to store time
    const [time, setTime] = useState(0);
    // state to check stopwatch running or not
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let intervalId;
        if (isRunning) {
          // setting time from 0 to 1 every 10 milisecond using javascript setInterval method
          intervalId = setInterval(() => setTime(time + 1), 10);
        }
        return () => clearInterval(intervalId);
    }, [isRunning, time]);

    //expose function to external components
    useImperativeHandle(ref, () => ({

        startAndStop(){
            setIsRunning(!isRunning);
        }
    
    }));

    // Hours calculation
    const hours = Math.floor(time / 360000);

    // Minutes calculation
    const minutes = Math.floor((time % 360000) / 6000);

    // Seconds calculation
    const seconds = Math.floor((time % 6000) / 100);

    // Milliseconds calculation
    const milliseconds = time % 100;

    return(
        <div className="mt-10 ml-10 self-start text-3xl text-white">
            {hours}:{minutes.toString().padStart(2, "0")}:
            {seconds.toString().padStart(2, "0")}:
            {milliseconds.toString().padStart(2, "0")}
        </div>
    )
});

export default Chronometer;