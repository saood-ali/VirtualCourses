import { useRef, useEffect, useState } from 'react';
import { BsArrowReturnLeft } from "react-icons/bs";
import ai from "../assets/aisearchicon.png";
import { RiMicAiFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import axiosClient from "../config/axiosClient.js";
import start from "../assets/aiaudio.mp3";
function SearchWithAi() {
  const startSound = new Audio(start);
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [listening,setListening] = useState(false);

  function speak(message) {
    let utterance = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(utterance);
  }
  const recognitionRef = useRef(null);

useEffect(() => {
  // Initialize SpeechRecognition only once when component mounts
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false; 
    recognitionRef.current.lang = 'en-US';
  }
}, []);
 const handleSearch = () => {
    // Safety check: ensure browser supports it
    if (!recognitionRef.current) return;

    setListening(true);
    startSound.play();

    // ✅ Access the instance via .current
    recognitionRef.current.onresult = async (e) => {
        const transcript = e.results[0][0].transcript.trim();
        setInput(transcript);
        await handleRecommendation(transcript);
        setListening(false); // Good practice to turn off listening state here
    };

    // Handle errors or end of speech
    recognitionRef.current.onerror = (e) => {
        console.error("Speech error:", e);
        setListening(false);
    };

    recognitionRef.current.start();
};
  const handleRecommendation = async (query) => {
    try {
      const result = await axiosClient.post(
        `/api/course/search`,
        { input: query }
      );
      console.log(result.data);
      setRecommendations(result.data);
      setListening(false);
      if (result.data.length > 0) {
        speak(`Here are ${result.data.length} recommendations for you`);
      } else {
        speak(`No recommendations found for ${query}`);
      }
    } catch (error) {
      console.log(error);
      setListening(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-linear-gradient-to-br from-black to-gray-900 text-white 
    flex flex-col items-center px-4 py-16"
    >
      {/* Search Container */}
      <div className="bg-white shadow-xl rounded-3xl p-6 sm:p-8 w-full max-w-2xl text-center relative">
        <BsArrowReturnLeft className="text-[#e0dddd] w-[22px] h-[22px] cursor-pointer absolute" onClick={()=>navigate("/")} />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-600 mb-6 flex items-center justify-center gap-2">
          <img src={ai} alt="" className="w-8 h-8 sm:w-[30px] sm:h-[30px] " />
          Search with <span className="text-[#CB99C7]">AI</span>
        </h1>
        <div className="flex items-center bg-gray-700 rounded-full overflow-hidden shadow-lg relative w-full">
          <input
            type="text"
            className="grow px-4 py-3 bg-transparent text-white placeholder-gray-400 
        focus:outline-none text-sm sm:text-base"
            placeholder="What do you want to learn? (e.g. AI,MERN,CLOUD,...)"
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
        
        {input && (
          <button className="absolute right-14 sm:right-16 bg-white rounded-full">
            <img
              src={ai}
              className="w-10 h-10 p-2 rounded-full"
              onClick={() => handleRecommendation(input)}
            />
          </button>
        )}
        <button
          className="absolute right-2 bg-white rounded-full w-10 h-10 flex items-center justify-center"
          onClick={handleSearch}
        >
          <RiMicAiFill className="w-6 h-6 text-[#cb87c5]" />
        </button>
        </div>
      </div> 
      {recommendations.length > 0 ? (
        <div className="w-full max-w-6xl mt-12 px-2 sm:px-4">
         <h1 className="text-xl sm:text-2xl font-semibold mb-6 text-white text-center">AI Search Results</h1>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {
                recommendations?.map((course,index)=>(
                    <div key={index} className="bg-white text-black p-5 rounded-2xl shadow-md hover:shadow-indigo-500/30
                    transition-all duration-200 border border-gray-200 cursor-pointer hover:bg-gray-200" 
                    onClick={()=>navigate(`/viewcourse/${course._id}`)}>
                    <h2 className="text-lg font-bold sm:text-xl">{course.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">{course.category}</p>
                    </div>
                ))
            }
         </div>
        </div>)
        :(listening? <h1 className="text-center text-xl sm:text-2xl mt-10 text-gray-400">Listening...</h1>
        :<h1 className="text-center text-xl sm:text-2xl mt-10 text-gray-400">No recommendations found</h1>)
         
        
      }
    </div>
  );
}

export default SearchWithAi;
