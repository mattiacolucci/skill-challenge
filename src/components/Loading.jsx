const Loading=()=>{
    return(
        <div className="fixed top-0 left-0 w-screen h-screen z-20 flex items-center justify-center bg-bg-color">
            <div className="w-[200px] h-[200px] my-auto glass-effect rounded-md flex flex-col items-center justify-center gap-5">
                <div className="text-white text-2xl font-default">LOADING</div>
                <i className="fi fi-tr-loading text-[30px] text-white leading-[0] origin-center animate-rotation"></i>
            </div>
        </div>
    )
}

export default Loading;