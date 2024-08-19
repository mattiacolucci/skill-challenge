import Container from "./Container";


const Loading=()=>{
    return(
        <Container>
            <div className="w-[200px] h-[200px] my-auto glass-effect rounded-md flex flex-col items-center justify-center gap-5">
                <div className="text-white text-2xl font-default">LOADING</div>
                <i className="fi fi-tr-loading text-[30px] leading-[0] origin-center animate-rotation"></i>
            </div>
        </Container>
    )
}

export default Loading;