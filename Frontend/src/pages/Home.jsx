import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useMemo, useState } from "react";
import { 
  Sparkles, ArrowRight, GraduationCap, Infinity, BadgeDollarSign, 
  Headphones, Users, Monitor, Palette, Smartphone, ShieldCheck, 
  Brain, Database, BarChart3, Wrench, Star, CheckCircle2, Play,
  BookOpen, ChevronRight, ChevronLeft, CircleCheck, PlayCircle,
  Tag, BarChart2, Quote
} from "lucide-react";

import ai_student from "../assets/ai_student.png";
import video from "../assets/Modified_Video_With_More_Texts.mp4";
import BlurText from "../components/BlurText.jsx";

const CATEGORIES = [
  { name: "Web Development", icon: Monitor, desc: "Build modern websites & apps", color: "#EFF6FF" },
  { name: "UI/UX Designing", icon: Palette, desc: "Design beautiful interfaces", color: "#FFF7ED" },
  { name: "App Development", icon: Smartphone, desc: "Create mobile experiences", color: "#F0FDF4" },
  { name: "Ethical Hacking", icon: ShieldCheck, desc: "Master cybersecurity skills", color: "#FEF2F2" },
  { name: "AI/ML", icon: Brain, desc: "Explore artificial intelligence", color: "#FAF5FF" },
  { name: "Data Science", icon: Database, desc: "Analyze & visualize data", color: "#ECFDF5" },
  { name: "Data Analytics", icon: BarChart3, desc: "Turn data into decisions", color: "#FFF1F2" },
  { name: "AI Tools", icon: Wrench, desc: "Leverage AI productivity tools", color: "#F0F9FF" },
];

const TRUST_ITEMS = [
  { icon: Brain, label: "AI-Powered Search" },
  { icon: Monitor, label: "Live Interactive Classes" },
  { icon: Infinity, label: "Lifetime Course Access" },
  { icon: GraduationCap, label: "Become an Educator" },
  { icon: ShieldCheck, label: "Secure Payments" },
];

const FEATURES = [
  { icon: Sparkles,    title: "Smart Curriculum",        description: "AI-curated learning paths tailored for you." },
  { icon: CircleCheck, title: "Expert Educators",         description: "Learn directly from industry leaders." },
  { icon: PlayCircle,  title: "Interactive Live Classes", description: "Engage with mentors and peers." },
  { icon: BookOpen,    title: "Lifetime Access",          description: "Review materials anytime." },
];

const TESTIMONIALS = [
  { name: "Rohit Sharma",  role: "Web Developer",  initials: "RS", rating: 5, review: "\"VirtualCourses helped me upskill and land my dream job in just 3 months!\"" },
  { name: "Priya Verma",   role: "Data Analyst",   initials: "PV", rating: 5, review: "\"The live classes and AI tools make learning so much easier and interactive.\"" },
  { name: "Ankit Patel",   role: "UI/UX Designer", initials: "AP", rating: 5, review: "\"Lifetime access is a game-changer. I learn at my own pace, anytime!\"" },
];

