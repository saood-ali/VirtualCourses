import { useEffect, useState } from "react";
import { BsArrowReturnLeft } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import img from "../../assets/empty_folder.png";
import { FaEdit } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import axiosClient from "../../config/axiosClient.js";
import { setCreatorCourseData } from "../../redux/courseSlice.js";
import { DotPattern } from "../../components/DotPattern.jsx"; 

function Courses() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const { creatorCourseData: reduxCourseData } = useSelector((state) => state.course);
  
  const [localCourseData, setLocalCourseData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  
  // Decide which data to render (prefer local state if it has been fetched)
  const creatorCourseData = localCourseData !== null ? localCourseData : reduxCourseData;

  useEffect(() => {
    if (!userData) {
      return;
    }
    const creatorCourses = async () => {
      try {
        setFetchError(null);
        console.log("Fetching creator courses...");
        const result = await axiosClient.get(`/api/course/getcreator?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        console.log("Fetched creator courses result:", result.data);
        
        let courses = result.data;
        if (!Array.isArray(courses) && courses?.courses) {
          courses = courses.courses; // Fallback for { courses: [...] } structure
        }
        
        // Update both local state and Redux
        setLocalCourseData(courses);
        dispatch(setCreatorCourseData(courses));
      } catch (error) {
        console.error("Failed to fetch creator courses:", error);
        setFetchError(error.response?.data?.message || error.message || "Unknown error occurred while fetching.");
        setLocalCourseData([]); // Fallback to empty array on error
      }
    };
    creatorCourses();
  }, [userData, dispatch]);

  return (
    <div className="relative flex min-h-screen bg-gray-100 overflow-hidden">
      
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <DotPattern />
      </div>

      <div className="relative z-10 w-full min-h-screen p-4 sm:p-6">
        {fetchError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Fetch Error: </strong>
            <span className="block sm:inline">{fetchError}</span>
          </div>
        )}
        
        {/* RAW DEBUGGING DATA - TEMPORARY */}
        {localCourseData && localCourseData.length === 0 && !fetchError && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
            <strong>Debug Info:</strong> The backend API successfully responded, but returned 0 courses. Please verify the database has courses for this exact user account.
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div className="flex items-center justify-center gap-3">
            <BsArrowReturnLeft
              className="w-[22px] h-[22px] cursor-pointer"
              onClick={() => navigate("/dashboard")}
            />
            <h1 className="text-2xl font-semibold">All Created Courses</h1>
          </div>
          <button
            className="bg-[black] text-white px-4 py-2 
      rounded hover:bg-gray-400 cursor-pointer"
            onClick={() => navigate("/createcourses")}
          >
            Create Course
          </button>
        </div>

        {/* for Large Screen Table */}
        <div className="hidden md:block bg-white rounded-xl shadow p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Prices</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Action</th>
                <th className="text-left py-3 px-4">Courses</th>
              </tr>
            </thead>
            <tbody>
              {creatorCourseData?.map((course, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-gray-50 transition duration-200"
                >
                  <td className="py-3 px-4 flex items-center gap-4">
                    {course?.thumbnail ? (
                      <img
                        src={course?.thumbnail}
                        className="w-25 h-14 object-cover rounded-md"
                        alt=""
                      />
                    ) : (
                      <img
                        src={img}
                        className="w-25 h-14 object-cover rounded-md"
                        alt=""
                      />
                    )}
                    <span>{course?.title}</span>
                  </td>
                  {course?.price ? (
                    <td className="px-4 py-3"> ₹{course?.price}</td>
                  ) : (
                    <td className="px-4 py-3">₹ NA</td>
                  )}
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs 
                  ${
                    course?.isPublished
                      ? "bg-green-100 text-green-500"
                      : "bg-red-100 text-red-600"
                  }`}
                    >
                      {course?.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <FaEdit
                      className="text-gray-600 hover:text-blue-600 cursor-pointer"
                      onClick={() => navigate(`/editcourse/${course?._id}`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-center text-sm text-gray-400 mt-6">
            A list of your recent courses.
          </p>
        </div>

        {/* for Small Screen Table */}
        <div className="md:hidden space-y-4">
          {creatorCourseData?.map((course, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-4 flex flex-col gap-3"
            >
              <div className="flex gap-4 items-center">
                {course?.thumbnail ? (
                  <img
                    src={course?.thumbnail}
                    className="w-16 h-16 rounded-md object-cover"
                    alt=""
                  />
                ) : (
                  <img
                    src={img}
                    className="w-16 h-16 rounded-md object-cover"
                    alt=""
                  />
                )}
                <div className="flex-1">
                  <h2 className="font-medium text-sm">{course?.title}</h2>
                  {course?.price ? (
                    <p className="text-gray-600 text-xs mt-1">
                      ₹{course?.price}
                    </p>
                  ) : (
                    <p className="text-gray-600 text-xs mt-1">₹ NA</p>
                  )}
                </div>
                <FaEdit
                  className="text-gray-600 hover:text-blue-600 cursor-pointer"
                  onClick={() => navigate(`/editcourse/${course?._id}`)}
                />
              </div>
              <span
                className={`w-fit px-3 py-1 text-xs rounded-full 
          ${
            course?.isPublished
              ? "bg-green-100 text-green-500"
              : " bg-red-100 text-red-600"
          }`}
              >
                {course?.isPublished ? "Published" : "Draft"}
              </span>
            </div>
          ))}
          <p className="text-center text-sm text-gray-400 mt-4">
            A list of your recent courses.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Courses;