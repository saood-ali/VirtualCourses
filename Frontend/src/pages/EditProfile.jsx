import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { 
  ArrowLeft, 
  Camera, 
  User, 
  Mail, 
  FileText, 
  Save, 
  X 
} from "lucide-react";

import axiosClient from "../config/axiosClient.js";
import { setUserData } from "../redux/userSlice.js";

const EditProfileForm = ({ initialData }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(initialData.name || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [preview, setPreview] = useState(initialData.photoUrl || "");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoUrl(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleEditProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (photoUrl) formData.append("photoUrl", photoUrl);

      const response = await axiosClient.post(`/api/user/profile`, formData);
      dispatch(setUserData(response.data));
      setLoading(false);
      navigate("/profile");
      toast.success("Profile Updated Successfully");
    } catch (error) {
      setLoading(false);
      console.log(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const firstInitial = initialData.name ? initialData.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-white text-[#111111] flex flex-col items-center justify-center font-sans antialiased p-4 relative">

      {/* Top-Left Back Button — identical to Profile.jsx */}
      <button
        onClick={() => navigate("/profile")}
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-[#111111] hover:text-[#5F6368] transition-colors font-medium cursor-pointer"
        aria-label="Cancel and go back"
      >
        <ArrowLeft className="w-4.5 h-4.5" />
        <span>Back</span>
      </button>

      {/* Main Card — identical shape to Profile.jsx */}
      <div className="max-w-[660px] w-full bg-white border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 sm:p-8 flex flex-col my-12">

        <form onSubmit={handleEditProfile}>

          {/* ── Header Section (exact replica of Profile header) ── */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {preview ? (
                <img
                  src={preview}
                  alt="Profile Preview"
                  className="w-[120px] h-[120px] rounded-full object-cover border border-[#E5E7EB]"
                />
              ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-[#FFD400] text-[#111111] flex items-center justify-center text-5xl font-bold border border-[#E5E7EB]">
                  {firstInitial}
                </div>
              )}
              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                aria-label="Choose profile picture"
              >
                <Camera className="w-4.5 h-4.5 text-[#5F6368]" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Same heading + subtitle as Profile */}
            <h2 className="text-[40px] font-bold text-[#111111] leading-none mt-5">
              Edit Profile
            </h2>
            <p className="text-base text-[#5F6368] mt-2">
              Update your account information and bio.
            </p>
          </div>

          {/* Divider — identical to Profile */}
          <div className="border-t border-[#E5E7EB] my-6"></div>

          {/* ── Rows — same structure as Profile info rows ── */}
          <div className="flex flex-col">

            {/* Row 1 : Username — editable */}
            <div className="flex items-center min-h-[64px] border-b border-[#E5E7EB] py-3 gap-3">
              {/* Icon box — identical to Profile */}
              <div className="w-9 h-9 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#5F6368] shrink-0">
                <User className="w-4.5 h-4.5" />
              </div>
              {/* Label — identical to Profile */}
              <span className="text-sm font-semibold text-[#111111] shrink-0">Full Name</span>
              {/* Editable value slot */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="ml-auto text-sm font-medium text-[#5F6368] text-right bg-transparent focus:outline-none focus:text-[#111111] placeholder-[#9CA3AF] w-full max-w-[55%] transition-colors"
              />
            </div>

            {/* Row 2 : Email — read-only */}
            <div className="flex items-center min-h-[64px] border-b border-[#E5E7EB] py-3 gap-3">
              <div className="w-9 h-9 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#5F6368] shrink-0">
                <Mail className="w-4.5 h-4.5" />
              </div>
              <span className="text-sm font-semibold text-[#111111] shrink-0">Email Address</span>
              <input
                type="email"
                readOnly
                value={initialData.email}
                className="ml-auto text-sm font-medium text-[#9CA3AF] text-right bg-transparent focus:outline-none cursor-not-allowed w-full max-w-[55%] select-all"
              />
            </div>

            {/* Row 3 : Bio — full-width card textarea */}
            <div className="flex flex-col pt-3 pb-1 gap-2">
              {/* Label row — same icon + label pattern */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#5F6368] shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <span className="text-sm font-semibold text-[#111111]">Bio</span>
              </div>
              {/* Textarea card */}
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full mt-1 px-4 py-3 text-sm font-medium text-[#111111] placeholder-[#9CA3AF] bg-white border border-[#E5E7EB] rounded-[6px] resize-none leading-relaxed focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400] transition-shadow"
              />
            </div>

          </div>

          {/* ── Action Buttons — identical to Profile ── */}
          <div className="flex flex-col sm:flex-row gap-4 w-full mt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-[50px] bg-[#FFD400] hover:bg-[#e6be00] active:scale-[0.99] text-[#111111] text-sm font-semibold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <ClipLoader size={20} color="#111111" />
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#111111]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex-1 h-[50px] bg-white hover:bg-[#F8F9FA] active:scale-[0.99] border border-[#E5E7EB] text-[#111111] text-sm font-semibold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <X className="w-4 h-4 text-[#5F6368]" />
              <span>Cancel</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

function EditProfile() {
  const { userData } = useSelector((state) => state.user);

  if (!userData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans antialiased">
        <ClipLoader size={40} color="#111111" />
      </div>
    );
  }

  return <EditProfileForm initialData={userData} key={userData._id || "edit-form"} />;
}

export default EditProfile;