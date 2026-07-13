import { useState, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, Search, Bell, Heart, CheckCircle2, PlayCircle, Clock, 
  BarChart, Globe, Lock, Play, ChevronDown, ChevronUp, FileText, 
  Download, Calendar, ShieldCheck, Smartphone, Award, Star, Check, User, Tag
} from "lucide-react";
import { BsPip } from "react-icons/bs";
import { FaStar, FaPlayCircle, FaLock, FaBroadcastTower } from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";

import { setSelectedCourse } from "../redux/courseSlice.js";
import axiosClient from "../config/axiosClient.js";
import Card from "../components/Card.jsx";
import AIExplainer from "../components/AIExplainer.jsx";
import img from "../assets/empty_folder.png";

export default function ViewCourse() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { courseData, selectedCourse } = useSelector((state) => state.course);
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [selectedLecture, setSelectedLecture] = useState(null);
  const [creatorData, setCreatorData] = useState(null);
  const [prevCourseId, setPrevCourseId] = useState(courseId);
  const [isLive, setIsLive] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Curriculum");

  if (courseId !== prevCourseId) {
    setPrevCourseId(courseId);
    setSelectedLecture(null);
  }

  /* ── Scroll to top on nav ── */
  useEffect(() => { window.scrollTo(0, 0); }, [courseId]);

  /* ── Live status poll every 30s ── */
  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const res = await axiosClient.get(`/api/live/details/${courseId}`);
        setIsLive(res.data?.success ?? false);
      } catch { setIsLive(false); }
    };
    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 30000);
    return () => clearInterval(interval);
  }, [courseId]);

  /* ── Sync selected course from Redux ── */
  useEffect(() => {
    if (courseData?.length > 0) {
      const found = courseData.find((c) => c._id === courseId);
      if (found) dispatch(setSelectedCourse(found));
    }
  }, [courseData, courseId, dispatch]);

  /* ── Fetch creator data ── */
  useEffect(() => {
    const fetchCreator = async () => {
      if (!selectedCourse?.creator) return;
      try {
        const res = await axiosClient.post(`/api/course/creator`, { userId: selectedCourse.creator });
        setCreatorData(res.data);
      } catch (e) { console.error(e); }
    };
    fetchCreator();
  }, [selectedCourse]);

  /* ── Enrollment checks ── */
  const isAlreadyEnrolled = userData?.enrolledCourses?.some(
    (c) => (typeof c === "string" ? c : c._id).toString() === courseId?.toString()
  );
  const isCourseCreator = userData?.role === "educator" && selectedCourse?.creator === userData?._id;
  const isEnrolled = isAlreadyEnrolled || paymentSuccess || isCourseCreator;

  /* ── Auto-advance ── */
  const handleVideoEnded = () => {
    const idx = selectedCourse?.lectures?.findIndex((l) => l.lectureTitle === selectedLecture?.lectureTitle);
    if (idx !== -1 && idx < selectedCourse.lectures.length - 1) {
      const next = selectedCourse.lectures[idx + 1];
      if (next.isPreviewFree || isEnrolled) {
        setSelectedLecture(next);
        toast.info(`Playing Next: ${next.lectureTitle}`);
      }
    }
  };

  /* ── Resume playback (memory) ── */
  const handleTimeUpdate = () => {
    if (videoRef.current && selectedLecture && videoRef.current.currentTime > 0) {
      localStorage.setItem(`${courseId}-${selectedLecture.lectureTitle}`, videoRef.current.currentTime);
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current && selectedLecture) {
      const saved = localStorage.getItem(`${courseId}-${selectedLecture.lectureTitle}`);
      if (saved) videoRef.current.currentTime = parseFloat(saved);
      videoRef.current.volume = 1;
      videoRef.current.muted = false;
    }
  };

  /* ── PiP ── */
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (videoRef.current) await videoRef.current.requestPictureInPicture();
    } catch { toast.error("PiP not supported"); }
  };

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement.tagName.toUpperCase();
      if (tag === "INPUT" || tag === "TEXTAREA" || !videoRef.current) return;
      const v = videoRef.current;
      switch (e.key.toLowerCase()) {
        case " ": case "k": e.preventDefault(); v.paused ? v.play() : v.pause(); break;
        case "arrowright": case "l": v.currentTime += 10; break;
        case "arrowleft": case "j": v.currentTime -= 10; break;
        case "arrowup": v.volume = Math.min(1, v.volume + 0.1); break;
        case "arrowdown": v.volume = Math.max(0, v.volume - 0.1); break;
        case "f": document.fullscreenElement ? document.exitFullscreen() : v.requestFullscreen(); break;
        case "m": v.muted = !v.muted; break;
        case "p": togglePiP(); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Razorpay enroll ── */
  const handleEnroll = async (userId, courseId) => {
    try {
      const orderData = await axiosClient.post(`/api/order/razorpay-order`, { userId, courseId });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: "INR",
        name: "VirtualCourses",
        description: "Course Enrollment Payment",
        order_id: orderData.data.id,
        handler: async (response) => {
          try {
            const verify = await axiosClient.post(`/api/order/verifypayment`, { ...response, courseId, userId });
            setPaymentSuccess(true);
            toast.success(verify.data.message);
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed");
          }
        },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while enrolling.");
    }
  };

  /* ── Review ── */
  const handleReview = async () => {
    setLoading(true);
    try {
      await axiosClient.post(`/api/review/createreview`, { rating, comment, courseId });
      setLoading(false);
      toast.success("Review Added");
      setRating(0);
      setComment("");
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || "Error adding review");
    }
  };

  const calculateAvgReview = (reviews) => {
    if (!reviews?.length) return 0;
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  };
  const avgRating = calculateAvgReview(selectedCourse?.reviews);

  /* ── Dynamic Pricing ── */
  const BASE_PRICE = 2000;
  const coursePrice = selectedCourse?.price || 0;
  const discountPercentage = coursePrice > 0 && coursePrice < BASE_PRICE 
    ? Math.floor(((BASE_PRICE - coursePrice) / BASE_PRICE) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans antialiased pb-20 selection:bg-[#FFD400]/30">


      {/* ── Breadcrumb ── */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-5">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#9CA3AF]">
          <span onClick={() => navigate("/")} className="cursor-pointer hover:text-[#111111] transition-colors">Home</span>
          <span className="text-[#E5E7EB]">›</span>
          <span onClick={() => navigate("/allcourses")} className="cursor-pointer hover:text-[#111111] transition-colors">{selectedCourse?.category || "Category"}</span>
          <span className="text-[#E5E7EB]">›</span>
          <span className="text-[#111111] font-semibold">{selectedCourse?.title || "Course"}</span>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

        {/* ════════════════════════════
            HERO SECTION (3 COLUMNS)
        ════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* Col 1: Thumbnail (40%) */}
          <div className="w-full lg:w-[40%] shrink-0">
            <div className="rounded-[8px] overflow-hidden border border-[#E5E7EB] bg-[#F8F9FA] aspect-video relative group cursor-pointer shadow-sm">
              <img
                src={selectedCourse?.thumbnail || import.meta.env.VITE_DEFAULT_COURSE_THUMBNAIL || img}
                alt={selectedCourse?.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-all">
                <div className="w-16 h-16 bg-white text-[#111111] rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Play className="w-6 h-6 ml-1" fill="currentColor" />
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Info (32%) */}
          <div className="w-full lg:w-[32%] flex flex-col pt-1 shrink-0">
            {/* Badges */}
            <div className="flex items-center gap-3 mb-4">
              {selectedCourse?.createdAt && (
                <span className="px-2.5 py-1 text-[11px] font-semibold text-[#5F6368] bg-[#F8F9FA] border border-[#E5E7EB] rounded-[4px]">
                  Published: {new Date(selectedCourse.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>

            <h1 className="text-[40px] font-bold text-[#111111] leading-[1.1] tracking-tight mb-4">
              {selectedCourse?.title || "Course Title"}
            </h1>

            {/* Ratings & Students */}
            <div className="flex items-center flex-wrap gap-3 text-[14px] mb-5 font-medium">
              <div className="flex items-center gap-0.5 text-[#FFD400]">
                {[1,2,3,4,5].map((s) => (
                  <FaStar key={s} className={`w-4 h-4 ${s <= Math.round(avgRating) ? "text-[#FFD400]" : "text-[#E5E7EB]"}`} />
                ))}
              </div>
              <span className="font-bold text-[#111111]">{avgRating}</span>
              <span className="text-[#5F6368]">({selectedCourse?.reviews?.length || 0} reviews)</span>
              <span className="text-[#E5E7EB]">•</span>
              <span className="text-[#5F6368]">{selectedCourse?.enrolledStudents?.length || 0} students</span>
            </div>

            {/* Metadata Chips */}
            <div className="flex flex-wrap gap-2.5 mb-5">
              {selectedCourse?.category && (
                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#111111] bg-white border border-[#E5E7EB] rounded-[6px] px-3 py-1.5 shadow-sm">
                  <Tag className="w-3.5 h-3.5 text-[#5F6368]" />{selectedCourse.category}
                </span>
              )}
              {selectedCourse?.level && (
                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#111111] bg-white border border-[#E5E7EB] rounded-[6px] px-3 py-1.5 shadow-sm">
                  <BarChart className="w-3.5 h-3.5 text-[#5F6368]" />{selectedCourse.level}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-[15px] text-[#5F6368] leading-relaxed max-w-[500px]">
              {selectedCourse?.description || selectedCourse?.subTitle || "No description provided."}
            </p>
          </div>

          {/* Col 3: Sticky Purchase Card (28%) */}
          <div className="w-full lg:w-[28%] shrink-0">
            <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm sticky top-[104px]">
              
              {/* Price block */}
              <div className="mb-5 flex items-center gap-3">
                <span className="text-[32px] font-extrabold text-[#111111] leading-none">₹{coursePrice}</span>
                {discountPercentage > 0 && (
                  <>
                    <span className="text-[16px] text-[#9CA3AF] line-through font-semibold">₹{BASE_PRICE}</span>
                    <span className="px-2 py-0.5 text-[11px] font-bold text-[#FFD400] bg-[#FFD400]/10 border border-[#FFD400]/30 rounded-[4px]">{discountPercentage}% OFF</span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {!isEnrolled ? (
                  <button
                    onClick={() => handleEnroll(userData?._id, courseId)}
                    className="w-full h-[52px] bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[15px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <PlayCircle className="w-5 h-5" /> Enroll Now
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if(selectedCourse?.lectures?.length > 0) {
                        setSelectedLecture(selectedCourse.lectures[0]);
                        window.scrollTo({ top: 800, behavior: 'smooth' });
                      }
                    }}
                    className="w-full h-[52px] bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[15px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <PlayCircle className="w-5 h-5" /> Continue Learning
                  </button>
                )}

                {(isLive || isCourseCreator) && (
                  <button
                    onClick={() => navigate(`/course/live/${courseId}`)}
                    className="w-full h-[52px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#111111] text-[15px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-5 h-5" /> Join Live Doubt Session
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 mb-10 border-t border-[#E5E7EB]" />

        {/* ════════════════════════════
            LOWER 2-COLUMN LAYOUT
        ════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Main Content (Left ~72%) */}
          <div className="w-full lg:w-[72%] flex flex-col">

            {/* Video Player (Renders above curriculum if a lecture is selected) */}
            {selectedLecture && (
              <div className="bg-white border border-[#E5E7EB] rounded-[8px] overflow-hidden mb-10 shadow-sm">
                <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#111111]">{selectedLecture.lectureTitle}</h3>
                    <p className="text-[13px] text-[#5F6368] mt-1">Lecture</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={togglePiP} className="flex items-center gap-1.5 h-[36px] px-3 border border-[#E5E7EB] bg-white text-[#5F6368] text-[13px] font-bold rounded-[6px] hover:bg-[#F8F9FA] transition-colors cursor-pointer shadow-sm">
                      <BsPip className="w-4 h-4" /> PiP
                    </button>
                  </div>
                </div>
                
                <div className="aspect-video w-full bg-[#111111] flex items-center justify-center relative">
                  <video
                    ref={videoRef}
                    key={selectedLecture.videoUrl}
                    src={selectedLecture.videoUrl}
                    className="w-full h-full object-contain"
                    controls controlsList="nodownload" playsInline autoPlay muted={false}
                    onEnded={handleVideoEnded} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleVideoLoaded}
                  />
                </div>

                {selectedLecture._id && (
                  <div className="p-6 bg-white border-t border-[#E5E7EB]">
                    <AIExplainer lectureId={selectedLecture._id} videoRef={videoRef} />
                  </div>
                )}
              </div>
            )}

            {/* Curriculum Accordion */}
            <div className="bg-white border border-[#E5E7EB] rounded-[8px] shadow-sm mb-12">
              <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
                <h3 className="text-[22px] font-bold text-[#111111]">Course Curriculum</h3>
                <span className="text-[14px] font-medium text-[#5F6368]">{selectedCourse?.lectures?.length || 0} Lectures</span>
              </div>
              
              <div className="flex flex-col">
                <div className="border-b border-[#E5E7EB]">
                  {/* Accordion Body */}
                  <div className="bg-white flex flex-col">
                    {selectedCourse?.lectures?.map((lecture, index) => {
                      const accessible = lecture.isPreviewFree || isEnrolled;
                      const active = selectedLecture?.lectureTitle === lecture.lectureTitle;
                      return (
                        <button
                          key={index}
                          disabled={!accessible}
                          onClick={() => accessible && setSelectedLecture(lecture)}
                          className={`w-full flex items-center justify-between px-6 py-4 border-t border-[#E5E7EB] text-left transition-colors cursor-pointer group
                            ${active ? "bg-[#FFD400]/5" : "hover:bg-[#F8F9FA]"}
                            ${!accessible && "opacity-60 cursor-not-allowed"}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`shrink-0 ${active ? "text-[#FFD400]" : "text-[#9CA3AF] group-hover:text-[#111111]"}`}>
                              {lecture.isPreviewFree ? <PlayCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </span>
                            <span className={`text-[14px] font-medium ${active ? "text-[#111111]" : "text-[#5F6368] group-hover:text-[#111111]"}`}>
                              {index + 1}. {lecture.lectureTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[13px] text-[#9CA3AF] font-medium">
                            {active && <CheckCircle2 className="w-4 h-4 text-[#FFD400]" />}
                          </div>
                        </button>
                      );
                    })}
                    {(!selectedCourse?.lectures || selectedCourse.lectures.length === 0) && (
                      <div className="px-6 py-8 text-center text-[#5F6368] text-sm">
                        No lectures have been added to this course yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Write Review Section */}
            <div className="mb-12">
              <h2 className="text-[22px] font-bold text-[#111111] mb-6">Write a Review</h2>
              <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} onClick={() => setRating(s)} className="cursor-pointer p-0.5">
                      <Star className={`w-6 h-6 transition-colors ${s <= rating ? "text-[#FFD400] fill-[#FFD400]" : "text-[#E5E7EB]"}`} />
                    </button>
                  ))}
                </div>
                <div className="border border-[#E5E7EB] rounded-[6px] focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400] transition-shadow mb-4">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this course..."
                    className="w-full px-4 py-3 text-[15px] text-[#111111] placeholder-[#9CA3AF] bg-transparent focus:outline-none resize-y min-h-[160px]"
                  />
                </div>
                <button
                  onClick={handleReview}
                  disabled={loading}
                  className="h-[52px] px-8 bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[15px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {loading ? <ClipLoader size={18} color="#111111" /> : "Submit Review"}
                </button>
              </div>
            </div>

          </div>

          {/* Right Sidebar (Instructor) */}
          <div className="w-full lg:w-[28%] shrink-0">
             <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm mb-8">
               <h3 className="text-[18px] font-bold text-[#111111] mb-6">About the Instructor</h3>
               
               <div className="flex items-center gap-4 mb-5">
                 <div className="w-[72px] h-[72px] rounded-full bg-[#FFD400] flex items-center justify-center text-[28px] font-bold text-[#111111] shrink-0 overflow-hidden">
                   {creatorData?.photoUrl ? (
                      <img src={creatorData.photoUrl} alt="" className="w-full h-full object-cover" />
                   ) : (
                      creatorData?.name?.charAt(0)?.toUpperCase() || "I"
                   )}
                 </div>
                 <div>
                   <div className="flex items-center gap-1.5">
                     <h4 className="text-[16px] font-bold text-[#111111]">{creatorData?.name || "Instructor"}</h4>
                     <ShieldCheck className="w-4 h-4 text-[#FFD400]" />
                   </div>
                   <p className="text-[13px] text-[#5F6368] font-medium mt-0.5">Educator</p>
                 </div>
               </div>

               <p className="text-[14px] text-[#5F6368] leading-relaxed">
                 {creatorData?.description || "No biography provided."}
               </p>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}