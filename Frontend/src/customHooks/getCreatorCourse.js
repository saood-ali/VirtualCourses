import { useEffect } from 'react';
import axiosClient from '../config/axiosClient.js';
import { useDispatch } from 'react-redux';
import { setCreatorCourseData } from '../redux/courseSlice.js';

const useGetCreatorCourse = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchCreatorCourses = async () => {
            try {
                const result = await axiosClient.get(`/api/course/getcreator?t=${Date.now()}`, {
                  headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                  }
                });
                console.log("Fetched Creator Data:", result.data);
                
                let courses = result.data;
                if (!Array.isArray(courses) && courses?.courses) {
                  courses = courses.courses;
                }
                
                dispatch(setCreatorCourseData(courses));
            } catch (error) {
                console.log("Could not fetch creator courses:", error);
            }
        }

        fetchCreatorCourses();

    }, [dispatch]); 
}

export default useGetCreatorCourse;