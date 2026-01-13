import logo from "../assets/VC.png";
import { IoPersonCircle } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { toast } from "react-toastify";
import axios from "axios";
import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { GiSplitCross } from "react-icons/gi";

function Nav() {
  const userState = useSelector((state) => state.user);
  const userData = userState?.userData;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [showHam, setShowHam] = useState(false);

  const handleLogOut = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/auth/logOut`, {
        withCredentials: true,
      });
      dispatch(setUserData(null));
      console.log(result.data);
      toast.success("LogOut Successfully");
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };
  return (
    <div>
      <div
        className="w-full h-[70px] fixed top-0 px-[20px] py-[10px]
      flex items-center justify-between bg-[#00000047]
      z-10"
      >
        <div className="lg:w-[20%] w-[40%] lg:pl-[50px]">
          <img
            src={logo}
            alt="logo"
            className="w-[60px] rounded-[5px] border-2
         border-white"
          />
        </div>
        <div className="w-auto lg:flex items-center justify-end gap-4 hidden">
          {!userData && (
            <IoPersonCircle className="w-[50px] h-[50px] fill-[black] cursor-pointer" onClick={()=>setShow(prev=>!prev)}/>
          )}

          {userData && userData.name && (
            <div
              className="w-[50px] h-[50px] rounded-full text-white flex items-center
          justify-center text-[20px] border-2 bg-black border-white cursor-pointer" onClick={()=>setShow(prev=>!prev)}
            >
              {userData?.name?.Slice(0, 1).toUpperCase()}
            </div>
          )}

          {userData?.role === "educator" && (
            <div
              className="px-[20px] py-[10px] border-2 lg:border-white border-black lg:text-white 
        bg-[black] text-black rounded-[10px] text-[18px] font-light cursor-pointer"
            >
              Dashboard
            </div>
          )}

          {!userData ? (
            <span
              className="px-[20px] py-[10px] border-2 border-white text-white 
        rounded-[10px] text-[18px] font-light cursor-pointer bg-[black]"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          ) : (
            <span
              className="px-[20px] py-[10px] bg-white text-black rounded-[10px]
            shadow-sm shadow-black text-[18px] cursor-pointer "
              onClick={() => handleLogOut()}
            >
              Logout
            </span>
          )}
          {show && <div className="absolute top-[110%] right-[15%] flex items-center flex-col justify-center
          gap-2 text-[16px] rounded-md bg-[white] px-[15px] py-[10px] border-2 border-black 
          hover:border-white hover:text-white cursor-pointer hover:bg-black ">
          <span className="bg-[black] text-white px-[30px] py-[10px] rounded-2xl
           hover:bg-gray-600" onClick={()=>navigate("/profile")}>My Profile</span>
          <span className="bg-[black] text-white px-[30px] py-[10px] rounded-2xl hover:bg-gray-600">My Courses</span>
          </div>}     
        </div>
        <GiHamburgerMenu className="w-[35px] h-[35px] lg:hidden fill-black cursor-pointer" onClick={()=>setShowHam(prev=>!prev)}/>

        <div className={`fixed top-0 left-0 w-screen h-screen bg-[#000000d6] flex items-center justify-center 
        flex-col gap-5 z-10 lg:hidden ${showHam? "translate-x-0 transition duration-600" : "-translate-x-full transition duration-600"}`}>
          <GiSplitCross className="w-[35px] h-[35px] fill-white absolute top-5 right-[4%]" onClick={()=>setShowHam(prev=>!prev)}/> 
          {!userData && (
            <IoPersonCircle className="w-[50px] h-[50px] fill-[black] cursor-pointer" />
          )}

          {userData && userData.name && (
            <div
              className="w-[50px] h-[50px] rounded-full text-white flex items-center
          justify-center text-[20px] border-2 bg-black border-white cursor-pointer" 
            >
              {userData?.name?.Slice(0, 1).toUpperCase()}
            </div>
          )}
          <div
              className="w-[200px] h-[65px] border-2 lg:border-white flex items-center justify-center border-black lg:text-white 
        bg-[black] text-black rounded-[10px] text-[18px] font-light cursor-pointer" onClick={()=>navigate("/profile")}
            >
              My Profile
            </div>
            <div
              className="w-[200px] h-[65px] border-2 lg:border-white flex items-center justify-center border-black lg:text-white 
        bg-[black] text-black rounded-[10px] text-[18px] font-light cursor-pointer"
            >
              My Courses
            </div>
          {userData?.role === "educator" && (
            <div
              className="w-[200px] h-[65px] border-2 lg:border-white flex items-center justify-center border-black lg:text-white 
        bg-[black] text-black rounded-[10px] text-[18px] font-light cursor-pointer"
            > 
              Dashboard
            </div>
          )}
          {!userData ? (
            <span
              className="w-[200px] h-[65px] border-2 lg:border-white flex items-center justify-center border-black lg:text-white 
        bg-[black] text-black rounded-[10px] text-[18px] font-light cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          ) : (
            <span
              className="w-[200px] h-[65px] border-2 lg:border-white flex items-center justify-center border-black lg:text-white 
        bg-[black] text-black rounded-[10px] text-[18px] font-light cursor-pointer"
              onClick={() => handleLogOut()}
            >
              Logout
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Nav;
