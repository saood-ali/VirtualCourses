import { useEffect } from 'react';
import axiosClient from "../config/axiosClient.js";
import { useDispatch } from 'react-redux';
import { setCourseData } from '../redux/courseSlice.js';

const useGetPublishedCourse = () => {
    const dispatch = useDispatch();
    useEffect(()=>{
        const getCourseData = async () => {
            try {
                const result = await axiosClient.get(`/api/course/getpublished?t=${Date.now()}`);        
                dispatch(setCourseData(result.data));  
                console.log(result.data);
            } catch (error) {
                console.log(error) 
            }
        }
        getCourseData();
    },[dispatch])
}

export default useGetPublishedCourse;