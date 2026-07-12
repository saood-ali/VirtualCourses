export const serverUrl = import.meta.env.VITE_SERVER_URL;
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import SignUp from './pages/SignUp.jsx';
import Login from './pages/Login.jsx';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import useGetCurrentUser from './customHooks/getCurrentUser.js';
import { useSelector } from 'react-redux'
import Profile from './pages/Profile.jsx'
import ForgetPassword from './pages/ForgetPassword.jsx'
import EditProfile from './pages/EditProfile.jsx'
import Dashboard from './pages/Educator/Dashboard.jsx'
import Courses from './pages/Educator/Courses.jsx'

import useGetCreatorCourse from './customHooks/getCreatorCourse.js'
import EditCourse from './pages/Educator/EditCourse.jsx'
import useGetPublishedCourse from './customHooks/getPublishedCourse.js'
import AllCourses from './pages/AllCourses.jsx'
import CreateLecture from './pages/Educator/CreateLecture.jsx'
import EditLecture from './pages/Educator/EditLecture.jsx'
import ViewCourse from './pages/ViewCourse.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'    
import MyEnrolledCourses from './pages/MyEnrolledCourses.jsx'
import useGetAllReviews from './customHooks/getAllReviews.js'
import SearchWithAi from './pages/SearchWithAi.jsx'
import { ClipLoader } from 'react-spinners';
import { DotPattern } from './components/DotPattern.jsx';
import LiveClass from "./pages/LiveClass.jsx";


function App() {
  useGetCreatorCourse();
  useGetPublishedCourse();
  useGetAllReviews();
  const isUserLoading = useGetCurrentUser();
  const {userData} = useSelector(state=>state.user);
  if (isUserLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden">
         <DotPattern className="absolute inset-0 opacity-50 text-gray-300" />
         
         <div className="z-10 bg-white/80 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-8 flex flex-col items-center gap-4">
            
            <ClipLoader color="#000000" size={50} speedMultiplier={0.99} />
            
            <div className="flex flex-col items-center">
              <span className="text-gray-800 font-semibold text-lg tracking-wide">Virtual Courses</span>
              <span className="text-gray-500 text-xs uppercase tracking-widest mt-1">Verifying Session...</span>
            </div>
         </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <ToastContainer />
      <ScrollToTop/>
      <main className="flex-1">
        <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/signup' element={!userData? <SignUp/> : <Navigate to={"/"}/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/profile' element={userData? <Profile/> : <Navigate to={"/signup"}/>} />
        <Route path='/forget-password' element={userData? <ForgetPassword/> : <Navigate to={"/signup"}/>} />
        <Route path='/edit-profile' element={userData? <EditProfile/> : <Navigate to={"/signup"}/>} />
        <Route path='/allcourses' element={<AllCourses/>} />
        <Route path='/dashboard' element={userData?.role === "educator"? <Dashboard/> : <Navigate to={"/signup"}/>} />
        <Route path='/courses' element={userData?.role === "educator"? <Courses/> : <Navigate to={"/signup"}/>} />

        <Route path='/editcourse/:courseId' element={userData?.role === "educator"? <EditCourse/> : <Navigate to={"/signup"}/>} />
        <Route path='/createlecture/:courseId' element={userData?.role === "educator"? <CreateLecture/> : <Navigate to={"/signup"}/>} />
        <Route path='/editlecture/:courseId/:lectureId' element={userData?.role === "educator"? <EditLecture/> : <Navigate to={"/signup"}/>} />
        <Route path='/course/:courseId' element={<ViewCourse/>} />
        <Route path='/viewcourse/:courseId' element={userData ? <ViewCourse/> : <Navigate to={"/signup"}/>} />
        <Route path='/mycourses' element={userData ? <MyEnrolledCourses/> : <Navigate to={"/signup"}/>} />
        <Route path='/search' element={userData ? <SearchWithAi/> : <Navigate to={"/signup"}/>} />  
        <Route path="/course/live/:courseId" element={<LiveClass />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
