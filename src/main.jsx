import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Play from './pages/Play.jsx'
import Login from './pages/Login.jsx'
import PrivateRoute from './PrivateRoute.jsx'
import Profile from './pages/Profile.jsx'
import Leaderboard from './pages/Leaderboard.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}/>
        <Route path="/play" element={<PrivateRoute><Play /></PrivateRoute>}/>
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>}/>
        <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>}/>
        <Route path='/login' element={<Login/>}/>
      </Routes>
    </BrowserRouter>
)
