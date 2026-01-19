
import Nav from "../components/Nav_TEMP.jsx";
import home_page from "../assets/home_page.png";
import { SiViaplay } from "react-icons/si";
import ai from "../assets/aisearchicon.png";
import ai1 from "../assets/blackaicon.png";
import Logos from "../components/Logos.jsx";
import ExploreCourses from "../components/ExploreCourses.jsx";
import CardPage from "../components/CardPage.jsx";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  return (
    <div className="w-full overflow-hidden">
      <div className="w-full lg:h-[140vh] h-[70vh] relative">
        <Nav /> 
        <img src={home_page} alt="home_page" 
        className="object-cover md:object-fill w-full lg:h-full h-[50vh]"/>

        <span className="lg:text-[70px] absolute md:text-[40px] 
        lg:top-[10%] top-[15%] w-full flex items-center justify-center">
        Grow your skills to advance</span>
        <span className="lg:text-[70px] text-[20px] md:text-[40px]
        absolute lg:top-[18%] top-[20%] w-full flex items-center
        justify-center text-white font-bold">Your career path</span>
        <div className="absolute lg:top-[30%] top-[75%] md:top-[80%] w-full
        flex items-center justify-center gap-3 flex-wrap">
          <button className="px-[20px] py-[10px] border-2
          lg:border-white border-black lg:text-white text-black rounded-[10px]
          text-[18px] font-light flex gap-2 cursor-pointer" onClick={()=>navigate("/allcourses")}>
          View All Courses <SiViaplay className="w-[30px] h-[30px] lg:fill-white fill-black"/>
          </button>
          <button className="px-[20px] py-[10px] lg:bg-white bg-black 
          lg:text-black text-white rounded-[10px] text-[18px] font-light
          flex gap-2 cursor-pointer items-center justify-center">
          Search with AI
          <img src={ai} alt="ai_icon" className="w-[30px] h-[30px] rounded-full hidden lg:block"/>
          <img src={ai1} alt="ai1_icon" className="w-[35px] h-[35px] rounded-full lg:hidden"/>
          </button>
        </div>
        
      </div>
      <Logos/>
      <ExploreCourses/> 
      <CardPage/>
    </div>
  );
}

export default Home;
