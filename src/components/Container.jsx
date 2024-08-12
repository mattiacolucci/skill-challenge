const Container = (props)=>{
    return(
        <div className="w-screen min-h-screen bg-bg-color overflow-x-hidden font-default flex flex-col items-center justify-start text-white">
            {props.children}
        </div>
    )
}

export default Container;