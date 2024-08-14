const Container = (props)=>{
    return(
        <div className={"w-screen bg-bg-color font-default flex flex-col flex-shrink-0 [&>*]:flex-none items-center justify-start text-white "+((props.overflowHidden)?"h-[100vh] overflow-hidden":"min-h-screen overflow-x-hidden")}>
            {/*[&>*] style, apply a style to each child of the container */}
            {props.children}
        </div>
    )
}

export default Container;