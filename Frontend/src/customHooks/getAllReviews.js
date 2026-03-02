import axiosClient from "../config/axiosClient.js";
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setReviewData } from '../redux/reviewSlice.js';
const useGetAllReviews = () => {
    const dispatch = useDispatch();
   
    useEffect(()=>{
        const allReviews = async()=>{
            try {
                const result = await axiosClient.get(`/api/review/getreview?t=${Date.now()}`);
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