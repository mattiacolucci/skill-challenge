import { useEffect, useState } from 'react'
import Container from './components/Container'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { Link } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Loading from './components/Loading'

function App() {
  const { pending, isSignedIn, user, auth } = useAuth();

  if(pending){
    return <Loading/>
  }else{
    return (
      <>
        <Container>
          <Navbar isLogged={isSignedIn} user={user}/>
          <div className='h-[82vh] flex-none w-screen flex flex-row justify-evenly py-5 gap-6'>
            
            <div className='h-auto basis-[15%] flex flex-col items-center py-3 border-r-2 border-white border-opacity-60 text-white px-4 gap-2'>
              <Link to="/play" className='w-full h-[30px] rounded-md text-left hover:bg-white hover:bg-opacity-40 transition-all duration-300 px-4 leading-[30px]'>
                PLAY
              </Link>
              <button className='w-full h-[30px] rounded-md text-left hover:bg-white hover:bg-opacity-40 transition-all duration-300 px-4 leading-[30px]'>
                MENU 2
              </button>
              <button className='w-full h-[30px] rounded-md text-left hover:bg-white hover:bg-opacity-40 transition-all duration-300 px-4 leading-[30px]'>
                MENU 3
              </button>
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
