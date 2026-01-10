import React from "react";
import logo from "../assets/VC.png";
function SignUp() {
  return (
    <div
      className="bg-[#dddbdb] w-[100vw] h-[100vh] flex
items-center justify-center"
    >
      <form className="w-[90%] md:w-200 h-150 ☐ bg-[white] shadow-xl rounded-2xl flex">
        {/* Left Portion */}
        <div className="md:w-[50%] w-[100%] h-[100%] flex flex-col items-center justify-center gap-3 "></div>

        {/* Right Portion */}
        <div className="w-[50%] h-[100%] rounded-r-2xl ☐ bg-[black] md:flex items-center justify-center flex-col hidden">
          <img src={logo} alt="logo" className="w-30 shadow-2xl" />
          <span className="text-2xl text-white">VIRTUAL COURSES</span>
        </div>
      </form>
    </div>
  );
}

export default SignUp;
