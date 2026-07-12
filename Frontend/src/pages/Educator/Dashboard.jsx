import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import {
  Wallet, Users, BookOpen, Plus, ArrowLeft, TrendingUp, ChevronDown
} from "lucide-react";
import useGetCreatorCourse from "../../customHooks/getCreatorCourse.js";

export default function Dashboard() {
  useGetCreatorCourse();
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { creatorCourseData } = useSelector((state) => state.course);

  // --- Data Processing ---
  const publishedCourses = creatorCourseData?.filter(c => c.isPublished) || [];
  const totalCoursesCount = creatorCourseData?.length || 0;

  const totalStudents = creatorCourseData?.reduce((sum, course) => {
    return sum + (course.enrolledStudents?.length || 0);
  }, 0) || 0;

  const totalEarning = creatorCourseData?.reduce((sum, course) => {
    const studentCount = course.enrolledStudents?.length || 0;
    const courseRevenue = (course.price || 0) * studentCount;
    return sum + courseRevenue;
  }, 0) || 0;

  // --- Chart Data ---
  const CourseProgressData = creatorCourseData?.map((course) => ({
    name: course.title?.length > 12 ? course.title.slice(0, 12) + "..." : course.title,
    lectures: course.lectures?.length || 0,
  })) || [];

  const EnrollData = creatorCourseData?.map((course) => ({
    name: course.title?.length > 12 ? course.title.slice(0, 12) + "..." : course.title,
    enrolled: course.enrolledStudents?.length || 0,
  })) || [];

  // --- Chart Custom Tooltip ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E5E7EB] p-3 rounded-[6px] shadow-sm">
          <p className="text-[12px] font-bold text-[#111111] mb-1">{label}</p>
          <p className="text-[13px] font-medium text-[#5F6368]">
            {payload[0].name}: <span className="font-bold text-[#111111]">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111111] font-sans antialiased selection:bg-[#FFD400]/30">


      {/* ── Main Dashboard Content ── */}
      <main className="max-w-[1200px] mx-auto px-6 lg:px-10 py-10 space-y-8">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-extrabold text-[#111111] leading-tight tracking-tight">Overview</h1>
            <p className="text-[15px] font-medium text-[#5F6368] mt-1">Welcome back, track your course performance and earnings here.</p>
          </div>
          <button
            onClick={() => navigate("/courses?create=true")}
            className="h-[44px] px-5 bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[14px] font-bold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create New Course
          </button>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Earnings Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm hover:border-[#FFD400]/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-[#5F6368]">Total Earnings</h3>
              <div className="w-8 h-8 rounded-full bg-[#FFD400]/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#FFD400]" />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <h2 className="text-[32px] font-extrabold text-[#111111] leading-none">₹{totalEarning.toLocaleString()}</h2>
              <span className="flex items-center text-[12px] font-bold text-[#22C55E] mb-1">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
              </span>
            </div>
          </div>

          {/* Students Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm hover:border-[#FFD400]/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-[#5F6368]">Total Enrollments</h3>
              <div className="w-8 h-8 rounded-full bg-[#FFD400]/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#FFD400]" />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <h2 className="text-[32px] font-extrabold text-[#111111] leading-none">{totalStudents.toLocaleString()}</h2>
            </div>
          </div>

          {/* Courses Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm hover:border-[#FFD400]/50 transition-colors cursor-pointer" onClick={() => navigate("/courses")}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-[#5F6368]">Active Courses</h3>
              <div className="w-8 h-8 rounded-full bg-[#FFD400]/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#FFD400]" />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <h2 className="text-[32px] font-extrabold text-[#111111] leading-none">{publishedCourses.length}</h2>
              <span className="text-[13px] font-medium text-[#9CA3AF] mb-1">/ {totalCoursesCount} total</span>
            </div>
          </div>
        </div>

        {/* ── Charts Section ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Enrollments Chart */}
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm">
            <h3 className="text-[16px] font-bold text-[#111111] mb-6">Students Enrollment</h3>
            {creatorCourseData?.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={EnrollData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8F9FA' }} />
                    <Bar dataKey="enrolled" name="Students" fill="#FFD400" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center text-[#9CA3AF] text-[13px] font-medium">
                No course data available yet.
              </div>
            )}
          </div>

          {/* Progress (Lectures) Chart */}
          <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm">
            <h3 className="text-[16px] font-bold text-[#111111] mb-6">Course Content (Lectures)</h3>
            {creatorCourseData?.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CourseProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8F9FA' }} />
                    <Bar dataKey="lectures" name="Lectures" fill="#111111" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] w-full flex items-center justify-center text-[#9CA3AF] text-[13px] font-medium">
                No course data available yet.
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}