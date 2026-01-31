
import about from "../assets/ai_student.png";
import { TfiLayoutLineSolid } from "react-icons/tfi";
import { BsPatchCheckFill } from "react-icons/bs";
import video from "../assets/Modified_Video_With_More_Texts.mp4";

function About() {
  return (
    <div className="w-screen lg:h-[70vh] min-h-[50vh] flex flex-wrap items-center justify-center gap-2 mb-[30px]">
      {/* For Image area */}
      <div className="lg:w-[40%] md:w-[80%] w-full h-full flex items-center justify-center relative">
        <img src={about} alt="" className="w-[80%] h-[90%] rounded-lg" />
        <div className="max-w-[350px] mx-auto p-4 absolute top-[55%] left-[50%]">
          <video
            src={video}
            className="w-full rounded-xl shadow-lg border-2 border-white"
            controls
            autoplay
            loop
          />
        </div>
      </div>
      {/* For about info */}
      <div className="lg:w-[50%] md:w-[70%] w-full h-full flex items-start justify-center flex-col px-[35px] md:px-[80px]">
        <div className="flex text-[20px] items-center justify-center gap-[20px]">
          About Us
          <TfiLayoutLineSolid className="w-[40px] h-[40px]" />
        </div>
        <div className="md:text-[45px] text-[35px] font-semibold">
          We are maximizing your learning growth
        </div>
        <div className="text-[15px]">
          We provide a modern Learning Management System to simplify online
          education, track progress, and enhance student-instructor
          collaboration efficiently .
        </div>
        <div className="w-full lg:w-[60%]">
            <div className="flex items-center justify-between mt-[40px]">
                <div className="flex items-center justify-center gap-[10px]">
                <BsPatchCheckFill className="w-[20px] h-[20px]"/>Simplified Learning
                </div>
                <div className="flex items-center justify-center gap-[10px]">
                <BsPatchCheckFill className="w-[20px] h-[20px]"/>Expert Trainers
                </div>
            </div>
            <div className="flex items-center justify-between mt-[40px]">
                <div className="flex items-center justify-center gap-[10px]">
                <BsPatchCheckFill className="w-[20px] h-[20px]"/>Big Experience
                </div>
                <div className="flex items-center justify-center gap-[10px]">
                <BsPatchCheckFill className="w-[20px] h-[20px]"/>Lifetime Access
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default About;
