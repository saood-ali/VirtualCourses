import { useState } from "react";
import logo from "../assets/VC.png";
import google from "../assets/google_icon.png";
import { FaEye } from "react-icons/fa";
import { HiEyeSlash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { serverUrl } from "../App";
import axios from "axios";
import { toast } from "react-toastify";
function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async()=>{
    setLoading(true)
    try {
      const result = await axios.post(`${serverUrl}/api/auth/login,{
        email,
        password
        }, {withCredentials:true}`);
        console.log(result.data);
        setLoading(false);
        toast.success("Login Successfully");
        navigate("/");
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error(error.message);
    }
  }
  return (
    <div
      className="bg-[#dddbdb] w-full h-full flex
items-center justify-center"
    >
      <form className="w-[90%] md:w-200 h-150 ☐ bg-[white] shadow-xl rounded-2xl flex"
       onSubmit={(e)=>e.preventDefault()}>
        {/* Left Portion */}
        <div className="md:w-[50%] w-full h-full flex flex-col items-center justify-center gap-3 ">
          <div>
            <h1 className="font-semibold text-[black] text-2xl">
              Welcome Back
            </h1>
            <h2 className="text-[#999777] text-18px">Login to your account</h2>
          </div>
          
          <div className="flex flex-col gap-1 w-[80%] items-start justify-center px-3">
            <label htmlFor="email" className="font-semibold">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="border w-full h-[35px] border-[#e7e6e6] 
          text-[15px] px-[20px]"
              placeholder="Your Email" onChange={(e)=>setEmail(e.target.value)} value={email}
            />
          </div>
          <div className="flex flex-col gap-1 w-[80%] items-start justify-center px-3 relative">
            <label htmlFor="password" className="font-semibold">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="border w-full h-[35px] border-[#e7e6e6] 
          text-[15px] px-[20px]"
              placeholder="Your Password" onChange={(e)=>setPassword(e.target.value)} value={password}
            />
            {!showPassword ? (
              <FaEye
                className="absolute size-[20px] cursor-pointer 
            right-[5%] bottom-[10%]" onClick={() => setShowPassword(prev=>!prev)}
              />
            ) : (
              <HiEyeSlash
                className="absolute size-[20px] cursor-pointer 
            right-[5%] bottom-[10%]" onClick={() => setShowPassword(prev=>!prev)}
              />
            )}
          </div>
          
          <button
            className="w-[80%] h-[40px] bg-black text-white
          cursor-pointer flex items-center justify-center rounded-[5px] hover:scale-110" onClick={handleLogin} disabled={loading}
          >
            {loading? <ClipLoader size={30} color="white"/>: "Login"}
          </button>
          <span className="text-[13px] cursor-pointer text-[#585757]">Forget your Password?</span>

          <div className="w-[80%] flex items-center gap-2 ">
            <div className="w-[25%] h-[0.5px] bg-[#c4c4c4]"></div>
            <div
              className="w-[50%] text-[15px] text-[#6f6f6f]
            flex items-center justify-center"
            >
              Or continue
            </div>
            <div className="w-[25%] h-[0.5px] bg-[#c4c4c4]"></div>
          </div>
          <div
            className="w-[80%] h-[40px] border border-[black] 
          rounded-[5px] flex items-center justify-center cursor-pointer hover:scale-110"
          >
            <img src={google} alt="google" className="w-[25px]" />
            <span className="text-[18px] text-gray-500">oogle</span>
          </div>
          <div className="text-[#6f6f6f]">Create new account
          <span className="underline underline-offset-1 text-[black] cursor-pointer hover:text-xl" 
          onClick={()=>navigate("/signup")} >Signup</span>
          </div>
        </div>

        {/* Right Portion */}
        <div className="w-[50%] h-full rounded-r-2xl ☐ bg-[black] md:flex items-center justify-center flex-col hidden">
          <img src={logo} alt="logo" className="w-30 shadow-2xl" />
          <span className="text-2xl text-white">VIRTUAL COURSES</span>
        </div>
      </form>
    </div>
  );
}

export default Login;
