import { useState } from "react";
import axios from "axios";
import { Sparkles } from "lucide-react"; 
import { serverUrl } from "../App.jsx";

const AIExplainer = ({ lectureId, videoRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState("");

  const handleAskAI = async () => {
    if (!lectureId) return alert("No lecture selected");
    
    const currentTime = videoRef.current ? videoRef.current.currentTime : 0;

    setLoading(true);
    setAnswer(""); // Clear previous answer

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

      if (data.success) {
        setAnswer(data.answer);
      }
    } catch (error) {
      console.error(error);
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
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md"
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
              className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Thinking..." : "Explain"}
            </button>
          </div>

          {/* The Answer Box */}
          {answer && (
            <div className="p-3 bg-white border border-purple-100 rounded-lg">
              <h4 className="text-xs font-bold text-purple-600 uppercase mb-1">AI Tutor Says:</h4>
              <p className="text-gray-700 text-sm leading-relaxed">{answer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIExplainer;