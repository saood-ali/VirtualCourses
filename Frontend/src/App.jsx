
import Home from './pages/Home.jsx';
import SignUp from './pages/SignUp.jsx';
import Login from './pages/Login.jsx';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import getPublishedCourse from './customHooks/getPublishedCourse.js'
import AllCourses from './pages/AllCourses.jsx'
import CreateLecture from './pages/Educator/CreateLecture.jsx'
import EditLecture from './pages/Educator/EditLecture.jsx'
import ViewCourse from './pages/ViewCourse.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import ViewLectures from './pages/ViewLectures.jsx'
import MyEnrolledCourses from './pages/MyEnrolledCourses.jsx'
import getAllReviews from './customHooks/getAllReviews.js'
import SearchWithAi from './pages/SearchWithAi.jsx'
export const serverUrl = "https://virtual-courses-two.vercel.app/";


function App() {
  getCurrentUser();
  getCreatorCourse();
  getPublishedCourse();
  getAllReviews();
  const {userData} = useSelector(state=>state.user)
  return (
    <div>
    <ToastContainer />
    <ScrollToTop/>
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
        <Route path='/createcourses' element={userData?.role === "educator"? <CreateCourses/> : <Navigate to={"/signup"}/>} />
        <Route path='/editcourse/:courseId' element={userData?.role === "educator"? <EditCourse/> : <Navigate to={"/signup"}/>} />
        <Route path='/createlecture/:courseId' element={userData?.role === "educator"? <CreateLecture/> : <Navigate to={"/signup"}/>} />
        <Route path='/editlecture/:courseId/:lectureId' element={userData?.role === "educator"? <EditLecture/> : <Navigate to={"/signup"}/>} />
        <Route path='/viewcourse/:courseId' element={userData ? <ViewCourse/> : <Navigate to={"/signup"}/>} />
        <Route path='/viewlecture/:courseId' element={userData ? <ViewLectures/> : <Navigate to={"/signup"}/>} />
        <Route path='/mycourses' element={userData ? <MyEnrolledCourses/> : <Navigate to={"/signup"}/>} />
        <Route path='/search' element={userData ? <SearchWithAi/> : <Navigate to={"/signup"}/>} />  
      </Routes>
    </div>
  )
}

export default App
