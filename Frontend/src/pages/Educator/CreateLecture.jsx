import axios from 'axios';
import { useState, useEffect } from 'react';
import { BsArrowReturnLeft } from "react-icons/bs";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { serverUrl } from '../../App.jsx';
import { setLectureData } from '../../redux/lectureSlice.js';
import { toast } from 'react-toastify';
import { FaEdit } from "react-icons/fa";
import { DotPattern } from '../../components/DotPattern.jsx';
import ElectricBorder from '../../components/ElectricBorder.jsx';
import { ClipLoader } from 'react-spinners'; 

function CreateLecture() {
  const {courseId} = useParams();
  const navigate = useNavigate();
  const [lectureTitle, setLectureTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  
  const {lectureData} = useSelector(state => state.lecture);

  const handleCreateLecture = async () => {
    setLoading(true);
    try {
      const result = await axios.post(`${serverUrl}/api/course/createlecture/${courseId}`, {lectureTitle}, {withCredentials:true});
      
      const currentLectures = Array.isArray(lectureData) ? lectureData : [];
      dispatch(setLectureData([...currentLectures, result.data.lecture]));
      
      setLoading(false);
      toast.success("Lecture Created");
      setLectureTitle("");
    } catch (error) {
      console.log(error);
      setLoading(false);
      const errorMessage = error.response?.data?.message || "Something went wrong";
      toast.error(errorMessage);
    }
  }

  useEffect(() => {
    const getCourseLecture = async () => {
      if (!courseId) return;

      try {
        const result = await axios.get(
          `${serverUrl}/api/course/courselecture/${courseId}`, 
          {withCredentials:true}
        );
        
        console.log("Fetched Data:", result.data); 
        const fetchedLectures = result.data.lectures || result.data.lecture || [];

        dispatch(setLectureData(fetchedLectures));

      } catch (error) {
        console.error("Failed to fetch lectures:", error);
      }
    }

    getCourseLecture();
    
  }, [courseId, dispatch]);

  return (
    // PARENT CONTAINER
    <div className='min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden'>
      
      {/* 1. DOT PATTERN */}
      <DotPattern className="absolute inset-0 opacity-50 text-gray-300" />

      {/* 2. ELECTRIC BORDER */}
      <ElectricBorder className="w-full max-w-2xl" color="#7df99f" speed={2.9} chaos={0.05}>
        <div className='bg-white shadow-xl rounded-xl w-full p-6'>
          {/* Header */}
          <div className='mb-6'>
            <h1 className='text-2xl font-semibold text-gray-800 mb-1'>Let's add a lecture</h1>
            <p className='text-gray-500 text-sm'>
            Enter the title and add your video lectures to enhance your course content.
            </p>
          </div>

          {/* Input Area */}
          <div>
            <input type='text' className='w-full border border-gray-300 
            rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black mb-4' 
            placeholder='Introduction to MERN STACK' onChange={(e)=>setLectureTitle(e.target.value)} value={lectureTitle}/>
            
            {/* Button Area */}
            <div className='flex gap-4 mb-6'>
              <button className='flex items-center gap-2 px-4 py-2 rounded-md bg-gray-200 
              hover:bg-gray-300 text-sm font-medium cursor-pointer' onClick={()=>navigate(`/editcourse/${courseId}`)}> <BsArrowReturnLeft/>Back to Courses</button>
              <button className='px-5 py-2 rounded-md bg-black text-white hover:bg-gray-600
              transition-all text-sm font-medium shadow cursor-pointer' disabled={loading} onClick={handleCreateLecture}>
              {loading? <ClipLoader color="white" size={30}/>: "+Create Lecture"}</button>
            </div>
          </div>

          {/* Lecture List */}
          <div className='space-y-2'>
            {/* Safe mapping: Check if lectureData is actually an array before mapping */}
            {Array.isArray(lectureData) && lectureData.length > 0 ? (
                lectureData.map((lecture, index) => (
                <div key={lecture._id || index} className='bg-gray-100 rounded-md flex justify-between items-center p-3 text-sm font-medium text-gray-700'>
                    <span>Lecture - {index + 1}: {lecture.lectureTitle}</span>
                    <FaEdit className='text-gray-500 hover:text-gray-700 
                    cursor-pointer' onClick={() => navigate(`/editlecture/${courseId}/${lecture._id}`)}/>
                </div>
                ))
            ) : (
                <p className="text-gray-400 text-center text-sm py-4">No lectures added yet.</p>
            )}
          </div>
        </div>
      </ElectricBorder>
    </div>
  )
}

export default CreateLecture;