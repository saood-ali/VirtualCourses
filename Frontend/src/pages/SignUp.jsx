import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { signInWithPopup } from "firebase/auth";
import { X, User, Mail, Lock, Eye, EyeOff, Sparkles, Monitor, Shield } from "lucide-react";

import axiosClient from "../config/axiosClient.js";
import { setUserData } from "../redux/userSlice.js";
import { auth, provider } from "../utils/firebase.jsx";

function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      return toast.error("Please fill in all fields");
    }
    setLoading(true);
    try {
      const result = await axiosClient.post(
        `/api/auth/signup`, 
        { name, email, password, role }
      );
      if (result.data.token) {
        localStorage.setItem("token", result.data.token);
      }
      dispatch(setUserData(result.data.user || result.data));
      setLoading(false);
      navigate("/");
      toast.success("Signup successful");
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error(error.response?.data?.message || "Signup failed");
    }
  };

  const googleSignUp = async () => {
    try {
      const response = await signInWithPopup(auth, provider);
      const user = response.user;
      const name = user.displayName;
      const email = user.email;

      const result = await axiosClient.post(
        `/api/auth/googleauth`, 
        { name, email, role }
      );
      if (result.data.token) {
        localStorage.setItem("token", result.data.token);
      }
      dispatch(setUserData(result.data.user || result.data));
      navigate("/");
      toast.success("Signup successful");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Google Signup Failed");
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] flex items-center justify-center font-sans antialiased p-4">
      {/* Central Auth Container */}
      <div className="max-w-[1280px] w-full md:w-[90%] h-auto lg:h-[770px] bg-white border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side: Brand Panel (Hidden on Mobile) */}
        <div className="hidden lg:flex w-1/2 bg-[#F3F4F6] border-r border-[#E5E7EB] p-12 flex-col justify-between items-center text-center">
          
          {/* Brand Logo Header */}
          <div className="flex flex-col items-center mt-6">
            <div className="w-14 h-14 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center shadow-sm">
              <span className="text-xl font-bold text-[#111111]">V</span>
              <span className="text-xl font-bold text-[#FFD400]">C</span>
            </div>
            <h2 className="text-xl font-bold text-[#111111] mt-3.5">VirtualCourses</h2>
            <p className="text-xs text-[#5F6368] mt-1 font-medium">AI Powered Learning Marketplace</p>
          </div>

          {/* Features Cards Block */}
          <div className="w-full max-w-[360px] py-6 flex flex-col">
            {/* Feature 1 */}
            <div className="flex items-center gap-3.5 py-3 text-left">
              <div className="w-11 h-11 rounded-[6px] bg-[#FFD400]/10 border border-[#FFD400]/25 flex items-center justify-center text-[#111111] shrink-0">
                <Sparkles className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-[#111111]">AI Learning</h4>
                <p className="text-xs text-[#5F6368]">Search and understand concepts using AI.</p>
              </div>
            </div>

            <div className="border-t border-[#E5E7EB]"></div>

            {/* Feature 2 */}
            <div className="flex items-center gap-3.5 py-3 text-left">
              <div className="w-11 h-11 rounded-[6px] bg-[#FFD400]/10 border border-[#FFD400]/25 flex items-center justify-center text-[#111111] shrink-0">
                <Monitor className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-[#111111]">Live Classes</h4>
                <p className="text-xs text-[#5F6368]">Attend real-time interactive sessions.</p>
              </div>
            </div>

            <div className="border-t border-[#E5E7EB]"></div>

            {/* Feature 3 */}
            <div className="flex items-center gap-3.5 py-3 text-left">
              <div className="w-11 h-11 rounded-[6px] bg-[#FFD400]/10 border border-[#FFD400]/25 flex items-center justify-center text-[#111111] shrink-0">
                <Shield className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-[#111111]">Secure Payments</h4>
                <p className="text-xs text-[#5F6368]">Purchase courses securely and safely.</p>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="text-[11px] text-[#9CA3AF] mb-6 font-medium">
            Empowering educators and learners through AI.
          </div>

        </div>

        {/* Right Side: Authentication Form */}
        <div className="relative w-full lg:w-1/2 p-6 sm:p-10 lg:py-8 lg:px-12 flex flex-col justify-between">
          
          {/* Close button top right */}
          <button 
            onClick={() => navigate("/")} 
            className="absolute top-4 right-4 text-[#5F6368] hover:text-[#111111] hover:bg-[#F3F4F6] p-1.5 rounded-full transition-all cursor-pointer"
            aria-label="Close and return home"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Form Content Area */}
          <div className="my-auto py-2 space-y-4 max-w-[410px] w-full mx-auto">
            {/* Logo Text Block */}
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-[#FFD400] rounded-xs shrink-0"></span>
              <span className="text-xs font-semibold tracking-wide uppercase">VirtualCourses</span>
            </div>

            {/* Headings */}
            <div className="space-y-1">
              <h1 className="text-[42px] font-bold tracking-tight leading-none text-[#111111]">
                Create Account
              </h1>
              <p className="text-[20px] text-[#5F6368]">
                Join us to start your learning journey.
              </p>
            </div>

            {/* Signup Inputs */}
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
              {/* Name Input */}
              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-semibold text-[#111111]">
                  Name
                </label>
                <div className="relative flex items-center h-[50px] bg-white border border-[#E5E7EB] rounded-[6px] px-3.5 focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400] transition-shadow">
                  <User className="w-4.5 h-4.5 text-[#9CA3AF] mr-2.5 shrink-0" />
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    className="w-full h-full bg-transparent text-[13px] focus:outline-none placeholder-[#9CA3AF]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-semibold text-[#111111]">
                  Email Address
                </label>
                <div className="relative flex items-center h-[50px] bg-white border border-[#E5E7EB] rounded-[6px] px-3.5 focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400] transition-shadow">
                  <Mail className="w-4.5 h-4.5 text-[#9CA3AF] mr-2.5 shrink-0" />
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full h-full bg-transparent text-[13px] focus:outline-none placeholder-[#9CA3AF]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-semibold text-[#111111]">
                  Password
                </label>
                <div className="relative flex items-center h-[50px] bg-white border border-[#E5E7EB] rounded-[6px] px-3.5 focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400] transition-shadow">
                  <Lock className="w-4.5 h-4.5 text-[#9CA3AF] mr-2.5 shrink-0" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full h-full bg-transparent text-[13px] focus:outline-none placeholder-[#9CA3AF] pr-8"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div 
                    className="absolute right-3.5 text-[#9CA3AF] hover:text-[#111111] cursor-pointer transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </div>
                </div>
              </div>

              {/* Role Toggle Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#111111]">Register as</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex-1 h-[44px] rounded-[6px] border text-xs font-semibold transition-all cursor-pointer ${
                      role === "student"
                        ? "bg-[#FFD400]/10 border-[#FFD400] text-[#111111] ring-1 ring-[#FFD400]"
                        : "bg-white border-[#E5E7EB] text-[#5F6368] hover:bg-[#F8F9FA]"
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("educator")}
                    className={`flex-1 h-[44px] rounded-[6px] border text-xs font-semibold transition-all cursor-pointer ${
                      role === "educator"
                        ? "bg-[#FFD400]/10 border-[#FFD400] text-[#111111] ring-1 ring-[#FFD400]"
                        : "bg-white border-[#E5E7EB] text-[#5F6368] hover:bg-[#F8F9FA]"
                    }`}
                  >
                    Educator
                  </button>
                </div>
              </div>

              {/* SignUp Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] bg-[#FFD400] hover:bg-[#e6be00] active:scale-[0.99] text-[#111111] text-sm font-semibold rounded-[6px] transition-all flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-75 disabled:cursor-not-allowed mt-2.5"
              >
                {loading ? <ClipLoader size={20} color="#111111" /> : "Sign Up"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-[#E5E7EB]"></div>
              <span className="flex-shrink mx-3.5 text-[10px] font-semibold tracking-wider text-[#9CA3AF]">
                OR CONTINUE WITH
              </span>
              <div className="flex-grow border-t border-[#E5E7EB]"></div>
            </div>

            {/* Google OAuth Button with Colorful Vector Logo */}
            <button
              onClick={googleSignUp}
              className="w-full h-[48px] bg-white hover:bg-[#F8F9FA] active:scale-[0.99] border border-[#E5E7EB] rounded-[6px] text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Bottom Login Navigation */}
          <div className="text-center text-xs text-[#5F6368] mt-2">
            Already have an account?{" "}
            <span 
              className="font-semibold text-[#FFD400] hover:text-[#e6be00] cursor-pointer transition-colors"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}

export default SignUp;
