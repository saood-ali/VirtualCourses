import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BsArrowReturnLeft } from "react-icons/bs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useGetCreatorCourse from "../../customHooks/getCreatorCourse.js";
import { FlickeringGrid } from "../../components/FlickeringGrid.jsx";

function Dashboard() {
  useGetCreatorCourse();

  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { creatorCourseData } = useSelector((state) => state.course);

  // --- Data Processing for Graphs ---
  const CourseProgressData =
    creatorCourseData?.map((course) => ({
      name: course.title?.slice(0, 10) + "...",
      lectures: course.lectures.length || 0,
    })) || [];

  const EnrollData =
    creatorCourseData?.map((course) => ({
      name: course.title?.slice(0, 10) + "...",
      enrolled: course.enrolledStudents?.length || 0,
    })) || [];

  const totalEarning =
    creatorCourseData?.reduce((sum, course) => {
      const studentCount = course.enrolledStudents?.length || 0;
      const courseRevenue = course.price ? course.price * studentCount : 0;
      return sum + courseRevenue;
    }, 0) || 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Back Button */}
      <BsArrowReturnLeft
        className="w-[22px] absolute top-[10%] left-[10%] h-[22px] cursor-pointer z-50"
        onClick={() => navigate("/")}
      />

      {/* 2. Main Content Container */}
      <div className="w-full px-6 py-10 relative overflow-hidden space-y-10 min-h-screen">
        
        {/* 3. FLICKERING GRID BACKGROUND */}
        <div className="absolute inset-0 z-0">
          <FlickeringGrid
            className="w-full h-full"
            squareSize={4}
            gridGap={6}
            color="#300909"      
            maxOpacity={0.15}    
            flickerChance={0.7}
            height={1200}        
          />
        </div>

        {/* Welcome Card */}
        <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-md p-6 flex flex-col md:flex-row items-center gap-6 relative z-10">
          <img
            src={userData?.photoUrl || userData?.name.slice(0, 1).toUpperCase()}
            className="w-28 h-28 rounded-full object-cover border-4 border-black shadow-md"
            alt="educator"
          />
          <div className="text-center md:text-left space-y-1">
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {userData?.name || "Educator"} 👋🏻
            </h1>
            <h1 className="text-xl font-semibold text-gray-800">
              Total Earning: ₹{totalEarning.toLocaleString()}
            </h1>
            <p className="text-gray-600 text-sm">
              {userData?.description ||
                "Start creating courses for your students"}
            </p>
            <h1
              className="px-[10px] py-[10px] text-center border-2 bg-black border-black text-white rounded-[10px] 
            text-[15px] font-light flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
              onClick={() => navigate("/courses")}
            >
              Create Courses
            </h1>
          </div>
        </div>

        {/* Graphs Section */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* Course Progress Graph */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">
              Course Progress (Lectures)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={CourseProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="lectures" fill="black" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Enrollment Graph */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Students Enrollment</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={EnrollData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="enrolled" fill="black" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;