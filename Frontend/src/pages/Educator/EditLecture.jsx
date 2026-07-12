import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { ClipLoader, HashLoader } from "react-spinners";
import ReactPlayer from 'react-player';
import { 
  ArrowLeft, ChevronDown, Trash2, Upload, Video, 
  CheckCircle2, AlertCircle, Eye, PlayCircle 
} from "lucide-react";

import axiosClient from "../../config/axiosClient.js";
import { setLectureData } from "../../redux/lectureSlice.js";

export default function EditLecture() {
  const { courseId, lectureId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userData } = useSelector(state => state.user);
  const { lectureData } = useSelector(state => state.lecture);

  // Try to find in Redux first 
  const preSelectedLecture = lectureData.find(l => l._id === lectureId);

  // --- STATE MANAGEMENT ---
  const [lectureTitle, setLectureTitle] = useState(preSelectedLecture?.lectureTitle || "");
  const [isPreviewFree, setIsPreviewFree] = useState(preSelectedLecture?.isPreviewFree || false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(preSelectedLecture?.videoUrl || "");
  const [videoFile, setVideoFile] = useState(null);

  // Loading States
  const [pageLoading, setPageLoading] = useState(!preSelectedLecture);
  const [loading, setLoading] = useState(false); 
  const [loading1, setLoading1] = useState(false); 
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- 1. Fetch Data on Refresh ---
  useEffect(() => {
    const fetchLectureDetails = async () => {
      if (!preSelectedLecture) {
        try {
          setPageLoading(true);
          const { data } = await axiosClient.get(`/api/course/getlecture/${lectureId}`);
          if (data && data.success !== false) {
            setLectureTitle(data.lectureTitle);
            setIsPreviewFree(data.isPreviewFree);
            setCurrentVideoUrl(data.videoUrl);
          }
        } catch (error) {
          console.error("Failed to fetch lecture:", error);
          toast.error("Could not load lecture details.");
        } finally {
          setPageLoading(false);
        }
      }
    };
    fetchLectureDetails();
  }, [lectureId, preSelectedLecture]);

  // --- Helper: Upload Video ---
  const uploadVideoToCloudinary = async (file) => {
    let signData;
    try {
      const response = await axiosClient.get(`/api/upload/signature`, {
        headers: { "ngrok-skip-browser-warning": "69420" }
      });
      signData = response.data;
    } catch (error) {
      console.error("Signature Fetch Error:", error.response?.data || error.message);
      throw new Error("Failed to get upload signature from server");
    }

    try {
      const { signature, timestamp, apiKey, cloudName, folder } = signData;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);

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
      console.error("Cloudinary Upload Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || "Video upload failed");
    }
  };

  // --- Handler: Update Lecture ---
  const handleEditLecture = async () => {
    if (!lectureTitle.trim()) {
      toast.error("Lecture title is required.");
      return;
    }

    setLoading(true);
    try {
      let finalVideoUrl = currentVideoUrl;
      if (videoFile) {
        toast.info("Uploading video... please wait");
        finalVideoUrl = await uploadVideoToCloudinary(videoFile);
      }

      const payload = {
        lectureTitle,
        isPreviewFree,
        videoUrl: finalVideoUrl
      };

      const result = await axiosClient.post(`/api/course/editlecture/${lectureId}`, payload);
      
      const updatedLectures = lectureData.map(l => l._id === lectureId ? result.data : l);
      dispatch(setLectureData(updatedLectures));

      toast.success("Lecture Updated Successfully");
      navigate(`/createlecture/${courseId}`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // --- Handler: Remove Lecture ---
  const removeLecture = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this lecture?")) return;
    setLoading1(true);
    try {
      await axiosClient.delete(`/api/course/removelecture/${lectureId}`);
      const filtered = lectureData.filter(l => l._id !== lectureId);
      dispatch(setLectureData(filtered));
      toast.success("Lecture Removed");
      navigate(`/createlecture/${courseId}`);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to remove");
    } finally {
      setLoading1(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
        <HashLoader color="#FFD400" size={50} />
        <p className="mt-4 text-[#5F6368] text-[14px] font-medium">Loading lecture details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111111] font-sans antialiased selection:bg-[#FFD400]/30 pb-24">
      
      {/* ── Main Layout ── */}
      <main className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10">
        
        {/* Page Header */}
        <button 
          onClick={() => navigate(`/createlecture/${courseId}`)} 
          className="flex items-center gap-2 text-[#5F6368] hover:text-[#111111] font-semibold text-[13px] transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Curriculum
        </button>

        <div className="mb-8">
          <h1 className="text-[32px] font-extrabold text-[#111111] leading-tight tracking-tight">Edit Lecture</h1>
          <p className="text-[15px] font-medium text-[#5F6368] mt-1">Modify title, update the video, and configure preview settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ── Left Column: Form & Upload ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 shadow-sm">
              <h2 className="text-[18px] font-bold text-[#111111] mb-6">Lecture Content</h2>
              
              <div className="space-y-6">
                
                {/* Title */}
                <div>
                  <label htmlFor="lectureTitle" className="block text-[13px] font-bold text-[#111111] mb-2">Lecture Title</label>
                  <div className="relative flex items-center h-[46px] bg-white border border-[#E5E7EB] rounded-[6px] px-4 focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400] transition-shadow">
                    <PlayCircle className="w-4.5 h-4.5 text-[#9CA3AF] mr-2.5 shrink-0" />
                    <input
                      id="lectureTitle" type="text"
                      placeholder="Enter lecture title"
                      value={lectureTitle} onChange={(e) => setLectureTitle(e.target.value)}
                      className="w-full h-full bg-transparent text-[14px] text-[#111111] placeholder-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Upload Section */}
                <div>
                  <label className="block text-[13px] font-bold text-[#111111] mb-2">Lecture Video</label>
                  <div className="w-full relative border-2 border-dashed border-[#E5E7EB] bg-[#F8F9FA] rounded-[6px] p-6 hover:border-[#FFD400] hover:bg-[#FFD400]/5 transition-colors group text-center cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-[#E5E7EB] flex items-center justify-center mb-3 text-[#5F6368] group-hover:text-[#FFD400] transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-[14px] font-bold text-[#111111] mb-1">
                        {videoFile ? videoFile.name : "Click or drag to upload new video"}
                      </span>
                      <span className="text-[12px] font-medium text-[#9CA3AF]">
                        {videoFile ? "File selected. Ready to save." : "MP4, WebM, or OGG up to 2GB"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Upload Progress Bar */}
                  {loading && uploadProgress > 0 && (
                    <div className="mt-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-[6px] p-4">
                      <div className="flex justify-between text-[12px] font-bold text-[#5F6368] mb-2">
                        <span>Uploading Video...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                        <div className="bg-[#111111] h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* ── Right Column: Settings & Media ── */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Settings Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#111111] mb-4">Settings</h2>
              
              <label className="flex items-center gap-3 p-4 rounded-[6px] border border-[#E5E7EB] cursor-pointer hover:bg-[#F8F9FA] transition-colors">
                <input
                  type="checkbox"
                  checked={isPreviewFree}
                  onChange={() => setIsPreviewFree(!isPreviewFree)}
                  className="w-4 h-4 text-[#FFD400] bg-white border-[#E5E7EB] rounded focus:ring-[#FFD400] focus:ring-2 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-[#111111] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#5F6368]" /> Free Preview
                  </span>
                  <span className="text-[12px] font-medium text-[#5F6368] mt-0.5">
                    Allow students to watch before buying
                  </span>
                </div>
              </label>
            </div>

            {/* Current Video Preview */}
            {currentVideoUrl && (
              <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm">
                <h2 className="text-[16px] font-bold text-[#111111] mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Active Video
                </h2>
                <p className="text-[12px] font-medium text-[#5F6368] mb-4">
                  Currently playing for enrolled students.
                </p>
                <div className="w-full aspect-video rounded-[6px] overflow-hidden bg-black border border-[#E5E7EB]">
                  <ReactPlayer
                    url={currentVideoUrl}
                    width="100%"
                    height="100%"
                    controls={true}
                    light={true}
                  />
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="bg-white border border-red-200 rounded-[8px] p-6 shadow-sm">
              <h2 className="text-[16px] font-bold text-red-600 mb-1 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Danger Zone
              </h2>
              <p className="text-[12px] font-medium text-[#5F6368] mb-4">
                Permanently delete this lecture and its video file.
              </p>
              <button 
                onClick={removeLecture} disabled={loading1}
                className="w-full h-[40px] bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white text-[13px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {loading1 ? <ClipLoader size={16} color="currentColor" /> : <><Trash2 className="w-4 h-4" /> Delete Lecture</>}
              </button>
            </div>
            
          </div>
        </div>
      </main>

      {/* ── Fixed Bottom Footer (Save Actions) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-6 lg:px-10 py-4 z-40 flex items-center justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => navigate(`/createlecture/${courseId}`)}
          className="h-[44px] px-6 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#111111] text-[14px] font-bold rounded-[6px] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button 
          onClick={handleEditLecture} disabled={loading}
          className="h-[44px] px-8 bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[14px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-75"
        >
          {loading ? <ClipLoader size={18} color="#111111" /> : "Save Changes"}
        </button>
      </div>

    </div>
  );
}