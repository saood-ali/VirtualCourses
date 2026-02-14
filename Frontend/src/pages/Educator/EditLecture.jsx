import axios from "axios";
import React, { useState } from "react";
import { BsArrowReturnLeft } from "react-icons/bs";
import { FaCheckCircle } from "react-icons/fa"; 
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { setLectureData } from "../../redux/lectureSlice.js";
import { toast } from "react-toastify";
import { serverUrl } from "../../App.jsx";
import { ClipLoader } from "react-spinners";
import Iridescence from "../../components/Iridescence.jsx"; 
import ReactPlayer from 'react-player'; 

function EditLecture() {
  const { courseId, lectureId } = useParams();
  const { lectureData } = useSelector((state) => state.lecture);
  const selectedLecture = lectureData.find((lecture) => lecture._id === lectureId);

  const [lectureTitle, setLectureTitle] = useState(selectedLecture?.lectureTitle || "");
  const [videoFile, setVideoFile] = useState(null); 
  const [isPreviewFree, setIsPreviewFree] = useState(selectedLecture?.isPreviewFree || false);
  
  const [loading, setLoading] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const uploadVideoToCloudinary = async (file) => {
    try {
      const { data: signData } = await axios.get(`${serverUrl}/api/upload/signature`, {
        withCredentials: true 
      });

      const { signature, timestamp, apiKey, cloudName } = signData;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);

      const uploadRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      );

      return uploadRes.data.secure_url;
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw new Error("Video upload failed");
    }
  };

  const handleEditLecture = async () => {
    setLoading(true);
    try {
      let finalVideoUrl = "";

      if (videoFile) {
        toast.info("Uploading video to cloud... please wait");
        finalVideoUrl = await uploadVideoToCloudinary(videoFile);
      }

      const payload = {
        lectureTitle,
        isPreviewFree,
      };
      
      if (finalVideoUrl) {
        payload.videoUrl = finalVideoUrl;
      }

      const result = await axios.post(
        `${serverUrl}/api/course/editlecture/${lectureId}`, 
        payload, 
        { withCredentials: true }
      );

      console.log(result.data);
      
      const updatedLectures = lectureData.map(l => l._id === lectureId ? result.data : l);
      dispatch(setLectureData(updatedLectures));

      toast.success("Lecture Updated Successfully");
      navigate("/courses"); 
    } catch (error) {
      console.log(error);
      const msg = error.response?.data?.message || "Update failed";
      toast.error(msg);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
    
  const removeLecture = async () => {
    setLoading1(true);
    try {
      const result = await axios.delete(`${serverUrl}/api/course/removelecture/${lectureId}`, { withCredentials: true });
      console.log(result.data);
      
      const filtered = lectureData.filter(l => l._id !== lectureId);
      dispatch(setLectureData(filtered));

      navigate(`/createlecture/${courseId}`);
      toast.success("Lecture Removed");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to remove");
    } finally {
      setLoading1(false);
    }
  };

  return (
    // 1. Container set to relative and overflow hidden to contain the background
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* 2. The Iridescence Background Layer */}
      <div className="absolute inset-0 -z-10">
        <Iridescence 
          color={[0.9, 0.9, 0.9]} // Subtle gray/white shimmer
          mouseReact={false} 
          speed={0.7} 
          amplitude={0.1} 
        />
      </div>

      {/* 3. The Content Card */}
      <div className="w-full max-w-xl bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl p-6 space-y-6 border border-white/50">
       
       {/* Header */}
       <div className="flex items-center gap-2 mb-2">
        <BsArrowReturnLeft className="text-gray-600 cursor-pointer hover:text-black transition" onClick={()=>navigate(`/createlecture/${courseId}`)}/>
        <h2 className="text-xl font-semibold text-gray-800">
        Update course lecture
        </h2>
       </div>

       <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md
        hover:bg-red-800 transition-all text-sm cursor-pointer shadow-md" disabled={loading1} onClick={removeLecture}>
        {loading1? <ClipLoader size={20} color="white" />:"Remove Lecture"}</button>

        <div className="space-y-4 ">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lectureTitle">LectureTitle*</label>
            <input type="text" className="w-full p-3 border border-gray-300 rounded-md
             text-sm focus:ring-2 focus:ring-black focus:outline-none bg-white/50" required onChange={(e)=>setLectureTitle(e.target.value)} 
             value={lectureTitle}/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video (Optional update)</label>
            
            {selectedLecture?.videoUrl && !videoFile && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md flex flex-col gap-2">
                <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                  <FaCheckCircle />
                  <span>Current Video Uploaded</span>
                </div>
                {/* Small Preview Player */}
                <div className="w-full aspect-video rounded-md overflow-hidden bg-black relative">
                   <ReactPlayer 
                      url={selectedLecture.videoUrl} 
                      width="100%" 
                      height="100%" 
                      controls={true} 
                      light={true} // Shows thumbnail first (lighter on resources)
                   />
                </div>
                <p className="text-xs text-gray-500">To replace this video, choose a new file below.</p>
              </div>
            )}

            <input 
              type="file" 
              className="w-full p-2 border border-gray-300 rounded-md text-sm file:mr-4 file:py-2 
              file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-gray-800 file:text-white
              hover:file:bg-gray-700 cursor-pointer bg-white/50" 
              accept='video/*' 
              onChange={(e)=>setVideoFile(e.target.files[0])} 
            />
          </div>

          <div className="flex items-center gap-3">
           <input 
             type="checkbox" 
             className="accent-black h-4 w-4 cursor-pointer" 
             id="isFree" 
             checked={isPreviewFree} 
             onChange={()=>setIsPreviewFree(prev=>!prev)}
           />
           <label htmlFor="isFree" className="text-sm text-gray-700 cursor-pointer">Is this Video FREE?</label>
          </div>

          {/* Progress Bar Display */}
          {loading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
              <p className="text-xs text-center mt-1 text-gray-500">Uploading: {uploadProgress}%</p>
            </div>
          )}

        </div>
        <div className="pt-4">
         <button className="w-full bg-black text-white py-3 rounded-md text-sm font-medium 
         hover:bg-gray-800 transition cursor-pointer shadow-lg" disabled={loading} onClick={handleEditLecture}>
         {loading? <ClipLoader color="white" size={20}/>: "Update Lecture"}</button>
        </div>
      </div>
    </div>
  );
}

export default EditLecture;