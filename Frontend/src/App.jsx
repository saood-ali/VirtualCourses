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
import EditProfile from './pages/EditProfile.jsx'
import Dashboard from './pages/Educator/Dashboard.jsx'
import Courses from './pages/Educator/Courses.jsx'
import CreateCourses from './pages/Educator/CreateCourses.jsx'
import getCreatorCourse from './customHooks/getCreatorCourse.js'
import EditCourse from './pages/Educator/EditCourse.jsx'
export const serverUrl = "http://localhost:8000";


function App() {
  getCurrentUser();
  getCreatorCourse();
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
        <Route path='/edit-profile' element={userData? <EditProfile/> : <Navigate to={"/signup"}/>} />
        <Route path='/dashboard' element={userData?.role === "educator"? <Dashboard/> : <Navigate to={"/signup"}/>} />
        <Route path='/courses' element={userData?.role === "educator"? <Courses/> : <Navigate to={"/signup"}/>} />
        <Route path='/createcourses' element={userData?.role === "educator"? <CreateCourses/> : <Navigate to={"/signup"}/>} />
        <Route path='/editcourse/:courseId' element={userData?.role === "educator"? <EditCourse/> : <Navigate to={"/signup"}/>} />
      </Routes>
    </div>
  )
}

export default App