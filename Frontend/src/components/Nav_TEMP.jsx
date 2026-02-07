import logo from "../assets/VC.png";
import { IoPersonCircle } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App.jsx";
import { setUserData } from "../redux/userSlice.js";
import { toast } from "react-toastify";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { GiSplitCross } from "react-icons/gi";

function Nav() {
  const userState = useSelector((state) => state.user);
  const userData = userState?.userData;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [show, setShow] = useState(false);
  const [showHam, setShowHam] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogOut = async () => {
    try {
        await axios.post(
            `${serverUrl}/api/auth/logout`,
            {},
            { withCredentials: true } 
        );
        toast.success("LogOut Successfully");
    } catch (error) {
        console.log(error);
    } finally {
        dispatch(setUserData(null));
        localStorage.removeItem("token");
        navigate("/");
        setShowHam(false);
    }
  };

  return (
    <div>
      <div
        className="w-full h-[70px] fixed top-0 px-[20px] py-[10px]
        flex items-center justify-between bg-[#00000047] backdrop-blur-md
        z-999"
      >
        <div className="lg:w-[20%] w-[40%] lg:pl-[50px]">
          <img
            src={logo}
            alt="logo"
            className="w-[60px] rounded-[5px] border-2
          border-white cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
        
        {/* DESKTOP MENU */}
        <div className="w-auto lg:flex items-center justify-end gap-4 hidden">
          {!userData && (
            <IoPersonCircle
              className="w-[50px] h-[50px] fill-[black] cursor-pointer"
              onClick={() => setShow((prev) => !prev)}
            />
          )}

          <div className="relative" ref={dropdownRef}>
            {userData?.photoUrl ? (
              <img
                src={userData?.photoUrl}
                className="w-[50px] h-[50px] rounded-full text-white flex items-center
    justify-center text-[20px] border-2 bg-black border-white cursor-pointer object-cover"
                onClick={() => setShow((prev) => !prev)}
              />
            ) : (
              userData && (
                <div
                  className="w-[50px] h-[50px] rounded-full text-white flex items-center
    justify-center text-[20px] border-2 bg-black border-white cursor-pointer"
                  onClick={() => setShow((prev) => !prev)}
                >
                  {userData?.name?.slice(0, 1).toUpperCase()}
                </div>
              )
            )}

            {show && (
              <div
                className="absolute top-[120%] right-0 flex items-center flex-col justify-center
  gap-2 text-[16px] rounded-md bg-[white] px-[15px] py-[10px] border-2 border-black 
  hover:border-white hover:text-white cursor-pointer hover:bg-black min-w-[150px] z-50 shadow-xl"
              >
                <span
                  className="bg-[black] text-white px-[30px] py-[10px] rounded-2xl
    hover:bg-gray-600 w-full text-center"
                  onClick={() => {
                    navigate("/profile");
                    setShow(false);
                  }}
                >
                  My Profile
                </span>
                <span
                  className="bg-[black] text-white px-[30px] py-[10px] rounded-2xl hover:bg-gray-600 w-full text-center"
                  onClick={() => {
                    navigate("/mycourses");
                    setShow(false);
                  }}
                >
                  My Courses
                </span>
              </div>
            )}
          </div>

          {userData?.role === "educator" && (
            <div
              className="px-[20px] py-[10px] border-2 lg:border-white border-black lg:text-white 
        bg-[black] text-black rounded-[10px] text-[18px] font-light cursor-pointer hover:bg-gray-800 hover:text-white"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </div>
          )}

          {!userData ? (
            <span
              className="px-[20px] py-[10px] border-2 border-white text-white 
        rounded-[10px] text-[18px] font-light cursor-pointer bg-[black] hover:bg-gray-800"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          ) : (
            <span
              className="px-[20px] py-[10px] bg-white text-black rounded-[10px]
            shadow-sm shadow-black text-[18px] cursor-pointer hover:bg-gray-200"
              onClick={() => handleLogOut()}
            >
              Logout
            </span>
          )}
        </div>
        
        <GiHamburgerMenu
          className="w-[35px] h-[35px] lg:hidden text-white cursor-pointer"
          onClick={() => setShowHam((prev) => !prev)}
        />

        {/* ✅ FIX 2: Z-Index set to [1000] for the Mobile Menu Overlay.
           This ensures the black menu screen covers EVERYTHING on the page.
        */}
        <div
          className={`fixed top-0 left-0 w-screen h-screen bg-[#000000d6] flex items-center justify-center 
        flex-col gap-5 z-1000 lg:hidden ${
          showHam
            ? "translate-x-0 transition duration-600"
            : "-translate-x-full transition duration-600"
        }`}
        >
          <GiSplitCross
            className="w-[35px] h-[35px] fill-white absolute top-5 right-[4%] 
          cursor-pointer"
            onClick={() => setShowHam((prev) => !prev)}
          />
          {!userData && (
            <IoPersonCircle className="w-[50px] h-[50px] fill-white cursor-pointer" />
          )}

          {userData?.photoUrl ? (
            <img
              src={userData?.photoUrl}
              className="w-[50px] h-[50px] rounded-full text-white flex items-center
          justify-center text-[20px] border-2 bg-black border-white cursor-pointer object-cover"
            />
          ) : (
            userData && (
              <div
                className="w-[50px] h-[50px] rounded-full text-white flex items-center
          justify-center text-[20px] border-2 bg-black border-white cursor-pointer"
              >
                {userData?.name?.slice(0, 1).toUpperCase()}
              </div>
            )
          )}
          
          <div
            className="w-[200px] h-[65px] border-2 border-white flex items-center justify-center 
        bg-[black] text-white rounded-[10px] text-[18px] font-light cursor-pointer"
            onClick={() => {
              navigate("/profile");
              setShowHam(false);
            }}
          >
            My Profile
          </div>
          <div
            className="w-[200px] h-[65px] border-2 border-white flex items-center justify-center 
        bg-[black] text-white rounded-[10px] text-[18px] font-light cursor-pointer"
            onClick={() => {
              navigate("/mycourses");
              setShowHam(false);
            }}
          >
            My Courses
          </div>
          {userData?.role === "educator" && (
            <div
              className="w-[200px] h-[65px] border-2 border-white flex items-center justify-center 
        bg-[black] text-white rounded-[10px] text-[18px] font-light cursor-pointer"
              onClick={() => {
                navigate("/dashboard");
                setShowHam(false);
              }}
            >
              Dashboard
            </div>
          )}
          {!userData ? (
            <span
              className="w-[200px] h-[65px] border-2 border-white flex items-center justify-center 
        bg-[black] text-white rounded-[10px] text-[18px] font-light cursor-pointer"
              onClick={() => {
                navigate("/login");
                setShowHam(false);
              }}
            >
              Login
            </span>
          ) : (
            <span
              className="w-[200px] h-[65px] border-2 border-white flex items-center justify-center 
        bg-[black] text-white rounded-[10px] text-[18px] font-light cursor-pointer"
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