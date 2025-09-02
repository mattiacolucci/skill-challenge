import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom'
import Play from './pages/Play.jsx'
import Login from './pages/Login.jsx'
import PrivateRoute from './PrivateRoute.jsx'
import Profile from './pages/Profile.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Tournaments from './pages/Tournaments.jsx'
import Tournament from './pages/Tournament.jsx'
import Error from './pages/Error.jsx'
import ReactiveClock from './components/skills/RectiveClock.jsx'

createRoot(document.getElementById('root')).render(
  <HashRouter>
      <Routes>
        <Route path="/" element={<App />}/>
        <Route path='/test' element={<ReactiveClock user={{language:"en",username:"test",photoURL:"",exp:0,lv:1,rankingPoints:0}} skillParameters={0} records={{
            PB: {fastestCircle:{record:1}, totTime:{record:1}, avgTime:{record:1}},
            NR: {fastestCircle:{record:1}, totTime:{record:1}, avgTime:{record:1}},
            WR: {fastestCircle:{record:1}, totTime:{record:1}, avgTime:{record:1}}
        }} />}/>
        <Route path="/play" element={<PrivateRoute><Play /></PrivateRoute>}/>
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>}/>
        <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>}/>
        <Route path="/tournaments" element={<PrivateRoute><Tournaments /></PrivateRoute>}/>
        <Route path="/tournament/:id" element={<PrivateRoute><Tournament /></PrivateRoute>}/>
        <Route path='/error' element={<Error/>}/>
        <Route path='/login' element={<Login/>}/>
      </Routes>
    </HashRouter>
)
