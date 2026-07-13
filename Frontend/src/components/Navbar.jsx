import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { 
  Sparkles, ChevronDown, User, LogOut, Settings, LayoutDashboard, Search
} from "lucide-react";

import axiosClient from "../config/axiosClient.js";
import { setUserData } from "../redux/userSlice.js";

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

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { userData } = useSelector((state) => state.user);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogOut = async () => {
    try {
      await axiosClient.post(`/api/auth/logout`);
      toast.success("Logged out successfully");
    } catch (error) {
      console.log(error);
    } finally {
      dispatch(setUserData(null));
      localStorage.removeItem("token");
      setShowDropdown(false);
      navigate("/");
    }
  };

  // Do not render navbar on auth pages
  if (location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/forget-password") {
    return null;
  }

  const isActive = (path) => {
    // Exact match for home, startsWith for others
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItemClass = (path) => `
    cursor-pointer font-bold transition-all h-[72px] flex items-center border-b-[3px] 
    ${isActive(path) ? "border-[#FFD400] text-[#111111]" : "border-transparent text-[#5F6368] hover:text-[#111111] hover:border-[#E5E7EB]"}
  `;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] h-[72px] px-6 lg:px-10 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      
      {/* ── Left: Brand ── */}
      <div 
        onClick={() => navigate("/")} 
        className="flex items-center cursor-pointer"
      >
        <img src="/logo.svg" alt="VirtualCourses" className="h-12 w-auto" />
      </div>

      {/* ── Center: Main Navigation ── */}
      <nav className="hidden md:flex items-center gap-8 text-[14px]">
        <span onClick={() => navigate("/")} className={navItemClass("/")}>
          Home
        </span>
        {/* Explore Courses with Dropdown */}
        <div className="relative group h-full flex items-center">
          <span onClick={() => navigate("/allcourses")} className={`${navItemClass("/allcourses")} flex items-center gap-1`}>
            Explore Courses <ChevronDown className="w-3.5 h-3.5 mt-0.5 text-inherit transition-transform duration-200 group-hover:rotate-180" />
          </span>
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 w-[240px] bg-white border border-[#E5E7EB] rounded-b-[8px] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col py-2 translate-y-1 group-hover:translate-y-0">
            {CATEGORIES.map((cat, idx) => (
              <div 
                key={idx}
                onClick={() => navigate(`/allcourses?category=${encodeURIComponent(cat)}`)}
                className="px-5 py-2.5 text-[14px] font-medium text-[#5F6368] hover:text-[#111111] hover:bg-[#F8F9FA] hover:pl-6 cursor-pointer transition-all flex items-center justify-between group/item"
              >
                {cat}
              </div>
            ))}
          </div>
        </div>
        
        {userData && (
          <span onClick={() => navigate("/mycourses")} className={navItemClass("/mycourses")}>
            My Learning
          </span>
        )}
        
        {userData?.role === "educator" && (
          <span onClick={() => navigate("/dashboard")} className={navItemClass("/dashboard")}>
            Educator Dashboard
          </span>
        )}
      </nav>

      {/* ── Right: Search AI & Profile ── */}
      <div className="flex items-center gap-5">
        
        {/* Search with AI Button */}
        <button 
          onClick={() => navigate("/search")}
          className="h-[38px] px-4 bg-gradient-to-r from-[#111111] to-[#222222] hover:to-[#333333] text-white text-[13px] font-bold rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 group"
        >
          <Sparkles className="w-4 h-4 text-[#FFD400] group-hover:animate-pulse" /> 
          <span className="hidden sm:block">Search with AI</span>
          <span className="sm:hidden">AI</span>
        </button>

        <div className="h-6 w-px bg-[#E5E7EB] hidden sm:block" />

        {/* User Auth / Dropdown */}
        {userData ? (
          <div className="relative" ref={dropdownRef}>
            <div 
              onClick={() => setShowDropdown(!showDropdown)} 
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-[#F8F9FA] flex items-center justify-center text-[14px] font-bold border border-[#E5E7EB] group-hover:border-[#FFD400] overflow-hidden shrink-0 transition-colors">
                {userData?.photoUrl ? (
                   <img src={userData.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                   userData?.name?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-[#9CA3AF] transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-[#E5E7EB] rounded-[8px] shadow-lg py-2 animate-in slide-in-from-top-2 duration-200 z-50">
                <div className="px-4 py-2 border-b border-[#E5E7EB] mb-1">
                  <p className="text-[14px] font-bold text-[#111111] truncate">{userData.name}</p>
                  <p className="text-[12px] text-[#5F6368] truncate">{userData.email}</p>
                </div>
                
                <div 
                  className="px-4 py-2 text-[13px] font-semibold text-[#5F6368] hover:text-[#111111] hover:bg-[#F8F9FA] cursor-pointer flex items-center gap-2 transition-colors"
                  onClick={() => { setShowDropdown(false); navigate("/profile"); }}
                >
                  <User className="w-4 h-4" /> My Profile
                </div>
                
                {userData.role === "educator" && (
                  <div 
                    className="px-4 py-2 text-[13px] font-semibold text-[#5F6368] hover:text-[#111111] hover:bg-[#F8F9FA] cursor-pointer flex items-center gap-2 transition-colors"
                    onClick={() => { setShowDropdown(false); navigate("/dashboard"); }}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Educator Dashboard
                  </div>
                )}

                <div 
                  className="px-4 py-2 text-[13px] font-semibold text-[#5F6368] hover:text-[#111111] hover:bg-[#F8F9FA] cursor-pointer flex items-center gap-2 transition-colors"
                  onClick={() => { setShowDropdown(false); navigate("/edit-profile"); }}
                >
                  <Settings className="w-4 h-4" /> Account Settings
                </div>

                <div className="border-t border-[#E5E7EB] my-1" />
                
                <div 
                  className="px-4 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2 transition-colors"
                  onClick={handleLogOut}
                >
                  <LogOut className="w-4 h-4" /> Log out
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-[13px] font-bold text-[#111111] hover:bg-[#F8F9FA] rounded-[6px] transition-colors cursor-pointer"
            >
              Log in
            </button>
            <button 
              onClick={() => navigate("/signup")}
              className="hidden sm:block px-4 py-2 bg-[#FFD400] hover:bg-[#e6be00] active:scale-[0.99] text-[#111111] text-[13px] font-bold rounded-[6px] transition-all cursor-pointer shadow-sm"
            >
              Sign up
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
