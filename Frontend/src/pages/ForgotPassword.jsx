import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, CheckCircle2, Shield, X, Mail, KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import axiosClient from "../config/axiosClient";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Timer logic for Step 2
  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      await axiosClient.post("/api/auth/sendotp", { email });
      setStep(2);
      setTimeLeft(300);
      toast.success("OTP sent to your email");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter the OTP");
    if (timeLeft <= 0) return toast.error("OTP has expired, please request a new one");
    setLoading(true);
    try {
      await axiosClient.post("/api/auth/verifyotp", { email, otp });
      setStep(3);
      toast.success("OTP verified successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      await axiosClient.post("/api/auth/resetpassword", { email, password: newPassword });
      toast.success("Password reset successful!");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] flex items-center justify-center font-sans antialiased p-4">
      {/* Central Auth Container */}
      <div className="max-w-[1024px] w-full md:w-[90%] h-auto lg:min-h-[650px] bg-white border border-[#E5E7EB] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col lg:flex-row relative">
        
        {/* Left Side: Brand Panel */}
        <div className="hidden lg:flex w-1/2 bg-[#F3F4F6] border-r border-[#E5E7EB] p-12 flex-col justify-between items-center text-center">
          
          <div className="flex flex-col items-center mt-6 cursor-pointer" onClick={() => navigate("/")}>
            <img src="/logo.svg" alt="VirtualCourses" className="h-12 w-auto mb-2" />
            <p className="text-xs text-[#5F6368] mt-1 font-medium">AI Powered Learning Marketplace</p>
          </div>

          <div className="w-full max-w-[360px] py-6 flex flex-col">
            <div className="flex items-center gap-3.5 py-3 text-left">
              <div className="w-11 h-11 rounded-[6px] bg-[#FFD400]/10 border border-[#FFD400]/25 flex items-center justify-center text-[#111111] shrink-0">
                <Shield className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-[#111111]">Secure Account Recovery</h4>
                <p className="text-xs text-[#5F6368]">Your account's safety is our top priority.</p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#9CA3AF] mb-6 font-medium">
            Empowering educators and learners through AI.
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="relative w-full lg:w-1/2 p-6 sm:p-8 lg:py-8 lg:px-10 flex flex-col justify-between">
          
          <button 
            onClick={() => navigate("/login")} 
            className="absolute top-4 right-4 text-[#5F6368] hover:text-[#111111] hover:bg-[#F3F4F6] p-1.5 rounded-full transition-all cursor-pointer"
            aria-label="Back to login"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="my-auto py-4 space-y-5 max-w-[410px] w-full mx-auto">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-[#FFD400] rounded-xs shrink-0"></span>
              <span className="text-xs font-semibold tracking-wide uppercase">Password Reset</span>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-[42px] font-bold tracking-tight leading-none text-[#111111]">
                {step === 1 ? "Forgot Password" : step === 2 ? "Verify OTP" : "New Password"}
              </h1>
              <p className="text-[15px] font-medium text-[#5F6368]">
                {step === 1 ? "Enter your email to receive an OTP." : step === 2 ? `Enter the 4-digit OTP sent to ${email}` : "Enter your new password to secure your account."}
              </p>
            </div>

            {/* Step 1: Send OTP */}
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#111111]">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-[#9CA3AF]" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] text-[#111111] text-[15px] rounded-[6px] focus:ring-1 focus:ring-[#FFD400] focus:border-[#FFD400] block pl-10 p-3 transition-colors shadow-sm"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[15px] font-bold py-3.5 rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2 disabled:opacity-70"
                >
                  {loading ? "Sending..." : "Send OTP"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#111111]">4-Digit OTP</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-[#9CA3AF]" />
                    </div>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={4}
                      className="w-full bg-white border border-[#E5E7EB] text-[#111111] text-[20px] font-bold tracking-widest text-center rounded-[6px] focus:ring-1 focus:ring-[#FFD400] focus:border-[#FFD400] block py-3 transition-colors shadow-sm"
                      placeholder="••••"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className={`${timeLeft > 0 ? 'text-[#5F6368]' : 'text-red-500'}`}>
                    Time remaining: {formatTime(timeLeft)}
                  </span>
                  {timeLeft <= 0 && (
                    <button type="button" onClick={handleSendOTP} className="text-[#FFD400] hover:underline cursor-pointer">
                      Resend OTP
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || timeLeft <= 0}
                  className="w-full bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[15px] font-bold py-3.5 rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2 disabled:opacity-70"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#111111]">New Password</label>
                  <div className="relative flex items-center h-[50px] bg-white border border-[#E5E7EB] rounded-[6px] px-3.5 focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400] transition-shadow">
                    <Lock className="w-4.5 h-4.5 text-[#9CA3AF] mr-2.5 shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-full bg-transparent text-[13px] focus:outline-none placeholder-[#9CA3AF] pr-8"
                      placeholder="••••••••"
                    />
                    <div 
                      className="absolute right-3.5 text-[#9CA3AF] hover:text-[#111111] cursor-pointer transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[15px] font-bold py-3.5 rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2 disabled:opacity-70"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                  {!loading && <CheckCircle2 className="w-4 h-4" />}
                </button>
              </form>
            )}
            
            <div className="pt-2 text-center text-[13px] font-medium text-[#5F6368]">
              Remember your password?{" "}
              <span onClick={() => navigate("/login")} className="text-[#111111] font-bold cursor-pointer hover:underline">
                Back to Login
              </span>
            </div>
          </div>
          
          <div className="text-[12px] text-[#9CA3AF] font-medium text-center mt-6">
            © 2026 VirtualCourses
          </div>
        </div>
      </div>
    </div>
  );
}
