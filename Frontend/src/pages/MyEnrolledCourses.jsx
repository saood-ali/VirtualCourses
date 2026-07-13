import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, BookOpen, Play, Tag, BarChart2 } from "lucide-react";

function MyEnrolledCourses() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const courses = userData?.enrolledCourses || [];

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans antialiased">



      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">

        {/* ── Page Header — identical token sizing to AllCourses ── */}
        <div className="mb-6">
          <h1 className="text-[40px] font-bold text-[#111111] leading-none">My Courses</h1>
          <p className="text-base text-[#5F6368] mt-2">
            {courses.length > 0
              ? `You are enrolled in ${courses.length} ${courses.length === 1 ? "course" : "courses"}.`
              : "You haven't enrolled in any courses yet."}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E7EB] mb-7" />

        {/* ── Empty State ── */}
        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] mb-5">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-semibold text-[#111111] mb-1">No enrolled courses</h2>
            <p className="text-sm text-[#5F6368] max-w-[300px] leading-relaxed">
              You haven't enrolled in any courses yet. Browse the catalog to get started.
            </p>
            <button
              onClick={() => navigate("/allcourses")}
              className="mt-6 h-[44px] px-6 bg-[#FFD400] hover:bg-[#e6be00] active:scale-[0.99] text-[#111111] text-sm font-semibold rounded-[6px] transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Courses</span>
            </button>
          </div>
        ) : (
          /* ── Course Grid — same grid & card structure as AllCourses ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map((course, index) => (
              <div
                key={course._id || index}
                className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col group cursor-pointer"
                onClick={() => navigate(`/course/${course._id}`)}
              >
                {/* Thumbnail */}
                <div className="h-[180px] w-full overflow-hidden bg-[#F8F9FA] shrink-0">
                  <img
                    src={course?.thumbnail || import.meta.env.VITE_DEFAULT_COURSE_THUMBNAIL}
                    alt={course?.title || "Course Thumbnail"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <h3 className="text-sm font-semibold text-[#111111] leading-snug line-clamp-2">
                    {course?.title || "Untitled Course"}
                  </h3>

                  {/* Meta chips — same style as AllCourses */}
                  <div className="flex flex-wrap gap-1.5">
                    {course?.category && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5F6368] bg-[#F8F9FA] border border-[#E5E7EB] rounded-[6px] px-2 py-0.5">
                        <Tag className="w-3 h-3" />
                        {course.category}
                      </span>
                    )}
                    {course?.level && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5F6368] bg-[#F8F9FA] border border-[#E5E7EB] rounded-[6px] px-2 py-0.5">
                        <BarChart2 className="w-3 h-3" />
                        {course.level}
                      </span>
                    )}
                  </div>

                  <div className="flex-1" />

                  {/* Watch Now button — same height and style as AllCourses action row */}
                  <div className="pt-3 border-t border-[#E5E7EB]">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/course/${course._id}`); }}
                      className="w-full h-[40px] bg-[#FFD400] hover:bg-[#e6be00] active:scale-[0.99] text-[#111111] text-sm font-semibold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-[#111111]" />
                      <span>Watch Now</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyEnrolledCourses;