import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { 
  ArrowLeft, ChevronDown, CheckCircle2, Clock, Trash2, 
  Upload, Image as ImageIcon, Video, AlertCircle, PlayCircle 
} from "lucide-react";

import axiosClient from "../../config/axiosClient.js";
import { setCreatorCourseData } from "../../redux/courseSlice.js";
import img from "../../assets/empty_folder.png";

export default function EditCourse() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const dispatch = useDispatch();
  const thumb = useRef();
  
  const { userData } = useSelector(state => state.user);
  const { creatorCourseData } = useSelector(state => state.course);

  // Form State
  const [selectCourse, setSelectCourse] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("");
  
  // Image State
  const [frontendImage, setFrontendImage] = useState(img);
  const [backendImage, setBackendImage] = useState(null);
  
  // Loading States
  const [loading, setLoading] = useState(false);
  const [loading1, setLoading1] = useState(false);

  const handleThumbnail = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
    }
  };

  const populateForm = (courseData) => {
    setSelectCourse(courseData);
    setTitle(courseData.title || "");
    setSubTitle(courseData.subTitle || "");
    setDescription(courseData.description || "");
    setCategory(courseData.category || "");
    setLevel(courseData.level || "");
    setPrice(courseData.price || "");
    setFrontendImage(courseData.thumbnail || img);
    setIsPublished(courseData.isPublished ?? false);
  };

  useEffect(() => {
    // Populate instantly from cache
    if (Array.isArray(creatorCourseData)) {
      const cached = creatorCourseData.find(c => c._id === courseId);
      if (cached) populateForm(cached);
    }

    // Fetch authoritative
    const fetchCourseData = async () => {
      try {
        const result = await axiosClient.get(`/api/course/getcourse/${courseId}`);
        if (result.data) populateForm(result.data);
      } catch (error) {
        console.log("Could not fetch course from server:", error);
      }
    };
    fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleEditCourse = async () => {
    if (isPublished) {
      if (!title || !category || !level || !price) {
        toast.error("Title, Category, Level, and Price are required to publish.");
        setIsPublished(false);
        return;
      }
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("subTitle", subTitle);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("level", level);
    formData.append("price", price);
    formData.append("isPublished", isPublished);

    if (backendImage) {
      formData.append("courseImage", backendImage);
    }

    try {
      const result = await axiosClient.post(`/api/course/editcourse/${courseId}`, formData);
      const updatedCourse = result.data?.course ?? result.data;
      const currentCourses = Array.isArray(creatorCourseData) ? creatorCourseData : [];

      const updatedList = currentCourses.map(c => c._id === courseId ? { ...c, ...updatedCourse } : c);
      dispatch(setCreatorCourseData(updatedList));

      setLoading(false);
      toast.success(result.data.message || "Course Updated Successfully");
      navigate("/courses");
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error(error.response?.data?.message || "Failed to update course");
    }
  };
  
  const handleRemoveCourse = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this course?")) return;
    setLoading1(true);
    try {
      await axiosClient.delete(`/api/course/remove/${courseId}`);
      const currentCourses = Array.isArray(creatorCourseData) ? creatorCourseData : [];
      const filterCourses = currentCourses.filter(c => c._id !== courseId);
      dispatch(setCreatorCourseData(filterCourses));
      setLoading1(false);
      toast.success("Course Removed");
      navigate("/courses");
    } catch (error) {
      console.log(error);
      setLoading1(false);
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111111] font-sans antialiased selection:bg-[#FFD400]/30 pb-20">
      
      {/* ── Main Layout ── */}
      <main className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8">
        
        {/* Page Header */}
        <button 
          onClick={() => navigate("/courses")} 
          className="flex items-center gap-2 text-[#5F6368] hover:text-[#111111] font-semibold text-[13px] transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[32px] font-extrabold text-[#111111] leading-tight tracking-tight">Edit Course</h1>
            <p className="text-[15px] font-medium text-[#5F6368] mt-1">Configure your course details and settings.</p>
          </div>
          <button 
            onClick={() => navigate(`/createlecture/${selectCourse?._id}`)}
            className="h-[44px] px-5 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#111111] text-[14px] font-bold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
          >
            <PlayCircle className="w-4 h-4 text-[#FFD400]" /> Curriculum Editor
          </button>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ── Left Column: Basic Details ── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-8 shadow-sm">
              <h2 className="text-[18px] font-bold text-[#111111] mb-6">Basic Information</h2>
              
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-[13px] font-bold text-[#111111] mb-2">Course Title</label>
                  <input
                    id="title" type="text"
                    placeholder="e.g. Complete Web Development Bootcamp"
                    value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[6px] text-[14px] text-[#111111] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400] transition-shadow"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label htmlFor="subtitle" className="block text-[13px] font-bold text-[#111111] mb-2">Subtitle</label>
                  <input
                    id="subtitle" type="text"
                    placeholder="A brief summary of what this course offers"
                    value={subTitle} onChange={(e) => setSubTitle(e.target.value)}
                    className="w-full h-[46px] px-4 bg-white border border-[#E5E7EB] rounded-[6px] text-[14px] text-[#111111] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400] transition-shadow"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-[13px] font-bold text-[#111111] mb-2">Description</label>
                  <textarea
                    id="description"
                    placeholder="Provide a detailed description of the course content..."
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-[120px] p-4 bg-white border border-[#E5E7EB] rounded-[6px] text-[14px] text-[#111111] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400] transition-shadow resize-none"
                  />
                </div>
                
                {/* 3-Col Grid for Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-[13px] font-bold text-[#111111] mb-2">Category</label>
                    <div className="relative">
                      <select
                        id="category" value={category} onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-[46px] px-4 appearance-none bg-white border border-[#E5E7EB] rounded-[6px] text-[14px] text-[#111111] focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400] transition-shadow"
                      >
                        <option value="" disabled>Select Category</option>
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

                  {/* Level */}
                  <div>
                    <label htmlFor="level" className="block text-[13px] font-bold text-[#111111] mb-2">Level</label>
                    <div className="relative">
                      <select
                        id="level" value={level} onChange={(e) => setLevel(e.target.value)}
                        className="w-full h-[46px] px-4 appearance-none bg-white border border-[#E5E7EB] rounded-[6px] text-[14px] text-[#111111] focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400] transition-shadow"
                      >
                        <option value="" disabled>Select Level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <label htmlFor="price" className="block text-[13px] font-bold text-[#111111] mb-2">Price (INR)</label>
                    <div className="relative flex items-center h-[46px] bg-white border border-[#E5E7EB] rounded-[6px] px-4 focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400] transition-shadow">
                      <span className="text-[#9CA3AF] font-bold mr-2">₹</span>
                      <input
                        id="price" type="number"
                        placeholder="0"
                        value={price} onChange={(e) => setPrice(e.target.value)}
                        className="w-full h-full bg-transparent text-[14px] text-[#111111] placeholder-[#9CA3AF] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Right Column: Settings & Media ── */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Status Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#111111] mb-4">Course Status</h2>
              <div className="p-4 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-[#111111]">Current State</p>
                  {isPublished ? (
                    <span className="inline-flex items-center gap-1 mt-1 text-[12px] font-bold text-[#22C55E]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-1 text-[12px] font-bold text-[#5F6368]">
                      <Clock className="w-3.5 h-3.5" /> Draft
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setIsPublished(!isPublished)}
                className={`w-full h-[40px] text-[13px] font-bold rounded-[6px] transition-all cursor-pointer ${
                  isPublished 
                    ? "bg-white border border-[#E5E7EB] text-[#111111] hover:bg-[#F8F9FA]" 
                    : "bg-[#111111] text-white hover:bg-[#222222]"
                }`}
              >
                {isPublished ? "Unpublish Course" : "Publish Course"}
              </button>
            </div>

            {/* Thumbnail Card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#111111] mb-4">Thumbnail</h2>
              <input type="file" hidden ref={thumb} accept="image/*" onChange={handleThumbnail}/>
              
              <div 
                onClick={() => thumb.current.click()}
                className="w-full aspect-video bg-[#F8F9FA] border-2 border-dashed border-[#E5E7EB] rounded-[6px] overflow-hidden group cursor-pointer relative flex items-center justify-center hover:border-[#FFD400] hover:bg-[#FFD400]/5 transition-colors"
              >
                {frontendImage && frontendImage !== img ? (
                  <>
                    <img src={frontendImage} className="w-full h-full object-cover" alt="Thumbnail" />
                    <div className="absolute inset-0 bg-[#111111]/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-[13px] font-bold">Replace Image</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-[#9CA3AF] group-hover:text-[#FFD400] transition-colors">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-[13px] font-bold text-[#5F6368]">Upload Thumbnail</span>
                    <span className="text-[11px] font-medium mt-1">16:9 ratio recommended</span>
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white border border-red-200 rounded-[8px] p-6 shadow-sm">
              <h2 className="text-[16px] font-bold text-red-600 mb-1 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Danger Zone
              </h2>
              <p className="text-[12px] font-medium text-[#5F6368] mb-4">
                Permanently delete this course and all associated data.
              </p>
              <button 
                onClick={handleRemoveCourse} disabled={loading1}
                className="w-full h-[40px] bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white text-[13px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {loading1 ? <ClipLoader size={16} color="currentColor" /> : <><Trash2 className="w-4 h-4" /> Delete Course</>}
              </button>
            </div>
            
          </div>
        </div>
      </main>

      {/* ── Fixed Bottom Footer (Save Actions) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-6 lg:px-10 py-4 z-40 flex items-center justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => navigate("/courses")}
          className="h-[44px] px-6 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#111111] text-[14px] font-bold rounded-[6px] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button 
          onClick={handleEditCourse} disabled={loading}
          className="h-[44px] px-8 bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[14px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-75"
        >
          {loading ? <ClipLoader size={18} color="#111111" /> : "Save Changes"}
        </button>
      </div>

    </div>
  );
}