import { useState, useMemo, useEffect, useRef } from "react";
import { BsArrowReturnLeft, BsPip } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { setSelectedCourse } from "../redux/courseSlice.js";
import img from "../assets/empty_folder.png";
import { FaStar, FaPlayCircle, FaLock, FaBroadcastTower } from "react-icons/fa"; 
import axiosClient from "../config/axiosClient.js";
import Card from "../components/Card.jsx";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { StripedPattern } from "../components/StripedPattern.jsx";
import AIExplainer from "../components/AIExplainer.jsx"; 

function ViewCourse() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { courseData, selectedCourse } = useSelector((state) => state.course);
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [creatorData, setCreatorData] = useState(null);
  const [prevCourseId, setPrevCourseId] = useState(courseId);
  const [isLive, setIsLive] = useState(false);

  // Reference for the video player
  const videoRef = useRef(null);

  if (courseId !== prevCourseId) {
    setPrevCourseId(courseId);
    setSelectedLecture(null);
  }

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Scroll to Top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [courseId]);

  //Check Live Status & Poll every 30 seconds
  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        // We use a simple GET request to check if a session exists
        const res = await axiosClient.get(`/api/live/details/${courseId}`);
        if (res.data && res.data.success) {
          setIsLive(true);
        } else {
          setIsLive(false);
        }
      } catch (error) {
        setIsLive(false);
        console.error("Failed to fetch live status:", error);
        
      }
    };

    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [courseId]);


  const isAlreadyEnrolled = userData?.enrolledCourses?.some(
    (c) =>
      (typeof c === "string" ? c : c._id).toString() === courseId?.toString(),
  );

  const isEnrolled = isAlreadyEnrolled || paymentSuccess;

  // Robust Data Syncing
  useEffect(() => {
    if (courseData && courseData.length > 0) {
      const foundCourse = courseData.find((course) => course._id === courseId);
      if (foundCourse) {
        dispatch(setSelectedCourse(foundCourse));
      }
    }
  }, [courseData, courseId, dispatch]);

  // Handle Creator Data
  useEffect(() => {
    const handleCreator = async () => {
      if (selectedCourse?.creator) {
        try {
          const result = await axiosClient.post(
            `/api/course/creator`,
            { userId: selectedCourse?.creator }
          );
          setCreatorData(result.data);
        } catch (error) {
          console.error("Failed to fetch creator:", error);
        }
      }
    };
    handleCreator();
  }, [selectedCourse]);

  // Creator Courses
  const creatorCourses = useMemo(() => {
    if (creatorData?._id && courseData?.length > 0) {
      return courseData.filter(
        (course) =>
          course.creator === creatorData?._id && course._id !== courseId,
      );
    }
    return [];
  }, [creatorData, courseData, courseId]);

  // AUTO-ADVANCE 
  const handleVideoEnded = () => {
    const currentIndex = selectedCourse?.lectures?.findIndex(
      (l) => l.lectureTitle === selectedLecture?.lectureTitle
    );

    if (
      currentIndex !== -1 &&
      currentIndex < selectedCourse?.lectures?.length - 1
    ) {
      const nextLecture = selectedCourse?.lectures[currentIndex + 1];

      if (nextLecture.isPreviewFree || isEnrolled) {
        setSelectedLecture(nextLecture);
        toast.info(`Playing Next: ${nextLecture.lectureTitle}`);
      }
    }
  };

  // RESUME PLAYBACK (MEMORY)
  const handleTimeUpdate = () => {
    if (videoRef.current && selectedLecture) {
      const currentTime = videoRef.current.currentTime;
      if (currentTime > 0) {
        localStorage.setItem(
          `${courseId}-${selectedLecture.lectureTitle}`,
          currentTime
        );
      }
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current && selectedLecture) {
      const savedTime = localStorage.getItem(
        `${courseId}-${selectedLecture.lectureTitle}`
      );
      if (savedTime) {
        videoRef.current.currentTime = parseFloat(savedTime);
      }
      videoRef.current.volume = 1;
      videoRef.current.muted = false;
    }
  };

  // PiP LOGIC 
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP failed:", error);
      toast.error("PiP not supported or failed");
    }
  };

  // KEYBOARD SHORTCUTS 
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tagName = document.activeElement.tagName.toUpperCase();
      if (tagName === "INPUT" || tagName === "TEXTAREA") {
        return;
      }

      if (!videoRef.current) return;
      const video = videoRef.current;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          if (video.paused) video.play();
          else video.pause();
          break;
        case "arrowright":
        case "l":
          video.currentTime += 10;
          break;
        case "arrowleft":
        case "j":
          video.currentTime -= 10;
          break;
        case "arrowup":
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case "arrowdown":
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          break;
        case "f":
          if (document.fullscreenElement) document.exitFullscreen();
          else video.requestFullscreen();
          break;
        case "m":
          video.muted = !video.muted;
          break;
        case "p":
          togglePiP();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const handleEnroll = async (userId, courseId) => {
    try {
      const orderData = await axiosClient.post(
        `/api/order/razorpay-order`,
        { userId, courseId }
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.data.amount,
        currency: "INR",
        name: "VirtualCourses",
        description: "Course Enrollment Payment",
        order_id: orderData.data.id,
        handler: async function (response) {
          try {
            const verifyPayment = await axiosClient.post(
              `/api/order/verifypayment`,
              { ...response, courseId, userId }
            );
            setPaymentSuccess(true);
            toast.success(verifyPayment.data.message);
          } catch (error) {
            toast.error(
              error.response?.data?.message || "Payment verification failed",
            );
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while enrolling.");
    }
  };

  const handleReview = async () => {
    setLoading(true);
    try {
      const result = await axiosClient.post(
        `/api/review/createreview`,
        { rating, comment, courseId }
      );
      setLoading(false);
      toast.success("Review Added");
      console.log(result.data);
      setRating(0);
      setComment("");
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || "Error adding review");
      setRating(0);
      setComment("");
    }
  };

  const calculateAvgReview = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const avgRating = calculateAvgReview(selectedCourse?.reviews);

  return (
    <div className="min-h-screen bg-white relative p-6">
      <StripedPattern
        width={30}
        height={30}
        className="fixed inset-0 z-0 opacity-20 text-gray-300"
      />

      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl relative overflow-hidden">
        <StripedPattern
          width={20}
          height={20}
          direction="right"
          className="absolute inset-0 z-0 opacity-30 text-gray-400"
        />

        <div className="relative z-10 p-6 space-y-6">
          {/* Top Section */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            <div className="w-full md:w-1/2">
              <BsArrowReturnLeft
                className="text-[black] w-22px h-22px cursor-pointer hover:scale-110 transition-transform"
                onClick={() => navigate("/allcourses")}
              />
              <div className="mt-4">
                {selectedCourse?.thumbnail ? (
                  <img
                    src={selectedCourse?.thumbnail}
                    alt=""
                    className="rounded-xl w-full object-cover shadow-sm"
                  />
                ) : (
                  <img
                    src={img}
                    alt=""
                    className="rounded-xl w-full object-cover shadow-sm"
                  />
                )}
              </div>
            </div>
            {/* Course Info */}
            <div className="flex-1 space-y-2 mt-[20px]">
              <h2 className="text-2xl font-bold">{selectedCourse?.title}</h2>
              <div className="flex items-start flex-col justify-start">
                <div className="text-yellow-500 font-medium flex gap-2">
                  <span className="flex items-center justify-center gap-1">
                    <FaStar />
                    {avgRating}
                  </span>
                </div>
                
                {/* Live Class Button  */}
                {(isLive || userData?.role === 'educator') && (
                    <div className="w-full my-3">
                        <button 
                            onClick={() => navigate(`/course/live/${courseId}`)}
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-white shadow-lg transition-all duration-300
                            ${isLive 
                                ? "bg-red-600 hover:bg-red-700 animate-pulse ring-4 ring-red-200" 
                                : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                        >
                            <FaBroadcastTower className={isLive ? "animate-bounce" : ""} />
                            {isLive ? "JOIN LIVE DOUBT CLASS NOW" : "START LIVE SESSION"}
                        </button>
                        {isLive && <p className="text-center text-xs text-red-500 font-bold mt-1">🔴 Live Session in Progress!</p>}
                    </div>
                )}

                <div>
                  <span className="text-xl font-semibold text-black">
                    ₹{selectedCourse?.price}
                  </span>
                  <span className="line-through text-sm text-gray-400 ml-2">
                    ₹1999
                  </span>
                </div>
                <ul className="text-sm text-gray-700 space-y-1 pt-2">
                  <li>✅ 10+ hours of video content</li>
                  <li>✅ Lifetime access to course materials</li>
                </ul>
                {!isEnrolled ? (
                  <button
                    className="bg-[black] text-white px-6 py-2 rounded hover:bg-gray-800 transition mt-3 cursor-pointer"
                    onClick={() => handleEnroll(userData?._id, courseId)}
                  >
                    Enroll Now
                  </button>
                ) : (
                  <button
                    className="bg-green-100 text-green-600 px-6 py-2 rounded hover:bg-green-200 transition mt-3 cursor-pointer font-medium"
                    onClick={() => navigate(`/viewlecture/${courseId}`)}
                  >
                    Watch Now
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">What You'll Learn</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Learn {selectedCourse?.category} from beginning</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              Who This Course is For
            </h2>
            <p className="text-gray-700">
              Beginners, aspiring developers, and professionals looking to
              upgrade skills.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="bg-white w-full md:w-2/5 p-6 rounded-2xl shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold mb-1 text-gray-800">
                Course Curriculum
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {selectedCourse?.lectures?.length} Lectures
              </p>
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                {selectedCourse?.lectures?.map((lecture, index) => {
                  const isAccessible = lecture.isPreviewFree || isEnrolled;
                  return (
                    <button
                      key={index}
                      disabled={!isAccessible}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border 
                transition-all duration-200 text-left ${
                  isAccessible
                    ? "hover:bg-gray-100 cursor-pointer border-gray-300"
                    : "cursor-not-allowed opacity-60 border-gray-200"
                } ${selectedLecture?.lectureTitle === lecture?.lectureTitle ? "bg-gray-100 border-gray-400 ring-1 ring-gray-400" : ""}`}
                      onClick={() => {
                        if (isAccessible) setSelectedLecture(lecture);
                      }}
                    >
                      <span className="text-lg text-gray-700">
                        {lecture.isPreviewFree ? <FaPlayCircle /> : <FaLock />}
                      </span>
                      <span className="text-sm font-medium text-gray-800 line-clamp-1">
                        {lecture?.lectureTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Portion: Video Player */}
            <div className="bg-white w-full md:w-3/5 p-6 rounded-2xl shadow-lg border border-gray-200">
              {/* Header with PiP and Speed */}
              <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex flex-col">
                  <h3 className="font-semibold text-gray-700">Video Player</h3>
                  <span className="text-[10px] text-gray-400 hidden sm:block">
                    (Press 'F' for Fullscreen, 'P' for PiP)
                  </span>
                </div>

                {selectedLecture?.videoUrl && (
                  <div className="flex items-center gap-3">
                    {/* PiP Button */}
                    <button
                      onClick={togglePiP}
                      className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border border-gray-300 transition"
                      title="Picture in Picture Mode"
                    >
                      <BsPip className="text-gray-700" />
                      <span className="hidden sm:inline text-gray-700">
                        PiP
                      </span>
                    </button>

                    {/* Speed Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500 font-medium hidden sm:block">
                        Speed:
                      </span>
                      <select
                        className="border border-gray-300 rounded-md p-1 text-sm bg-gray-50 cursor-pointer outline-none focus:ring-1 focus:ring-black"
                        onChange={handleSpeedChange}
                        defaultValue="1"
                      >
                        <option value="0.25">0.25x</option>
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1">1x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="1.75">1.75x</option>
                        <option value="2">2x</option>
                        <option value="2.5">2.5x</option>
                        <option value="3">3x</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="aspect-video w-full rounded-lg overflow-hidden mb-4 bg-black flex items-center justify-center relative group">
                {selectedLecture?.videoUrl ? (
                  <video
                    ref={videoRef}
                    key={selectedLecture.videoUrl}
                    src={selectedLecture.videoUrl}
                    className="w-full h-full object-contain"
                    controls
                    controlsList="nodownload"
                    playsInline
                    autoPlay
                    muted={false}
                    onEnded={handleVideoEnded}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleVideoLoaded}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-center p-4">
                    <FaPlayCircle className="text-white text-4xl mx-auto mb-2 opacity-50" />
                    <span className="text-white text-sm">
                      Select a preview lecture to watch
                    </span>
                  </div>
                )}
              </div>
              
              {/* AI INTEGRATION HERE */}
              {selectedLecture && selectedLecture._id && (
                  <div className="border-t border-gray-100 pt-4">
                     <AIExplainer 
                        lectureId={selectedLecture._id} 
                        videoRef={videoRef} 
                      />
                  </div>
              )}

            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-2">Write a Review</h2>
            <div className="mb-4">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    onClick={() => setRating(star)}
                    className={`cursor-pointer transition-colors ${star <= rating ? "fill-amber-400" : "fill-gray-300"}`}
                  />
                ))}
              </div>
              <textarea
                onChange={(e) => setComment(e.target.value)}
                value={comment}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Write your review here..."
                rows={3}
              />
              <button
                className="bg-black text-white mt-3 px-4 py-2 rounded hover:bg-gray-800 transition"
                disabled={loading}
                onClick={handleReview}
              >
                {loading ? (
                  <ClipLoader size={20} color="white" />
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            {creatorData?.photoUrl ? (
              <img
                src={creatorData?.photoUrl}
                alt=""
                className="border border-gray-200 w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <img
                src={img}
                alt=""
                className="border border-gray-200 w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h2 className="text-lg font-semibold">{creatorData?.name}</h2>
              <p className="md:text-sm text-gray-600 text-[10px]">
                {creatorData?.description}
              </p>
              <p className="md:text-sm text-gray-500 text-[10px]">
                {creatorData?.email}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xl font-semibold mb-2">
              Other published courses by the Educator:
            </p>
          </div>
          <div className="w-full transition-all duration-300 py-[20px] flex items-start justify-center lg:justify-start flex-wrap gap-6 lg:px-[80px] cursor-pointer">
            {creatorCourses?.map((course, index) => (
              <Card
                key={index}
                thumbnail={course.thumbnail}
                id={course._id}
                price={course.price}
                title={course.title}
                category={course.category}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewCourse;