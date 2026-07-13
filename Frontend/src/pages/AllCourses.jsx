import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowLeft, Sparkles, BookOpen, Tag, X, SlidersHorizontal, BarChart2, Check } from "lucide-react";

const CATEGORIES = [
  "App Development",
  "AI/ML",
  "AI Tools",
  "Data Science",
  "Data Analytics",
  "Ethical Hacking",
  "UI/UX Designing",
  "Web Development",
  "Others",
];

function AllCourses() {
  const navigate = useNavigate();
  const { courseData } = useSelector((state) => state.course);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get("category");

  const [category, setCategory] = useState(initialCategory ? [initialCategory] : []);
  const [showFilters, setShowFilters] = useState(false);

  const toggleCategory = (cat) => {
    setCategory((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filterCourses = useMemo(() => {
    const copy = courseData?.slice() || [];
    if (category.length === 0) return copy;
    return copy.filter((c) => category.includes(c.category));
  }, [courseData, category]);

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans antialiased">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">

        {/* ── Page Header ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[40px] font-bold text-[#111111] leading-none">All Courses</h1>
            <p className="text-base text-[#5F6368] mt-2">
              {category.length > 0
                ? `Showing results for: ${category.join(", ")}`
                : "Browse our complete library of expert-led courses."}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[#9CA3AF] hidden sm:block">
              {filterCourses.length} {filterCourses.length === 1 ? "course" : "courses"}
            </span>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters((p) => !p)}
              className="lg:hidden flex items-center gap-2 h-[34px] px-3 border border-[#E5E7EB] text-[#5F6368] text-xs font-semibold rounded-[6px] transition-all cursor-pointer hover:bg-[#F8F9FA]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {category.length > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-[#FFD400] text-[#111111] rounded-full">
                  {category.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] mb-8" />

        {/* ── Two-column layout: Filter card + Course grid ── */}
        <div className="flex gap-8 items-start">

          {/* ── Left Filter Card Panel ── */}
          <aside className={`
            w-[220px] shrink-0 flex-col gap-3
            hidden lg:flex
            ${showFilters ? "flex" : ""}
          `}>

            {/* Filter card */}
            <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
                <span className="text-xs font-semibold tracking-wide uppercase text-[#9CA3AF]">
                  Categories
                </span>
                {category.length > 0 && (
                  <button
                    onClick={() => setCategory([])}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#5F6368] hover:text-[#111111] transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>

              {/* Category rows */}
              <div className="p-2">
                {CATEGORIES.map((cat) => {
                  const active = category.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`w-full flex items-center justify-between h-[36px] px-3 rounded-[6px] text-sm font-medium cursor-pointer transition-colors text-left
                        ${active
                          ? "bg-[#FFD400]/10 text-[#111111]"
                          : "text-[#5F6368] hover:bg-[#F8F9FA] hover:text-[#111111]"
                        }`}
                    >
                      <span>{cat}</span>
                      {active && (
                        <span className="w-4 h-4 rounded-[4px] bg-[#FFD400] flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-[#111111]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search with AI card */}
            <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-4 flex flex-col gap-3">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-[#111111]">Can't find it?</p>
                <p className="text-xs text-[#5F6368] leading-relaxed">
                  Use AI to search across all course topics instantly.
                </p>
              </div>
              <button
                onClick={() => navigate("/search")}
                className="w-full h-[36px] flex items-center justify-center gap-2 bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-xs font-semibold rounded-[6px] transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Search with AI
              </button>
            </div>

          </aside>

          {/* Mobile filter drawer (inline, shown above grid) */}
          {showFilters && (
            <div className="lg:hidden w-full mb-4 bg-white border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
                <span className="text-xs font-semibold tracking-wide uppercase text-[#9CA3AF]">Categories</span>
                {category.length > 0 && (
                  <button onClick={() => setCategory([])} className="flex items-center gap-1 text-[11px] font-semibold text-[#5F6368] cursor-pointer">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-1">
                {CATEGORIES.map((cat) => {
                  const active = category.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`flex items-center justify-between h-[36px] px-3 rounded-[6px] text-sm font-medium cursor-pointer transition-colors
                        ${active ? "bg-[#FFD400]/10 text-[#111111]" : "text-[#5F6368] hover:bg-[#F8F9FA]"}`}
                    >
                      <span className="truncate">{cat}</span>
                      {active && <Check className="w-3 h-3 text-[#111111] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Right: Course Grid ── */}
          <div className="flex-1 min-w-0">
            {filterCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] mb-5">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-semibold text-[#111111] mb-1">No courses found</h2>
                <p className="text-sm text-[#5F6368] max-w-[280px] leading-relaxed">
                  Try a different filter or search with AI.
                </p>
                {category.length > 0 && (
                  <button
                    onClick={() => setCategory([])}
                    className="mt-5 h-[44px] px-5 bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-sm font-semibold rounded-[6px] transition-all cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filterCourses.map((course, index) => (
                  <div
                    key={course._id || index}
                    className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col cursor-pointer"
                    onClick={() => navigate(`/course/${course._id}`)}
                  >
                    {/* Thumbnail */}
                    <div className="h-[180px] w-full overflow-hidden bg-[#F8F9FA] shrink-0">
                      <img 
                        src={course.thumbnail || import.meta.env.VITE_DEFAULT_COURSE_THUMBNAIL} 
                        alt={course.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    {/* Body */}
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <h3 className="text-sm font-semibold text-[#111111] leading-snug line-clamp-2">
                        {course.title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {course.category && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5F6368] bg-[#F8F9FA] border border-[#E5E7EB] rounded-[6px] px-2 py-0.5">
                            <Tag className="w-3 h-3" />{course.category}
                          </span>
                        )}
                        {course.level && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5F6368] bg-[#F8F9FA] border border-[#E5E7EB] rounded-[6px] px-2 py-0.5">
                            <BarChart2 className="w-3 h-3" />{course.level}
                          </span>
                        )}
                      </div>
                      <div className="flex-1" />
                      <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                        <span className="text-base font-bold text-[#111111]">₹{course.price}</span>
                        <span className="text-[11px] font-semibold text-[#5F6368] bg-[#F8F9FA] border border-[#E5E7EB] hover:bg-[#FFD400] hover:border-[#FFD400] hover:text-[#111111] rounded-[6px] px-3 py-1 transition-colors cursor-pointer">
                          Enroll
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default AllCourses;