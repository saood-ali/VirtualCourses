import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { 
  Sparkles, ChevronDown, User, LogOut, Settings, LayoutDashboard, Search
} from "lucide-react";

import axiosClient from "../config/axiosClient.js";
import { setUserData } from "../redux/userSlice.js";

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
        className="flex items-center gap-2.5 font-extrabold tracking-tight text-[18px] text-[#111111] cursor-pointer"
      >
        <div className="w-6 h-6 bg-[#FFD400] rounded-[6px] shrink-0 shadow-sm" />
        VirtualCourses
      </div>

      {/* ── Center: Main Navigation ── */}
      <nav className="hidden md:flex items-center gap-8 text-[14px]">
        <span onClick={() => navigate("/")} className={navItemClass("/")}>
          Home
        </span>
        <span onClick={() => navigate("/allcourses")} className={navItemClass("/allcourses")}>
          Explore Courses
        </span>
        
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
