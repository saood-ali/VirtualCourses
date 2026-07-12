import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  ArrowLeft, 
  Camera, 
  User, 
  Mail, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Pencil, 
  LogOut 
} from "lucide-react";

import { setUserData } from "../redux/userSlice.js";
import axiosClient from "../config/axiosClient.js";

function Profile() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await axiosClient.post(`/api/auth/logout`);
      dispatch(setUserData(null));
      localStorage.removeItem("token");
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Logout Failed");
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans antialiased">
        <h2 className="text-base font-semibold text-[#5F6368]">Loading Profile...</h2>
      </div>
    );
  }

  // Get first initial
  const firstInitial = userData?.name ? userData.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col items-center justify-center font-sans antialiased p-4 relative">
      
      {/* Top-Left Back Button */}
      <button 
        onClick={() => navigate("/")} 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-[#111111] hover:text-[#5F6368] transition-colors font-medium cursor-pointer"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        <span>Back</span>
      </button>

      {/* Main Profile Card */}
      <div className="max-w-[660px] w-full bg-white border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 sm:p-8 flex flex-col my-12">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center">
          
          {/* Avatar Container */}
          <div className="relative">
            {userData?.photoUrl ? (
              <img
                src={userData.photoUrl}
                alt="Profile Avatar"
                className="w-[120px] h-[120px] rounded-full object-cover border border-[#E5E7EB]"
              />
            ) : (
              <div className="w-[120px] h-[120px] rounded-full bg-[#FFD400] text-[#111111] flex items-center justify-center text-5xl font-bold border border-[#E5E7EB]">
                {firstInitial}
              </div>
            )}
            {/* Small camera edit overlay button */}
            <button 
              onClick={() => navigate("/edit-profile")}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
              aria-label="Upload photo"
            >
              <Camera className="w-4.5 h-4.5 text-[#5F6368]" />
            </button>
          </div>

          {/* User Name & Email */}
          <h2 className="text-[40px] font-bold text-[#111111] leading-none mt-5">
            {userData?.name || "User Profile"}
          </h2>
          <p className="text-base text-[#5F6368] mt-2">
            {userData?.email}
          </p>

        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E7EB] my-6"></div>

        {/* Profile Information List */}
        <div className="flex flex-col">
          
          {/* Row 1: Full Name */}
          <div className="flex items-center min-h-[64px] border-b border-[#E5E7EB] py-3">
            <div className="w-9 h-9 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#5F6368] shrink-0">
              <User className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-semibold text-[#111111] ml-3">Full Name</span>
            <span className="text-sm text-[#5F6368] ml-auto text-right font-medium">
              {userData?.name || "N/A"}
            </span>
          </div>

          {/* Row 2: Email Address */}
          <div className="flex items-center min-h-[64px] border-b border-[#E5E7EB] py-3">
            <div className="w-9 h-9 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#5F6368] shrink-0">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-semibold text-[#111111] ml-3">Email Address</span>
            <span className="text-sm text-[#5F6368] ml-auto text-right font-medium select-all">
              {userData?.email || "N/A"}
            </span>
          </div>

          {/* Row 3: Bio */}
          <div className="flex items-start min-h-[64px] border-b border-[#E5E7EB] py-3">
            <div className="w-9 h-9 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#5F6368] shrink-0 mt-0.5">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-semibold text-[#111111] ml-3 mt-2">Bio</span>
            <span className="text-sm text-[#5F6368] ml-auto text-right font-medium max-w-[65%] leading-relaxed">
              {userData?.description || "Passionate about learning and teaching. Always exploring new technologies."}
            </span>
          </div>

          {/* Row 4: Role */}
          <div className="flex items-center min-h-[64px] border-b border-[#E5E7EB] py-3">
            <div className="w-9 h-9 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#5F6368] shrink-0">
              <Briefcase className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-semibold text-[#111111] ml-3">Role</span>
            <span className="ml-auto">
              <span className="inline-flex items-center bg-[#FFD400] text-[#111111] text-xs font-semibold rounded-[6px] px-3 py-1 capitalize">
                {userData?.role || "Student"}
              </span>
            </span>
          </div>

          {/* Row 5: Enrolled Courses */}
          <div className="flex items-center min-h-[64px] py-3">
            <div className="w-9 h-9 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#5F6368] shrink-0">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <span className="text-sm font-semibold text-[#111111] ml-3">Enrolled Courses</span>
            <span className="text-sm text-[#5F6368] ml-auto text-right font-medium">
              {userData?.enrolledCourses?.length !== undefined 
                ? `${userData.enrolledCourses.length} Courses` 
                : "12 Courses"}
            </span>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full mt-6">
          <button
            onClick={() => navigate("/edit-profile")}
            className="flex-1 h-[50px] bg-[#FFD400] hover:bg-[#e6be00] active:scale-[0.99] text-[#111111] text-sm font-semibold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Pencil className="w-4 h-4 text-[#111111]" />
            <span>Edit Profile</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="flex-1 h-[50px] bg-white hover:bg-[#F8F9FA] active:scale-[0.99] border border-[#E5E7EB] text-[#111111] text-sm font-semibold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#5F6368]" />
            <span>Logout</span>
          </button>
        </div>

      </div>

    </div>
  );
}

export default Profile;