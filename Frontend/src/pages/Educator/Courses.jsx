import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { 
  ArrowLeft, Plus, ChevronDown, BookOpen, Edit3, Image as ImageIcon, 
  CheckCircle2, Clock, X, PlusCircle, Type, LayoutList 
} from "lucide-react";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";

import axiosClient from "../../config/axiosClient.js";
import { setCreatorCourseData } from "../../redux/courseSlice.js";

export default function Courses() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const { creatorCourseData: reduxCourseData } = useSelector((state) => state.course);
  
  const [localCourseData, setLocalCourseData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("create") === "true") {
      setIsCreateModalOpen(true);
      navigate("/courses", { replace: true });
    }
  }, [location.search, navigate]);
  
  const creatorCourseData = localCourseData !== null ? localCourseData : reduxCourseData;

  useEffect(() => {
    if (!userData) return;
    
    const fetchCreatorCourses = async () => {
      setIsLoading(true);
      try {
        setFetchError(null);
        const result = await axiosClient.get(`/api/course/getcreator?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        
        let courses = result.data;
        if (!Array.isArray(courses) && courses?.courses) {
          courses = courses.courses;
        }
        
        setLocalCourseData(courses);
        dispatch(setCreatorCourseData(courses));
      } catch (error) {
        setFetchError(error.response?.data?.message || error.message || "Failed to load courses.");
        setLocalCourseData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCreatorCourses();
  }, [userData, dispatch]);

  const handleCreateCourse = async () => {
    if (!title.trim() || !category) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsCreating(true);
    try {
      const result = await axiosClient.post(`/api/course/create`, { title, category });
      const newCourse = result.data?.course ?? result.data;
      
      const existing = Array.isArray(creatorCourseData) ? creatorCourseData : [];
      const updatedList = [...existing, newCourse];
      
      setLocalCourseData(updatedList);
      dispatch(setCreatorCourseData(updatedList));
      
      toast.success("Course Created Successfully");
      setIsCreateModalOpen(false);
      setTitle("");
      setCategory("");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message ?? "Failed to create course");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111111] font-sans antialiased selection:bg-[#FFD400]/30 pb-20 relative">
      


      {/* ── Main Content ── */}
      <main className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 space-y-8">
        
        {/* Error Handling */}
        {fetchError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-[8px] flex items-center gap-3">
            <Clock className="w-5 h-5 shrink-0" />
            <span className="text-[14px] font-medium">{fetchError}</span>
          </div>
        )}

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-extrabold text-[#111111] leading-tight tracking-tight">Created Courses</h1>
            <p className="text-[15px] font-medium text-[#5F6368] mt-1">Manage and edit your published and draft courses.</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="h-[44px] px-5 bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[14px] font-bold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Create New Course
          </button>
        </div>

        {/* ── Desktop Table ── */}
        <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-[8px] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB]">
                <th className="py-4 px-6 text-[13px] font-bold text-[#5F6368] uppercase tracking-wider w-[50%]">Course</th>
                <th className="py-4 px-6 text-[13px] font-bold text-[#5F6368] uppercase tracking-wider">Price</th>
                <th className="py-4 px-6 text-[13px] font-bold text-[#5F6368] uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-[13px] font-bold text-[#5F6368] uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-[#9CA3AF] text-[14px] font-medium">Loading courses...</td>
                </tr>
              ) : creatorCourseData?.length > 0 ? (
                creatorCourseData.map((course, index) => (
                  <tr key={index} className="border-b border-[#E5E7EB] hover:bg-[#F8F9FA] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-16 shrink-0 rounded-[6px] overflow-hidden bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center">
                          <img src={course?.thumbnail || import.meta.env.VITE_DEFAULT_COURSE_THUMBNAIL} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-[#111111] line-clamp-1">{course?.title || "Untitled Course"}</span>
                          <span className="text-[12px] text-[#9CA3AF] font-medium mt-1">{course?.lectures?.length || 0} Lectures</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[14px] font-bold text-[#111111]">
                        {course?.price ? `₹${course.price.toLocaleString()}` : <span className="text-[#9CA3AF]">Not set</span>}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {course?.isPublished ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#F8F9FA] text-[#5F6368] border border-[#E5E7EB]">
                          <Clock className="w-3.5 h-3.5" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => navigate(`/editcourse/${course?._id}`)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-[6px] border border-[#E5E7EB] bg-white text-[#9CA3AF] hover:text-[#111111] hover:border-[#111111] hover:bg-[#F8F9FA] transition-all cursor-pointer shadow-sm"
                        title="Edit Course"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-16">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#F8F9FA] flex items-center justify-center border border-[#E5E7EB]">
                        <BookOpen className="w-5 h-5 text-[#9CA3AF]" />
                      </div>
                      <p className="text-[14px] font-bold text-[#111111]">No courses created yet.</p>
                      <p className="text-[13px] text-[#5F6368]">Click 'Create New Course' to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Cards ── */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-[#9CA3AF] text-[14px] font-medium">Loading courses...</div>
          ) : creatorCourseData?.length > 0 ? (
            creatorCourseData.map((course, index) => (
              <div key={index} className="bg-white border border-[#E5E7EB] rounded-[8px] p-4 shadow-sm flex flex-col gap-4">
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-16 shrink-0 rounded-[6px] overflow-hidden bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center">
                    <img src={course?.thumbnail || import.meta.env.VITE_DEFAULT_COURSE_THUMBNAIL} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-[14px] font-bold text-[#111111] line-clamp-2">{course?.title || "Untitled Course"}</span>
                    <span className="text-[14px] font-bold text-[#111111] mt-2">
                      {course?.price ? `₹${course.price.toLocaleString()}` : <span className="text-[#9CA3AF]">Not set</span>}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                  {course?.isPublished ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                      <CheckCircle2 className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-bold bg-[#F8F9FA] text-[#5F6368] border border-[#E5E7EB]">
                      <Clock className="w-3 h-3" /> Draft
                    </span>
                  )}
                  <button 
                    onClick={() => navigate(`/editcourse/${course?._id}`)}
                    className="inline-flex items-center gap-1.5 px-3 h-[32px] rounded-[6px] border border-[#E5E7EB] bg-white text-[12px] font-bold text-[#111111] cursor-pointer shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 bg-white border border-[#E5E7EB] rounded-[8px] text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F8F9FA] flex items-center justify-center border border-[#E5E7EB]">
                <BookOpen className="w-5 h-5 text-[#9CA3AF]" />
              </div>
              <p className="text-[14px] font-bold text-[#111111]">No courses found.</p>
            </div>
          )}
        </div>

      </main>

      {/* ── CREATE COURSE MODAL OVERLAY ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#111111]/40 backdrop-blur-sm transition-opacity">
          
          <div className="bg-white w-full max-w-[600px] border border-[#E5E7EB] rounded-[8px] shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Close Button */}
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-[#5F6368] hover:text-[#111111] hover:bg-[#F3F4F6] p-1.5 rounded-full transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-[#E5E7EB] bg-white flex flex-col items-center text-center mt-2">
              {/* Brand Logo */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3.5 h-3.5 bg-[#FFD400] rounded-sm shrink-0"></span>
                <span className="text-xs font-semibold tracking-wide uppercase">VirtualCourses</span>
              </div>
              <h1 className="text-[24px] font-extrabold text-[#111111] leading-tight tracking-tight">Create a Course</h1>
              <p className="text-[14px] font-medium text-[#5F6368] mt-1.5 max-w-[300px]">
                Set up the foundational details for your new course to get started.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-8 pb-10 space-y-5 bg-[#F8F9FA]">
              <form onSubmit={(e) => { e.preventDefault(); handleCreateCourse(); }} className="space-y-4">
                
                {/* Title Input */}
                <div className="space-y-1.5">
                  <label htmlFor="title" className="block text-xs font-semibold text-[#111111]">
                    Course Title
                  </label>
                  <div className="relative flex items-center h-[50px] bg-white border border-[#E5E7EB] rounded-[6px] px-3.5 focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400] transition-shadow">
                    <Type className="w-4.5 h-4.5 text-[#9CA3AF] mr-2.5 shrink-0" />
                    <input
                      id="title"
                      type="text"
                      placeholder="Enter Course Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-full bg-transparent text-[13px] text-[#111111] placeholder-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                </div>
                
                {/* Category Dropdown */}
                <div className="space-y-1.5 pb-2">
                  <label htmlFor="category" className="block text-xs font-semibold text-[#111111]">
                    Course Category
                  </label>
                  <div className="relative flex items-center h-[50px] bg-white border border-[#E5E7EB] rounded-[6px] px-3.5 focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400] transition-shadow">
                    <LayoutList className="w-4.5 h-4.5 text-[#9CA3AF] mr-2.5 shrink-0" />
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-full bg-transparent text-[13px] text-[#111111] focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="text-[#9CA3AF]">Select Category</option>
                      <option value="App Development">App Development</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="AI Tools">AI Tools</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Data Analytics">Data Analytics</option>
                      <option value="Ethical Hacking">Ethical Hacking</option>
                      <option value="UI UX Designing">UI UX Designing</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Others">Others</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="w-full h-[48px] bg-[#FFD400] hover:bg-[#e6be00] active:scale-[0.99] text-[#111111] text-sm font-semibold rounded-[6px] transition-all flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-75 disabled:cursor-not-allowed mt-2"
                >
                  {isCreating ? <ClipLoader size={20} color="#111111" /> : "Create Course"}
                </button>
              </form>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}