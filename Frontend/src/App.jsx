import React from 'react'
import Home from './pages/Home'
import SignUp from './pages/Signup.jsx'
import Login from './pages/Login'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import getCurrentUser from './customHooks/getCurrentUser';
export const serverUrl = "http://localhost:8000";


function App() {
  getCurrentUser();
  return (
    <div>
    <ToastContainer />
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/signup' element={<SignUp/>} />
        <Route path='/login' element={<Login/>} />
      </Routes>
    </div>
  )
}

export default App