function Home() {
  const navigate = useNavigate();
  const { courseData } = useSelector((state) => state.course);
  const { reviewData } = useSelector((state) => state.review);

  const [activeSlide, setActiveSlide] = useState(0);

  const popularCourses = courseData?.slice(0, 6) || [];
  const latestReviews = reviewData?.slice(0, 6) || [];

  const calculateAvgRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  // Dynamic stats from backend data
  const totalCourses = courseData?.length || 0;
  const totalReviews = reviewData?.length || 0;
  const uniqueCategories = useMemo(() => {
    if (!courseData) return 0;
    return new Set(courseData.map(c => c.category).filter(Boolean)).size;
  }, [courseData]);
  const totalStudents = useMemo(() => {
    if (!courseData) return 0;
    return courseData.reduce((sum, course) => sum + (course.enrolledStudents?.length || 0), 0);
  }, [courseData]);

  return (
    <div className="w-full bg-white text-[#111111] font-sans antialiased selection:bg-[#FFD400]/30 relative">
      
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: HERO
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center bg-white overflow-hidden">
        
        {/* Top Content — Badge, Heading, Subtitle, Buttons */}
        <div className="w-full max-w-[1200px] mx-auto px-6 lg:px-10 text-center flex flex-col items-center pt-5 md:pt-5 lg:pt-10">
          {/* Headline */}
          <h1 className="text-[36px] md:text-[52px] lg:text-[68px] font-bold text-[#111111] leading-[1.08] tracking-tight max-w-[900px] mx-auto mb-6">
            Learn Smarter. Achieve More.<br/>
            Anytime, <span className="text-[#FFD400]">Anywhere.</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-[680px] mx-auto text-[16px] md:text-[19px] text-[#5F6368] leading-relaxed mb-10">
            Discover world-class courses, attend live interactive classes, and get AI-powered support to master skills that matter.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 w-full sm:w-auto">
            <button 
              onClick={() => navigate("/allcourses")}
              className="h-[52px] px-8 bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[16px] font-semibold rounded-[8px] transition-all flex items-center justify-center gap-2.5 w-full sm:w-auto cursor-pointer active:scale-[0.98]"
            >
              <BookOpen className="w-5 h-5" /> Explore Courses
            </button>
            <button 
              onClick={() => navigate("/search")}
              className="h-[52px] px-8 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#111111] text-[16px] font-semibold rounded-[8px] transition-all flex items-center justify-center gap-2.5 w-full sm:w-auto cursor-pointer active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5 text-[#FFD400]" /> Search with AI
            </button>
          </div>

        </div>

        {/* Hero Image — Full width, edge-to-edge */}
        <div className="w-full flex justify-center">
          <img 
            src="/hero-image.png" 
            alt="VirtualCourses Platform — Dashboard, AI Tutor, Live Classes" 
            className="w-full max-w-[1400px] h-auto object-contain"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: TRUST BAR
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-12">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-center gap-8 md:gap-14 flex-wrap">
            {TRUST_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-[#5F6368]">
                <item.icon className="w-6 h-6 text-[#FFD400]" />
                <span className="text-[14px] font-bold text-[#111111]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: CATEGORY GRID
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="inline-flex mb-5">
              <span className="uppercase tracking-widest text-xs font-semibold bg-[#FFF8DD] text-[#D4A100] px-4 py-2 rounded-full inline-flex">
                CATEGORIES
              </span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-[#111111] mb-4">Explore by Category</h2>
            <p className="text-lg text-[#666666] font-medium max-w-[520px] mx-auto leading-relaxed">
              Browse our curated curriculum across 8 in-demand disciplines.
            </p>
          </div>

          {/* Tile Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() => navigate("/allcourses")}
                className="group cursor-pointer flex flex-col items-center text-center rounded-3xl p-6 lg:p-8 transition-all duration-300 hover:bg-[#FAFAFA]"
              >
                {/* Large Icon Block */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: cat.color }}
                >
                  <cat.icon className="w-9 h-9 text-[#111111]" />
                </div>

                {/* Text */}
                <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-1.5 leading-snug">{cat.name}</h3>
                <p className="text-[13px] text-[#666666] font-medium leading-snug">{cat.desc}</p>

                {/* Hover Underline Accent */}
                <div className="mt-4 h-[2px] w-0 bg-[#FFD400] rounded-full transition-all duration-300 group-hover:w-10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: POPULAR COURSES
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="inline-flex mb-5">
              <span className="uppercase tracking-widest text-xs font-semibold bg-[#FFF8DD] text-[#D4A100] px-4 py-2 rounded-full inline-flex">
                POPULAR
              </span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-[#111111] mb-4">Our Popular Courses</h2>
            <p className="text-lg text-[#666666] font-medium max-w-[560px] mx-auto leading-relaxed">
              Explore top-rated courses designed to boost your skills and unlock opportunities in tech, AI, and beyond.
            </p>
          </div>

          {/* Course Grid — same card as AllCourses page */}
          {popularCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {popularCourses.map((course, index) => {
                const avgRating = calculateAvgRating(course.reviews);
                return (
                  <div
                    key={course._id || index}
                    onClick={() => navigate(`/course/${course._id}`)}
                    className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#FFD400]/50 transition-all duration-200"
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
                        {avgRating > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5F6368] bg-[#F8F9FA] border border-[#E5E7EB] rounded-[6px] px-2 py-0.5">
                            <Star className="w-3 h-3 text-[#FFD400] fill-[#FFD400]" />{avgRating}
                          </span>
                        )}
                      </div>
                      <div className="flex-1" />
                      <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                        <span className="text-base font-bold text-[#111111]">
                          {course.price === 0 ? "Free" : `₹${course.price}`}
                        </span>
                        <span className="text-[11px] font-semibold text-[#5F6368] bg-[#F8F9FA] border border-[#E5E7EB] hover:bg-[#FFD400] hover:border-[#FFD400] hover:text-[#111111] rounded-[6px] px-3 py-1 transition-colors cursor-pointer">
                          Enroll
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-[#9CA3AF]">
              <BookOpen className="w-10 h-10 mx-auto mb-3" />
              <p className="text-[14px] font-bold">No courses available yet.</p>
            </div>
          )}

          {/* View All Link */}
          {popularCourses.length > 0 && (
            <div className="text-center mt-12">
              <button
                onClick={() => navigate("/allcourses")}
                className="h-[48px] px-8 bg-white border border-[#E5E7EB] text-[#111111] text-[14px] font-bold rounded-[8px] flex items-center gap-2 cursor-pointer mx-auto hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[#FFD400] transition-all duration-300"
              >
                View All Courses <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: ABOUT / WHY US
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative bg-white rounded-3xl overflow-hidden">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-center">
              {/* LEFT: Image */}
              <div className="relative overflow-hidden  m-6 lg:m-10 mt-10 lg:mt-12 min-h-[336px] lg:min-h-[400px] max-h-[400px] self-center">
                <img
                  src="/about_iamge.png"
                  alt="Student learning with AI tools"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = ai_student; }}
                />
              </div>

              {/* RIGHT: Content */}
              <div className="flex flex-col justify-center px-8 lg:px-12 py-12 relative z-10">
                {/* Badge */}
                <div className="inline-flex mb-5">
                  <span className="uppercase tracking-widest text-xs font-semibold bg-[#FFF8DD] text-[#D4A100] px-4 py-2 rounded-full inline-flex">
                    ABOUT US
                  </span>
                </div>

                {/* Heading */}
                <h2 className="text-2xl lg:text-4xl font-extrabold tracking-tight leading-tight text-[#111111] mb-4">
                  Accelerate your learning<br />with intelligent tools.
                </h2>

                {/* Paragraph */}
                <p className="text-base lg:text-lg leading-8 text-[#666666] mb-10 max-w-[480px]">
                  VirtualCourses is a premium Learning Management System designed to simplify online education. We blend expert instruction with AI-driven insights to maximize your potential.
                </p>

                {/* 2×2 Feature Grid */}
                <div className="grid grid-cols-2 gap-x-10 gap-y-8">
                  {FEATURES.map((feat, idx) => (
                    <div key={idx} className="flex gap-4 items-start group">
                      <div className="w-14 h-14 rounded-2xl bg-[#FFF8DD] flex items-center justify-center shrink-0 transition-all duration-300 group-hover:shadow-md">
                        <feat.icon className="w-7 h-7 text-[#FFD400] transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div className="pt-1">
                        <h4 className="text-[15px] font-semibold text-[#1A1A1A] mb-1">{feat.title}</h4>
                        <p className="text-[13px] text-[#666666] leading-snug">{feat.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6: TESTIMONIALS
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative bg-white overflow-hidden  px-8 lg:px-16 py-14 lg:py-20">

            {/* Section Header */}
            <div className="relative z-10 text-center mb-14">
              <div className="inline-flex mb-5">
                <span className="uppercase tracking-widest text-xs font-semibold bg-[#FFF8DD] text-[#D4A100] px-4 py-2 rounded-full inline-flex">
                  TESTIMONIALS
                </span>
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-[#111111] mb-4">What Students Say</h2>
              <p className="text-lg leading-8 text-[#666666] max-w-2xl mx-auto">
                Discover how VirtualCourses is transforming learning experiences through real feedback from students worldwide.
              </p>
            </div>

            {/* Slider */}
            <div className="relative z-10">
              {/* Left Arrow */}
              <button
                onClick={() => setActiveSlide((p) => (p - 1 + (latestReviews.length || TESTIMONIALS.length)) % (latestReviews.length || TESTIMONIALS.length))}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 lg:-translate-x-10 w-11 h-11 rounded-full border border-[#EAEAEA] bg-white shadow-md flex items-center justify-center hover:border-[#FFD400] hover:shadow-lg transition-all duration-300 z-20 cursor-pointer"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5 text-[#1A1A1A]" />
              </button>

              {/* Cards */}
              <div className="flex gap-6 justify-center overflow-hidden px-4 py-8">
                {(() => {
                  const items = latestReviews.length > 0 ? latestReviews : TESTIMONIALS;
                  const totalItems = items.length;
                  const visibleIndices = [
                    (activeSlide - 1 + totalItems) % totalItems,
                    activeSlide,
                    (activeSlide + 1) % totalItems,
                  ];
                  return visibleIndices.map((itemIndex, displayPos) => {
                    const item = items[itemIndex];
                    const isCenter = displayPos === 1;
                    const name     = item.user?.name || item.name || "Anonymous";
                    const role     = item.user?.description || item.role || "Student";
                    const comment  = item.comment || item.review || "";
                    const rating   = item.rating || 5;
                    const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

                    return (
                      <div
                        key={itemIndex}
                        className={`w-[320px] lg:w-[360px] shrink-0 rounded-3xl border bg-white p-8 transition-all duration-300 relative overflow-hidden
                          ${isCenter
                            ? "border-gray-200 shadow-xl -translate-y-2 scale-100"
                            : "border-gray-100 shadow-sm opacity-50 scale-[0.95] hidden lg:block"
                          }`}
                      >
                        <Quote className="absolute top-8 right-8 w-10 h-10 text-[#FFD400]/10 fill-[#FFD400]/10 rotate-180" />
                        {/* Stars */}
                        <div className="flex gap-1 mb-5 relative z-10">
                          {Array(5).fill(0).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${i < rating ? "text-[#FFD400] fill-[#FFD400]" : "text-[#E5E7EB]"}`}
                            />
                          ))}
                        </div>

                        {/* Review text */}
                        <p className="text-[15px] text-[#1A1A1A] leading-relaxed mb-6 line-clamp-4">
                          {comment}
                        </p>

                        {/* Footer Section (Author & Course) */}
                        <div className="flex items-center justify-between pt-5 border-t border-[#EAEAEA]">
                          
                          {/* Author Info (Left) */}
                          <div className="flex items-center gap-3 shrink min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#FFF8DD] border border-[#EAEAEA] overflow-hidden shrink-0 flex items-center justify-center">
                              {item.user?.photoUrl ? (
                                <img src={item.user.photoUrl} alt={name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[13px] font-bold text-[#D4A100]">{initials}</span>
                              )}
                            </div>
                            <div className="min-w-0 pr-2">
                              <p className="text-[14px] font-bold text-[#1A1A1A] truncate">{name}</p>
                              <p className="text-[12px] text-[#666666] font-medium truncate">{role}</p>
                            </div>
                          </div>

                          {/* Course Link (Right) */}
                          {item.course && (
                            <div 
                              className="flex items-center gap-2 shrink-0 p-1 pr-3 rounded-full border border-[#EAEAEA] bg-[#F8F9FA] cursor-pointer hover:border-[#FFD400] hover:bg-[#FFF8DD] hover:shadow-sm transition-all group max-w-[140px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/course/${item.course._id}`);
                              }}
                              title={item.course.title}
                            >
                              <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-white border border-[#EAEAEA]">
                                <img 
                                  src={item.course.thumbnail || import.meta.env.VITE_DEFAULT_COURSE_THUMBNAIL} 
                                  alt={item.course.title} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                                />
                              </div>
                              <p className="text-[11px] font-bold text-[#1A1A1A] truncate group-hover:text-[#D4A100] transition-colors">
                                {item.course.title}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => setActiveSlide((p) => (p + 1) % (latestReviews.length || TESTIMONIALS.length))}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 lg:translate-x-10 w-11 h-11 rounded-full border border-[#EAEAEA] bg-white shadow-md flex items-center justify-center hover:border-[#FFD400] hover:shadow-lg transition-all duration-300 z-20 cursor-pointer"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5 text-[#1A1A1A]" />
              </button>
            </div>


          </div>
        </div>
      </section>


    </div>
  );
}

export default Home;