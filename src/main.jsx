import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Play from './pages/Play.jsx'
import Login from './pages/Login.jsx'
import PrivateRoute from './PrivateRoute.jsx'
import Profile from './pages/Profile.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Tournaments from './pages/Tournaments.jsx'
import Tournament from './pages/Tournament.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}/>
        <Route path="/play" element={<PrivateRoute><Play /></PrivateRoute>}/>
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>}/>
        <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>}/>
        <Route path="/tournaments" element={<PrivateRoute><Tournaments /></PrivateRoute>}/>
        <Route path="/tournament/:id" element={<PrivateRoute><Tournament /></PrivateRoute>}/>
        <Route path='/login' element={<Login/>}/>
      </Routes>
    </BrowserRouter>
)
