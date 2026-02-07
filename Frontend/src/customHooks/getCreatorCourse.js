import { useEffect } from 'react';
import axios from 'axios';
import { serverUrl } from '../App.jsx';
import { useDispatch } from 'react-redux';
import { setCreatorCourseData } from '../redux/courseSlice.js';

const useGetCreatorCourse = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchCreatorCourses = async () => {
            try {
                const result = await axios.get(`${serverUrl}/api/course/getcreator`, {
                    withCredentials: true
                });
                console.log("Fetched Creator Data:", result.data);
                dispatch(setCreatorCourseData(result.data.courses));
            } catch (error) {
                console.log("Could not fetch creator courses:", error);
            }
        }

        fetchCreatorCourses();

    }, [dispatch]); 
}

export default useGetCreatorCourse;