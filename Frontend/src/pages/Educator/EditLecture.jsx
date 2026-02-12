import axios from "axios";
import React, { useState } from "react";
import { BsArrowReturnLeft } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { setLectureData } from "../../redux/lectureSlice.js";
import { toast } from "react-toastify";
import { serverUrl } from "../../App.jsx";
import { ClipLoader } from "react-spinners";

function EditLecture() {
  const { courseId, lectureId } = useParams();
  const { lectureData } = useSelector((state) => state.lecture);
  const selectedLecture = lectureData.find((lecture) => lecture._id === lectureId);

  const [lectureTitle, setLectureTitle] = useState(selectedLecture?.lectureTitle || "");
  const [videoFile, setVideoFile] = useState(null); // Changed: Stores file object, not URL
  const [isPreviewFree, setIsPreviewFree] = useState(selectedLecture?.isPreviewFree || false);
  
  const [loading, setLoading] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- NEW: Helper function for Direct Upload ---
  const uploadVideoToCloudinary = async (file) => {
    try {
      const { data: signData } = await axios.get(`${serverUrl}/api/upload/signature`, {
        withCredentials: true 
      });

      const { signature, timestamp, apiKey, cloudName } = signData;

      //  Prepare Data for Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);

      // 3. Upload Directly to Cloudinary
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

      // Step A: If user selected a new video, upload it first
      if (videoFile) {
        toast.info("Uploading video to cloud... please wait");
        finalVideoUrl = await uploadVideoToCloudinary(videoFile);
      }

      // Step B: Send updated data to Backend
      // NOTE: We are sending JSON now, not FormData, because the file is already uploaded!
      const payload = {
        lectureTitle,
        isPreviewFree,
      };
      
      // Only attach videoUrl if we actually uploaded a new one
      if (finalVideoUrl) {
        payload.videoUrl = finalVideoUrl;
      }

      const result = await axios.post(
        `${serverUrl}/api/course/editlecture/${lectureId}`, 
        payload, 
        { withCredentials: true }
      );

      console.log(result.data);
      
      // Update Redux
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
      
      // Remove from Redux
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6 space-y-6">
       
       {/* Header */}
       <div className="flex items-center gap-2 mb-2">
        <BsArrowReturnLeft className="text-gray-600 cursor-pointer" onClick={()=>navigate(`/createlecture/${courseId}`)}/>
        <h2 className="text-xl font-semibold text-gray-800">
        Update course lecture
        </h2>
       </div>

       <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md
        hover:bg-red-800 transition-all text-sm" disabled={loading1} onClick={removeLecture}>
        {loading1? <ClipLoader size={20} color="white" />:"Remove Lecture"}</button>

        <div className="space-y-4 ">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lectureTitle">LectureTitle*</label>
            <input type="text" className="w-full p-3 border border-gray-300 rounded-md
             text-sm focus:ring-2 focus:ring-black focus:outline-none" required onChange={(e)=>setLectureTitle(e.target.value)} 
             value={lectureTitle}/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video (Optional update)</label>
            <input 
              type="file" 
              className="w-full p-2 border border-gray-300 rounded-md text-sm file:mr-4 file:py-2 
              file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-gray-700 file:text-white
              hover:file:bg-gray-500" 
              accept='video/*' 
              onChange={(e)=>setVideoFile(e.target.files[0])} 
            />
          </div>

          <div className="flex items-center gap-3">
           <input 
             type="checkbox" 
             className="accent-black h-4 w-4" 
             id="isFree" 
             checked={isPreviewFree} 
             onChange={()=>setIsPreviewFree(prev=>!prev)}
           />
           <label htmlFor="isFree" className="text-sm text-gray-700">Is this Video FREE?</label>
          </div>

          {/* Progress Bar Display */}
          {loading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${uploadProgress}%`}}></div>
              <p className="text-xs text-center mt-1 text-gray-500">Uploading: {uploadProgress}%</p>
            </div>
          )}

        </div>
        <div className="pt-4">
         <button className="w-full bg-black text-white py-3 rounded-md text-sm font-medium 
         hover:bg-gray-700 transition" disabled={loading} onClick={handleEditLecture}>
         {loading? <ClipLoader color="white" size={20}/>: "Update Lecture"}</button>
        </div>
      </div>
    </div>
  );
}

export default EditLecture;