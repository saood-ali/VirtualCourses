import { useEffect } from 'react';
import axios from 'axios';
import { serverUrl } from '../App.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { setCreatorCourseData } from '../redux/courseSlice.js';

const useGetCreatorCourse = () => {
    const dispatch = useDispatch();
    const {userData} = useSelector(state=>state.user)
  return (
    useEffect(()=>{
       if (!userData || !userData.isAuth) return;
       const creatorCourses = async()=>{
        try {
            const result = await axios.get(`${serverUrl}/api/course/getcreator`,{withCredentials:true});
            console.log(result.data);
            dispatch(setCreatorCourseData(result.data));
        } catch (error) {
            console.log(error);
        }
       }
       creatorCourses();
    },[userData, dispatch])
  )
}

export default useGetCreatorCourse;