import React from "react";
import { SiViaplay } from "react-icons/si";
import { TbDeviceDesktopAnalytics } from "react-icons/tb";
import { FaUikit } from "react-icons/fa6";
import { MdAppShortcut } from "react-icons/md";
import { FaHackerrank } from "react-icons/fa";
import { AiFillOpenAI } from "react-icons/ai";
import { SiGoogledataproc } from "react-icons/si";
import { BsClipboardDataFill } from "react-icons/bs";
import { SiOpenaigym } from "react-icons/si";
import { useNavigate } from "react-router-dom";

function ExploreCourses() {
  const navigate = useNavigate();
  return (
    <div
      className="w-full min-h-[50vh] lg:h-[50vh] flex
    flex-col lg:flex-row items-center justify-center gap-4
    px-[30px]"
    >
      {/* left/top div */}
      <div
        className="w-full lg:w-[350px] lg:h-full h-[400px]
      flex flex-col items-start justify-center gap-1 md:px-[40px]
      px-[20px]"
      >
        <span className="text-[35px] font-semibold">Explore</span>
        <span className="text-[35px] font-semibold">Our Courses</span>
        <p className="text-[17px] "></p>
        <button className="px-[20px] py-[10px] border-2 bg-[black] 
        border-white text-white rounded-[10px] text-[18px] font-light
        flex gap-2 mt-[40px] cursor-pointer" onClick={()=>navigate("/allcourses")}>Explore Courses
          <SiViaplay className="w-[30px] h-[30px] lg:fill-white fill-black"/>
        </button>
      </div>

      {/* right/bottom div */}
      <div className="w-[720px] max-w-[90%] lg:h-[300px] md:min-h-[300px] 
      flex items-center justify-center lg:gap-[60px] gap-[50px] flex-wrap 
      mb-[50px] lg:mb-0 ">
      <div className="w-[100px] h-[130px] font-light text-[13px] flex flex-col gap-3 text-center">
        <div className="w-[100px] h-[90px] bg-[#fbd9fb] rounded-lg flex items-center
        justify-center">
        <TbDeviceDesktopAnalytics className="w-[60px] h-[60px] text-[#6d6c6c]"/>
        </div>
        Web Dev
      </div> 

      <div className="w-[100px] h-[130px] font-light text-[13px] flex flex-col gap-3 text-center">
        <div className="w-[100px] h-[90px] bg-[#d9fbe0] rounded-lg flex items-center
        justify-center">
        <FaUikit className="w-[60px] h-[60px] text-[#6d6c6c]"/>
        </div>
        UI/UX Designing
      </div>

      <div className="w-[100px] h-[130px] font-light text-[13px] flex flex-col gap-3 text-center">
        <div className="w-[100px] h-[90px] bg-[#fbd9fb] rounded-lg flex items-center
        justify-center">
        <MdAppShortcut className="w-[50px] h-[50px] text-[#6d6c6c]"/>
        </div>
        App Dev
      </div>

      <div className="w-[100px] h-[130px] font-light text-[13px] flex flex-col gap-3 text-center">
        <div className="w-[100px] h-[90px] bg-[#fcb9c8] rounded-lg flex items-center
        justify-center">
        <FaHackerrank className="w-[55px] h-[55px] text-[#6d6c6c]"/>
        </div>
        Ethical Hacking
      </div>

      <div className="w-[100px] h-[130px] font-light text-[13px] flex flex-col gap-3 text-center">
        <div className="w-[100px] h-[90px] bg-[#9bea94] rounded-lg flex items-center
        justify-center">
        <AiFillOpenAI className="w-[60px] h-[60px] text-[#6d6c6c]"/>
        </div>
        AI/ML 
      </div>

      <div className="w-[100px] h-[130px] font-light text-[13px] flex flex-col gap-3 text-center">
        <div className="w-[100px] h-[90px] bg-[#fbd9fb] rounded-lg flex items-center
        justify-center">
        <SiGoogledataproc className="w-[50px] h-[50px] text-[#6d6c6c]"/>
        </div>
        Data Science
      </div>

      <div className="w-[100px] h-[130px] font-light text-[13px] flex flex-col gap-3 text-center">
        <div className="w-[100px] h-[90px] bg-[#fbd9fb] rounded-lg flex items-center
        justify-center">
        <BsClipboardDataFill className="w-[50px] h-[50px] text-[#6d6c6c]"/>
        </div>
        Data Analytics
      </div>

      <div className="w-[100px] h-[130px] font-light text-[13px] flex flex-col gap-3 text-center">
        <div className="w-[100px] h-[90px] bg-[#254f92] rounded-lg flex items-center
        justify-center">
        <SiOpenaigym className="w-[50px] h-[50px] text-[#6d6c6c]"/>
        </div>
        AI TOOLS
      </div>

      </div>
    </div>
  );
}

export default ExploreCourses;
