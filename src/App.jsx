import Container from './components/Container'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { Link } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Loading from './components/Loading'
import { useEffect, useState } from 'react'

function App() {
  const { pending, isSignedIn, user, auth } = useAuth();
  const [currentNews,setCurrentNews]=useState(0);

  const news=[
    "New skill added: Reactive Click!",
    "New tournaments available!",
    "New leaderboard system implemented!",
    "New profile customization options!",
    "New skill parameters added!"];

  useEffect(()=>{
    setInterval(()=>{
      setCurrentNews((prevNews)=>(prevNews+1)%news.length)
    }
    ,3000)
  },[])

  if(pending){
    return <Loading/>
  }else{
    return (
      <>
        <Container>
          <Navbar isLogged={isSignedIn} user={user}/>
          
          <div className='h-[6vh] w-[90%] flex flex-row items-center px-2 gap-4 glass-effect rounded-md mt-[2vh] overflow-hidden'>
            {news.map((n,i)=>{
              return <div key={"newsSquare"+i} className={"h-[4vh] w-[4vh] bg-white rounded-md "+(i==currentNews?"bg-opacity-70":"bg-opacity-50")}></div>
            })}
            <div className='text-[12px] text-white font-navbar animate-fadeNews' key={"news"+currentNews}>{news[currentNews]}</div>
            {/*<div className='text-[12px] text-white font-navbar'>Mettere o la posizione dell'utente o informazioni sull'ulitima partita o altro come per es notizie (nuovi record,...)</div>*/}
          </div>
          
          <div className='!flex-1 w-screen flex flex-row justify-evenly py-5 gap-6'>
            
            <div className='h-auto basis-[15%] flex flex-col items-center py-3 border-r-2 border-white border-opacity-60 text-white px-4 gap-2'>
              <Link to="/play" className='w-full h-[30px] rounded-md text-left hover:bg-white hover:bg-opacity-40 transition-all duration-300 px-4 leading-[30px]'>
                PLAY
              </Link>
              <Link to="/leaderboard" className='w-full h-[30px] rounded-md text-left hover:bg-white hover:bg-opacity-40 transition-all duration-300 px-4 leading-[30px]'>
                LEADERBOARD
              </Link>
              <Link to="/tournaments" className='w-full h-[30px] rounded-md text-left hover:bg-white hover:bg-opacity-40 transition-all duration-300 px-4 leading-[30px]'>
                TOURNAMENTS
              </Link>
              <Link to="/searchPlayers" className='w-full h-[30px] rounded-md text-left hover:bg-white hover:bg-opacity-40 transition-all duration-300 px-4 leading-[30px] text-ellipsis overflow-hidden whitespace-nowrap'>
                SEARCH PLAYERS
              </Link>
            </div>
  
            <div className='h-auto basis-[50%] flex flex-col items-center py-3 rounded-md text-white'>
              <div className='text-3xl mt-5'>TEST YOUR TYPING AND REACTION SKILLS!</div>
            </div>
  
            <div className='h-auto basis-[27%] flex flex-col items-center py-3 rounded-md text-white glass-effect'>
              LEADERBOARDS
            </div>
          </div>
          <Footer/>
        </Container>
      </>
    )
  }
}

export default App
