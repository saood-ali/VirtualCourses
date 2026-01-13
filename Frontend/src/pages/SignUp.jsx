import { useState } from "react";
import logo from "../assets/VC.png";
import google from "../assets/google_icon.png";
import { FaEye } from "react-icons/fa";
import { HiEyeSlash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import {ClipLoader} from "react-spinners";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { signInWithPopup } from "firebase/auth";
import { provider,auth } from "../utils/firebase";
function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSignup = async()=>{
    setLoading(true)
    try {
      const result = await axios.post(`${serverUrl}/api/auth/signup`,{
        name, email, password, role
      }, {withCredentials:true});
      dispatch(setUserData(result.data));
      setLoading(false);
      navigate("/");
      toast.success("Signup successful");
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error(error.message);
    }
  }
  const googleSignUp = async () => {
    try {
      const response = await signInWithPopup(auth,provider);
      let user = response.user;
      let name = user.displayName;
      let email = user.email;
      const result = await axios.post(`${serverUrl}/api/auth/googleauth`, 
        {name, email, role},
        {withCredentials:true})
        dispatch(setUserData(result.data));
        navigate("/");
        toast.success("Signup successful");
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message)
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
              Let's get started
            </h1>
            <h2 className="text-[#999777] text-18px">Create your account</h2>
          </div>
          <div className="flex flex-col gap-1 w-[80%] items-start justify-center px-3">
            <label htmlFor="name" className="font-semibold">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="border w-full h-[35px] border-[#e7e6e6] 
          text-[15px] px-[20px]"
              placeholder="Your Name" onChange={(e)=>setName(e.target.value)} value={name}
            />
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
          <div className="flex md:w-[50%] w-[70%] items-center justify-between">
            <span
              className={`px-[10px] py-[5px] border-[3px] 
          border-[#e7e6e6] rounded-xl cursor-pointer 
          hover:border-black hover:scale-110 hover:bg-green-200 
          ${role === "student" ? "border-black" : "border-[#646464]"}`} onClick={()=>setRole("student")}
            >
              Student
            </span>
            <span
              className={`px-[10px] py-[5px] border-[3px] 
          border-[#e7e6e6] rounded-xl cursor-pointer 
          hover:border-black hover:scale-110  hover:bg-green-200 
          ${role === "educator" ? "border-black" : "border-[#646464]"}`} onClick={()=>setRole("educator")}
            >
              Educator
            </span>
          </div>
          <button
            className="w-[80%] h-[40px] bg-black text-white
          cursor-pointer flex items-center justify-center rounded-[5px] hover:scale-110" onClick={handleSignup}
          disabled={loading} 
          >
            {loading? <ClipLoader size={30} color="white"/> : "SignUp"}
          </button>
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
          rounded-[5px] flex items-center justify-center cursor-pointer hover:scale-110" onClick={googleSignUp}
          >
            <img src={google} alt="google" className="w-[25px]" />
            <span className="text-[18px] text-gray-500">oogle</span>
          </div>
          <div className="text-[#6f6f6f] ">Already have an account 
          <span className="underline underline-offset-1 text-[black] cursor-pointer hover:text-xl" 
          onClick={()=>navigate("/login")}>Login</span>
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

export default SignUp;
