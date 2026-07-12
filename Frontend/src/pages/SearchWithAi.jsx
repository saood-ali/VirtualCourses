import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Sparkles, Tag, BookOpen, X, RotateCcw } from "lucide-react";
import { RiMicAiFill } from "react-icons/ri";
import axiosClient from "../config/axiosClient.js";
import start from "../assets/aiaudio.mp3";

const QUICK_TOPICS = [
  "Web Development", "AI/ML", "Data Science",
  "UI/UX Designing", "App Development", "Ethical Hacking",
];

function SearchWithAi() {
  const startSound = new Audio(start);
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [listening, setListening] = useState(false);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Speech recognition init ── */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = "en-US";
    }
  }, []);

  function speak(message) {
    const utterance = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(utterance);
  }

  /* ── Voice handler ── */
  const handleVoiceSearch = () => {
    if (!recognitionRef.current) return;
    setListening(true);
    startSound.play();

    recognitionRef.current.onresult = async (e) => {
      const transcript = e.results[0][0].transcript.trim();
      setInput(transcript);
      await handleRecommendation(transcript);
      setListening(false);
    };
    recognitionRef.current.onerror = (e) => {
      console.error("Speech error:", e);
      setListening(false);
    };
    recognitionRef.current.start();
  };

  /* ── Text search ── */
  const handleRecommendation = async (query) => {
    if (!query?.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const result = await axiosClient.post(`/api/course/search`, { input: query });
      setRecommendations(result.data);
      setLoading(false);
      setListening(false);
      if (result.data.length > 0) {
        speak(`Here are ${result.data.length} recommendations for you`);
      } else {
        speak(`No recommendations found for ${query}`);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      setListening(false);
    }
  };

  const handleReset = () => {
    setInput("");
    setRecommendations([]);
    setSearched(false);
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleQuickTopic = (topic) => {
    setInput(topic);
    handleRecommendation(topic);
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans antialiased">

      {/* ── Sticky Top Nav ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] h-14 flex items-center px-5 sm:px-8 gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#111111] hover:text-[#5F6368] transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <div className="h-4 w-px bg-[#E5E7EB]" />
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#FFD400] rounded-[2px] shrink-0" />
          <span className="text-xs font-semibold tracking-wide uppercase">VirtualCourses</span>
        </div>
        <div className="ml-auto text-xs font-semibold text-[#9CA3AF]">
          AI Powered Search
        </div>
      </header>

      {/* ══════════════════════════════
          HERO / SEARCH SECTION
      ══════════════════════════════ */}
      <div className={`border-b border-[#E5E7EB] transition-all duration-500 ${searched ? "py-8" : "py-20"}`}>
        <div className="max-w-[680px] mx-auto px-4 sm:px-6 flex flex-col items-center text-center">

          {/* Icon + Badge */}
          {!searched && (
            <div className="flex flex-col items-center mb-7">
              <div className="w-16 h-16 rounded-[6px] bg-[#FFD400]/10 border border-[#FFD400]/30 flex items-center justify-center mb-5">
                <Sparkles className="w-7 h-7 text-[#111111]" />
              </div>
              <h1 className="text-[40px] font-bold text-[#111111] leading-none mb-3">
                Search with AI
              </h1>
              <p className="text-base text-[#5F6368] max-w-[420px] leading-relaxed">
                Describe what you want to learn in plain English or use your voice. Our AI will find the best matching courses.
              </p>
            </div>
          )}

          {/* Compact heading when results shown */}
          {searched && (
            <div className="flex items-center gap-3 mb-6 w-full">
              <h1 className="text-xl font-bold text-[#111111]">AI Search</h1>
              <button
                onClick={handleReset}
                className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#5F6368] hover:text-[#111111] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Search
              </button>
            </div>
          )}

          {/* ── Search Input ── */}
          <div className="w-full">
            <div className={`flex items-center border rounded-[6px] bg-white transition-shadow
              ${listening
                ? "border-[#FFD400] ring-1 ring-[#FFD400]"
                : "border-[#E5E7EB] focus-within:border-[#FFD400] focus-within:ring-1 focus-within:ring-[#FFD400]"
              } ${searched ? "h-[50px]" : "h-[58px]"}`}
            >
              <Search className="w-4.5 h-4.5 text-[#9CA3AF] mx-4 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder={listening ? "Listening to your voice..." : "What do you want to learn? (e.g. AI, MERN, Cloud...)"}
                className="flex-1 h-full bg-transparent text-sm focus:outline-none placeholder-[#9CA3AF] text-[#111111]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRecommendation(input)}
              />
              {/* Clear */}
              {input && !listening && (
                <button onClick={handleReset} className="mr-2 text-[#9CA3AF] hover:text-[#111111] transition-colors cursor-pointer p-1">
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Divider */}
              <div className="h-5 w-px bg-[#E5E7EB] mx-1 shrink-0" />
              {/* Mic button */}
              <button
                onClick={handleVoiceSearch}
                disabled={listening}
                title="Search by voice"
                className={`mx-2 w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer shrink-0
                  ${listening
                    ? "bg-[#FFD400] text-[#111111]"
                    : "text-[#5F6368] hover:bg-[#F8F9FA] hover:text-[#111111]"
                  }`}
              >
                <RiMicAiFill className={`w-4.5 h-4.5 ${listening ? "animate-pulse" : ""}`} />
              </button>
              {/* Search button */}
              <button
                onClick={() => handleRecommendation(input)}
                disabled={loading || !input.trim()}
                className="m-1.5 h-[calc(100%-12px)] px-4 bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-xs font-semibold rounded-[4px] transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "..." : "Search"}
              </button>
            </div>

            {/* Keyboard hint */}
            {!searched && (
              <p className="text-[11px] text-[#9CA3AF] mt-2 text-left font-medium">
                Press <kbd className="px-1.5 py-0.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-[10px] font-semibold text-[#5F6368]">Enter</kbd> to search
              </p>
            )}
          </div>

          {/* ── Quick Topic Chips ── */}
          {!searched && (
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              <span className="text-xs font-semibold text-[#9CA3AF] self-center mr-1">Try:</span>
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleQuickTopic(topic)}
                  className="h-[30px] px-3 text-xs font-medium border border-[#E5E7EB] text-[#5F6368] bg-white rounded-[6px] hover:border-[#FFD400] hover:text-[#111111] hover:bg-[#FFD400]/5 transition-all cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════
          RESULTS SECTION
      ══════════════════════════════ */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8">

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden animate-pulse">
                <div className="h-[160px] bg-[#F8F9FA]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-[#F8F9FA] rounded w-4/5" />
                  <div className="h-3 bg-[#F8F9FA] rounded w-2/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {searched && !loading && recommendations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-[6px] bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#9CA3AF] mb-5">
              <BookOpen className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-semibold text-[#111111] mb-2">No results found</h2>
            <p className="text-sm text-[#5F6368] max-w-[300px] leading-relaxed mb-6">
              No courses found for <span className="font-semibold text-[#111111]">"{input}"</span>. Try a broader topic or use voice search.
            </p>
            <button
              onClick={handleReset}
              className="h-[44px] px-6 bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-sm font-semibold rounded-[6px] transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && recommendations.length > 0 && (
          <>
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[40px] font-bold text-[#111111] leading-none">Results</h2>
                <p className="text-base text-[#5F6368] mt-1">
                  {recommendations.length} course{recommendations.length > 1 ? "s" : ""} matching{" "}
                  <span className="font-semibold text-[#111111]">"{input}"</span>
                </p>
              </div>
              <span className="text-xs font-semibold text-[#9CA3AF] shrink-0 ml-4">
                AI Powered
              </span>
            </div>

            <div className="border-t border-[#E5E7EB] mb-6" />

            {/* Result cards — same token structure as AllCourses/MyEnrolledCourses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {recommendations.map((course, index) => (
                <div
                  key={course._id || index}
                  onClick={() => navigate(`/viewcourse/${course._id}`)}
                  className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col cursor-pointer hover:border-[#FFD400] transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="h-[160px] w-full overflow-hidden bg-[#F8F9FA] shrink-0">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  {/* Body */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="text-sm font-semibold text-[#111111] leading-snug line-clamp-2">
                      {course.title}
                    </h3>
                    {course.category && (
                      <span className="inline-flex items-center gap-1 self-start text-[11px] font-medium text-[#5F6368] bg-[#F8F9FA] border border-[#E5E7EB] rounded-[6px] px-2 py-0.5">
                        <Tag className="w-3 h-3" />
                        {course.category}
                      </span>
                    )}
                    <div className="flex-1" />
                    <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between">
                      <span className="text-xs font-medium text-[#5F6368]">AI Recommended</span>
                      <span className="text-[11px] font-semibold text-[#5F6368] bg-[#F8F9FA] border border-[#E5E7EB] group-hover:bg-[#FFD400] group-hover:border-[#FFD400] group-hover:text-[#111111] rounded-[6px] px-2.5 py-1 transition-colors">
                        View →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default SearchWithAi;
