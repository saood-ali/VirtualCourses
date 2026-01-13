import React from 'react'
import Home from './pages/Home.jsx'
import SignUp from './pages/Signup.jsx'
import Login from './pages/Login'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import getCurrentUser from './customHooks/getCurrentUser';
import { useSelector } from 'react-redux'
import Profile from './pages/Profile.jsx'
import ForgetPassword from './pages/ForgetPassword.jsx'
export const serverUrl = "http://localhost:8000";


function App() {
  getCurrentUser();
  const {userData} = useSelector(state=>state.user)
  return (
    <div>
    <ToastContainer />
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/signup' element={!userData? <SignUp/> : <Navigate to={"/"}/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/profile' element={userData? <Profile/> : <Navigate to={"/signup"}/>} />
        <Route path='/forget-password' element={userData? <ForgetPassword/> : <Navigate to={"/signup"}/>} />
      </Routes>
    </div>
  )
}

export default App