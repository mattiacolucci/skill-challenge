const Tournament=(props)=>{
    const tournamentId=props.routerParams.id;

    return(
        <div>{tournamentId}</div>
    )
}

export default Tournament;