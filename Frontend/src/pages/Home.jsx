import Nav from "../components/Nav_TEMP.jsx";
import home_page from "../assets/home_page.png";
import { SiViaplay } from "react-icons/si";
import ai from "../assets/aisearchicon.png";
import ai1 from "../assets/blackaicon.png";
import Logos from "../components/Logos.jsx";
import ExploreCourses from "../components/ExploreCourses.jsx";
import CardPage from "../components/CardPage.jsx";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import About from "../components/About.jsx";
import ReviewPage from "../components/ReviewPage.jsx";
import ElectricBorder from "../components/ElectricBorder.jsx"; 
import BlurText from "../components/BlurText.jsx";
import { DotPattern } from "../components/DotPattern.jsx"; 

function Home() {
  const navigate = useNavigate();
  return (
    <div className="w-full overflow-hidden relative">
      
      {/* 2. BACKGROUND PATTERN:  cover entire page */}
      <DotPattern 
        width={20} 
        height={20} 
        cx={1} 
        cy={1} 
        cr={1} 
        className="fixed inset-0 h-full w-full fill-gray-300/40 -z-10" 
      />

      <div className="w-full lg:h-[140vh] h-[70vh] relative z-10">
        <Nav /> 
        <img src={home_page} alt="home_page" 
        className="object-cover md:object-fill w-full lg:h-full h-[50vh]"/>

        {/* "Grow your skills to advance" */}
        <div className="absolute lg:top-[10%] top-[15%] w-full flex items-center justify-center">
          <BlurText
            text="Grow your skills to advance"
            delay={50}
            animateBy="letters"
            direction="bottom"
            className="lg:text-[70px] text-[25px] md:text-[40px] text-[#5f7363]"
          />
        </div>
        
        {/* "Your career path" */}
        <div className="absolute lg:top-[18%] top-[20%] w-full flex items-center justify-center">
          <BlurText
            text="Your career path"
            delay={100} 
            animateBy="letters"
            direction="top"
            className="lg:text-[70px] text-[20px] md:text-[40px] text-white font-bold"
          />
        </div>

        <div className="absolute lg:top-[30%] top-[75%] md:top-[80%] w-full
        flex items-center justify-center gap-3 flex-wrap">
          
          <ElectricBorder 
            color="#7df9ff" 
            speed={2.9} 
            chaos={0.05} 
            borderRadius={10}
          >
            <button 
              className="px-[20px] py-[10px] 
              lg:text-white text-black rounded-[10px]
              text-[18px] font-light flex gap-2 cursor-pointer items-center" 
              onClick={()=>navigate("/allcourses")}
            >
              View All Courses 
              <SiViaplay className="w-[30px] h-[30px] lg:fill-white fill-black"/>
            </button>
          </ElectricBorder>

          <button className="px-[20px] py-[10px] lg:bg-white bg-black 
          lg:text-black text-white rounded-[10px] text-[18px] font-light
          flex gap-2 cursor-pointer items-center justify-center" onClick={()=>navigate("/search")}>
          Search with AI
          <img src={ai} alt="ai_icon" className="w-[30px] h-[30px] rounded-full hidden lg:block"/>
          <img src={ai1} alt="ai1_icon" className="w-[35px] h-[35px] rounded-full lg:hidden"/>
          </button>
        </div>
      </div>

      {/* 4. Other Sections: Wrapped in relative z-10 to ensure transparency works correctly over dots */}
      <div className="relative z-10">
        <Logos/>
        <ExploreCourses/> 
        <CardPage/>
        <About/>
        <ReviewPage/>
        <Footer/>
      </div>
    </div>
  );
}

export default Home;