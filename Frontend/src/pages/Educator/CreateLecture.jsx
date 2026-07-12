import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners'; 
import { 
  ArrowLeft, ChevronDown, PlayCircle, PlusCircle, 
  Edit3, Video, FileVideo, LayoutList
} from "lucide-react";

import axiosClient from '../../config/axiosClient.js';
import { setLectureData } from '../../redux/lectureSlice.js';

export default function CreateLecture() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { userData } = useSelector(state => state.user);
  const { lectureData } = useSelector(state => state.lecture);

  const [lectureTitle, setLectureTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const getCourseLecture = async () => {
      if (!courseId) return;
      setIsFetching(true);
      try {
        const result = await axiosClient.get(`/api/course/courselecture/${courseId}`);
        const fetchedLectures = result.data.lectures || result.data.lecture || [];
        dispatch(setLectureData(fetchedLectures));
      } catch (error) {
        console.error("Failed to fetch lectures:", error);
      } finally {
        setIsFetching(false);
      }
    };
    getCourseLecture();
  }, [courseId, dispatch]);

  const handleCreateLecture = async () => {
    if (!lectureTitle.trim()) {
      toast.error("Please enter a lecture title.");
      return;
    }
    
    setLoading(true);
    try {
      const result = await axiosClient.post(`/api/course/createlecture/${courseId}`, { lectureTitle });
      
      const currentLectures = Array.isArray(lectureData) ? lectureData : [];
      dispatch(setLectureData([...currentLectures, result.data.lecture]));
      
      toast.success("Lecture Created Successfully");
      setLectureTitle("");
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || "Failed to create lecture";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111111] font-sans antialiased selection:bg-[#FFD400]/30 pb-20">
      
      {/* ── Main Layout ── */}
      <main className="max-w-[800px] mx-auto px-6 lg:px-10 py-10">
        
        {/* Page Header */}
        <button 
          onClick={() => navigate(`/editcourse/${courseId}`)} 
          className="flex items-center gap-2 text-[#5F6368] hover:text-[#111111] font-semibold text-[13px] transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Course
        </button>

        <div className="flex flex-col mb-8">
          <h1 className="text-[32px] font-extrabold text-[#111111] leading-tight tracking-tight">Curriculum Editor</h1>
          <p className="text-[15px] font-medium text-[#5F6368] mt-1">Structure your course by adding video lectures and resources.</p>
        </div>

        <div className="space-y-8">
          
          {/* ── Add Lecture Card ── */}
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#FFD400]/10 flex items-center justify-center shrink-0">
                <PlusCircle className="w-5 h-5 text-[#FFD400]" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-[#111111]">Add New Lecture</h2>
                <p className="text-[13px] font-medium text-[#5F6368]">Create a new lecture section before uploading the video.</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateLecture(); }} className="flex flex-col sm:flex-row items-stretch gap-4">
              <div className="relative flex-1 flex items-center h-[46px] bg-white border border-[#E5E7EB] rounded-[6px] px-4 focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400] transition-shadow">
                <PlayCircle className="w-4.5 h-4.5 text-[#9CA3AF] mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Introduction to MERN Stack"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  className="w-full h-full bg-transparent text-[14px] text-[#111111] placeholder-[#9CA3AF] focus:outline-none"
                />
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="h-[46px] px-6 bg-[#111111] hover:bg-[#222222] text-white text-[14px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-75 shrink-0"
              >
                {loading ? <ClipLoader size={18} color="#ffffff" /> : "Create Lecture"}
              </button>
            </form>
          </div>

          {/* ── Lectures List ── */}
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-[#E5E7EB] bg-[#F8F9FA] flex items-center gap-3">
              <LayoutList className="w-5 h-5 text-[#5F6368]" />
              <h2 className="text-[16px] font-bold text-[#111111]">Course Syllabus</h2>
              <span className="ml-auto inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-[#E5E7EB] text-[#5F6368]">
                {Array.isArray(lectureData) ? lectureData.length : 0} Lectures
              </span>
            </div>

            <div className="divide-y divide-[#E5E7EB]">
              {isFetching ? (
                <div className="py-12 text-center text-[#9CA3AF] text-[14px] font-medium">Loading syllabus...</div>
              ) : Array.isArray(lectureData) && lectureData.length > 0 ? (
                lectureData.map((lecture, index) => (
                  <div key={lecture._id || index} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8F9FA] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                        <FileVideo className="w-5 h-5 text-[#9CA3AF]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-[#5F6368] uppercase tracking-wider mb-0.5">
                          Lecture {index + 1}
                        </span>
                        <span className="text-[14px] font-bold text-[#111111] leading-tight">
                          {lecture.lectureTitle}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/editlecture/${courseId}/${lecture._id}`)}
                      className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[6px] border border-[#E5E7EB] bg-white text-[#5F6368] hover:text-[#111111] hover:border-[#111111] transition-all cursor-pointer shadow-sm sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Edit3 className="w-4 h-4" /> <span className="text-[13px] font-bold">Edit Details</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#F8F9FA] flex items-center justify-center border border-[#E5E7EB]">
                    <Video className="w-5 h-5 text-[#9CA3AF]" />
                  </div>
                  <p className="text-[14px] font-bold text-[#111111]">No lectures created yet.</p>
                  <p className="text-[13px] text-[#5F6368]">Your course syllabus is currently empty.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}