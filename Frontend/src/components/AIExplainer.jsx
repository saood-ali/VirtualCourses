import { useState, useRef } from "react";
import axios from "axios";
import { Sparkles } from "lucide-react"; 
import { serverUrl } from "../App.jsx";

const AIExplainer = ({ lectureId, videoRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState("");
  
  const loadingTimerRef = useRef(null);

  const handleAskAI = async () => {
    if (!lectureId) return alert("No lecture selected");
    
    const currentTime = videoRef.current ? videoRef.current.currentTime : 0;

    setLoading(true);
    setAnswer(""); // Clear previous answer

    loadingTimerRef.current = setTimeout(() => {
      setAnswer("First-time analysis: Listening to the lecture audio... This can take ~15-20 seconds for the first request.");
    }, 3000);

    try {
      const { data } = await axios.post(
        `${serverUrl}/api/course/explain-lecture`,
        {
          lectureId,
          currentTimestamp: currentTime,
          userQuestion: question || "Explain what is being taught right now in simple terms."
        },
        { withCredentials: true } 
      );

      // Request finished! Clear the "Long Loading" message timer
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);

      if (data.success) {
        setAnswer(data.answer);
      }
    } catch (error) {
      console.error(error);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      setAnswer("Sorry, I couldn't connect to the AI tutor right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mt-4">
      {/* The Magic Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md cursor-pointer"
      >
        <Sparkles size={18} />
        {isOpen ? "Close AI Tutor" : "Ask AI to Explain"}
      </button>

      {/* The AI Panel (Only shows when open) */}
      {isOpen && (
        <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="E.g., 'What does useEffect do?' (Optional)"
              className="flex-1 p-2 border rounded-md text-sm focus:outline-purple-500"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button 
              onClick={handleAskAI}
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium disabled:opacity-50 min-w-[80px] cursor-pointer"
            >
              {loading ? "Thinking..." : "Explain"}
            </button>
          </div>

          {/* The Answer Box */}
          {answer && (
            <div className={`p-3 border rounded-lg ${loading ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-purple-100'}`}>
              <h4 className={`text-xs font-bold uppercase mb-1 ${loading ? 'text-yellow-600' : 'text-purple-600'}`}>
                {loading ? "Status:" : "AI Tutor Says:"}
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {answer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIExplainer;