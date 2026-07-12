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
import PageLoader from './components/PageLoader.jsx';
import LiveClass from "./pages/LiveClass.jsx";


function App() {
  useGetCreatorCourse();
  useGetPublishedCourse();
  useGetAllReviews();
  const isUserLoading = useGetCurrentUser();
  const {userData} = useSelector(state=>state.user);
  if (isUserLoading) {
    return <PageLoader message="Verifying Session..." />;
  }
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
        toastClassName={() =>
          "relative flex items-start gap-3 bg-white text-[#111111] text-sm font-medium rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-[#EAEAEA] px-5 py-4 mb-4 overflow-hidden cursor-pointer"
        }
        progressStyle={{ background: "#FFD400", height: "2px" }}
        style={{ bottom: "24px", right: "24px", width: "340px" }}
        icon={false}
      />
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
