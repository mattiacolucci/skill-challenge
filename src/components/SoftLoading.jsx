const SoftLoading=()=>{
    return(
        <div className="absolute w-screen h-screen z-20 flex items-center justify-center bg-black bg-opacity-40">
            <div className="w-[200px] h-[200px] my-auto glass-effect rounded-md flex flex-col items-center justify-center gap-5">
                <div className="text-white text-2xl font-default">LOADING</div>
                <i className="fi fi-tr-loading text-[30px] leading-[0] origin-center animate-rotation"></i>
            </div>     
        </div>
    )
}

export default SoftLoading;