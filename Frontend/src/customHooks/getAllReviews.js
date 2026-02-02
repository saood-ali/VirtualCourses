import axios from 'axios';
import { useEffect } from 'react';
import { serverUrl } from '../App.jsx';
import { useDispatch } from 'react-redux';
import { setReviewData } from '../redux/reviewSlice.js';
const useGetAllReviews = () => {
    const dispatch = useDispatch();
   
    useEffect(()=>{
        const allReviews = async()=>{
            try {
                const result = await axios.get(`${serverUrl}/api/review/getreview`,{withCredentials:true});
                dispatch(setReviewData(result.data));
                console.log(result.data);
            } catch (error) {
                console.log(error);
            }
        }
        allReviews();
    },[dispatch])
}

export default useGetAllReviews;