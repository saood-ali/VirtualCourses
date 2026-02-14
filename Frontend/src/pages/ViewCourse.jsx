import { useState, useMemo, useEffect } from "react";
import { BsArrowReturnLeft } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { setSelectedCourse } from "../redux/courseSlice.js";
import img from "../assets/empty_folder.png";
import { FaStar, FaPlayCircle, FaLock } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import Card from "../components/Card.jsx";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { StripedPattern } from "../components/StripedPattern.jsx";
import ReactPlayer from "react-player";

function ViewCourse() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { courseData, selectedCourse } = useSelector((state) => state.course);
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [creatorData, setCreatorData] = useState(null);
  const [prevCourseId, setPrevCourseId] = useState(courseId);
  if (courseId !== prevCourseId) {
    setPrevCourseId(courseId);
    setSelectedLecture(null);
  }

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [prevLectureId, setPrevLectureId] = useState(selectedLecture?._id);

  if (selectedLecture?._id !== prevLectureId) {
    setPrevLectureId(selectedLecture?._id);
    setIsVideoPlaying(false);
  }

  // Scroll to Top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
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
          const result = await axios.post(
            `${serverUrl}/api/course/creator`,
            { userId: selectedCourse?.creator },
            { withCredentials: true },
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

  const handleEnroll = async (userId, courseId) => {
    try {
      const orderData = await axios.post(
        `${serverUrl}/api/order/razorpay-order`,
        { userId, courseId },
        { withCredentials: true },
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
            const verifyPayment = await axios.post(
              `${serverUrl}/api/order/verifypayment`,
              {
                ...response,
                courseId,
                userId,
              },
              { withCredentials: true },
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
      const result = await axios.post(
        `${serverUrl}/api/review/createreview`,
        { rating, comment, courseId },
        { withCredentials: true },
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
    if (!reviews || reviews.length === 0) {
      return 0;
    }
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const avgRating = calculateAvgReview(selectedCourse?.reviews);

  return (
    //  OUTER BACKGROUND:
    <div className="min-h-screen bg-white relative p-6">
      {/* OUTER PATTERN */}
      <StripedPattern
        width={30}
        height={30}
        className="fixed inset-0 z-0 opacity-20 text-gray-300"
      />

      {/* INNER CONTAINER*/}
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl relative overflow-hidden">
        {/* INNER PATTERN */}
        <StripedPattern
          width={20}
          height={20}
          direction="right"
          className="absolute inset-0 z-0 opacity-30 text-gray-400"
        />

        {/* CONTENT WRAPPER */}
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
              <p className="text-gray-600"></p>

              <div className="flex items-start flex-col justify-start">
                <div className="text-yellow-500 font-medium flex gap-2">
                  <span className="flex items-center justify-center gap-1">
                    <FaStar />
                    {avgRating}
                  </span>
                </div>
                <div>
                  <span className="text-xl font-semibold text-black">
                    ₹{selectedCourse?.price}
                  </span>
                  {""}
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
            <p className="text-gray-700 ">
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
                {selectedCourse?.lectures?.map((lecture, index) => (
                  <button
                    key={index}
                    disabled={!lecture.isPreviewFree}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border 
                transition-all duration-200 text-left ${
                  lecture.isPreviewFree
                    ? "hover:bg-gray-100 cursor-pointer border-gray-300"
                    : "cursor-not-allowed opacity-60 border-gray-200"
                } ${selectedLecture?.lectureTitle === lecture?.lectureTitle ? "bg-gray-100 border-gray-400 ring-1 ring-gray-400" : ""}`}
                    onClick={() => {
                      if (lecture.isPreviewFree) {
                        setSelectedLecture(lecture);
                      }
                    }}
                  >
                    <span className="text-lg text-gray-700">
                      {lecture.isPreviewFree ? <FaPlayCircle /> : <FaLock />}
                    </span>
                    <span className="text-sm font-medium text-gray-800 line-clamp-1">
                      {lecture?.lectureTitle}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Right Portion */}
            {/* Right Portion */}
            <div className="bg-white w-full md:w-3/5 p-6 rounded-2xl shadow-lg border border-gray-200">
              <div className="aspect-video w-full rounded-lg overflow-hidden mb-4 bg-black flex items-center justify-center relative group">
                {selectedLecture?.videoUrl ? (
                  <>
                    {/* 1. THE PLAYER (Always mounted, waiting for command) */}
                    <ReactPlayer
                      url={selectedLecture?.videoUrl}
                      width="100%"
                      height="100%"
                      controls={true}
                      playing={isVideoPlaying}
                      light={false}
                      config={{
                        file: {
                          attributes: {
                            controlsList: "nodownload",
                            onContextMenu: (e) => e.preventDefault(),
                          },
                        },
                      }}
                      onError={(e) => console.error("ReactPlayer Error:", e)}
                    />

                    {/* 2. THE MANUAL OVERLAY (Sits on top until clicked) */}
                    {!isVideoPlaying && (
                      <div
                        className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 cursor-pointer"
                        style={{
                          backgroundImage: `url(${selectedCourse?.thumbnail || img})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                        onClick={() => setIsVideoPlaying(true)}
                      >
                        {/* Dark Overlay for text readability */}
                        <div className="absolute inset-0 bg-black/40 transition-opacity group-hover:bg-black/20"></div>

                        {/* Big Play Button */}
                        <div className="relative z-20 flex flex-col items-center transform transition-transform group-hover:scale-110">
                          <FaPlayCircle className="text-white text-6xl drop-shadow-lg" />
                          <p className="text-white font-semibold mt-2 drop-shadow-md">
                            Play Lecture
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-4">
                    <FaPlayCircle className="text-white text-4xl mx-auto mb-2 opacity-50" />
                    <span className="text-white text-sm">
                      Select a preview lecture to watch
                    </span>
                  </div>
                )}
              </div>
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

          {/* For Creator Info */}
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
          <div
            className="w-full transition-all duration-300 py-[20px] flex items-start justify-center
          lg:justify-start flex-wrap gap-6 lg:px-[80px]"
          >
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
