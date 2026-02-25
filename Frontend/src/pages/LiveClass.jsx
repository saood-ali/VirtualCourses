import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import { serverUrl } from '../App.jsx'; // Your API URL constant

// Connect to Backend Socket
const socket = io(serverUrl); 

const LiveClass = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  
  const [videoDetails, setVideoDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Instructor "Go Live" State
  const [youtubeLink, setYoutubeLink] = useState("");

const fetchSession = useCallback(async () => {
    try {
        const res = await axios.get(`${serverUrl}/api/live/details/${courseId}`, {
            withCredentials: true
        });
        
        if (res.data.youtubeVideoId) {
            setVideoDetails(res.data);
            socket.emit("join_room", res.data.socketRoomId);
        }
    } catch (err) {
        setVideoDetails(null);
        console.error(err)
    } finally {
        setLoading(false);
    }
}, [courseId]);

  useEffect(() => {
    fetchSession();

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, [courseId, fetchSession]);

  // 2. Handle Sending Chat Messages
  const sendMessage = () => {
    if (!input.trim() || !videoDetails) return;
    
    const msgData = {
        room: videoDetails.socketRoomId,
        user: userData?.name || "Anonymous",
        text: input,
        isInstructor: userData?.role === 'instructor'
    };

    socket.emit("send_message", msgData);
    setMessages((prev) => [...prev, msgData]);
    setInput("");
  };

  // 3. Handle "Go Live" (Instructor Only)
  const handleGoLive = async () => {
    try {
        // Extract ID from URL (supports full URL or just ID)
        // e.g. https://youtu.be/dQw4w9WgXcQ -> dQw4w9WgXcQ
        let videoId = youtubeLink;
        if(youtubeLink.includes('/')) {
            videoId = youtubeLink.split('/').pop().split('?')[0];
        }

        if (!videoId) return toast.error("Invalid YouTube Link");

        await axios.post(`${serverUrl}/api/live/start`, {
            courseId,
            youtubeId: videoId,
            title: "Live Doubt Session"
        }, { withCredentials: true });

        toast.success("Session Started! 🔴");
        fetchSession(); // Refresh to show the video player

    } catch (error) {
        toast.error("Failed to start session");
        console.error(error);
    }
  };

  if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading Studio...</div>;

  // --- SCENARIO A: Instructor Setup Screen (No Active Class) ---
  if (!videoDetails && userData?.role === 'instructor') {
      return (
          <div className="h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6">
              <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                  <h1 className="text-2xl font-bold mb-2 text-red-500 flex items-center gap-2">
                      <span>🎥</span> Start Live Class
                  </h1>
                  <p className="text-gray-400 mb-6 text-sm">
                      Go to YouTube Studio → Create Live Stream → Copy the Video Link and paste it here.
                  </p>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">YouTube Live Link</label>
                          <input 
                              value={youtubeLink}
                              onChange={(e) => setYoutubeLink(e.target.value)}
                              placeholder="e.g. https://youtu.be/..."
                              className="w-full bg-gray-900 border border-gray-600 rounded p-3 mt-1 text-white focus:ring-2 focus:ring-red-500 outline-none"
                          />
                      </div>
                      <button 
                          onClick={handleGoLive}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition-all"
                      >
                          GO LIVE NOW
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // --- SCENARIO B: Student Waiting Screen (No Active Class) ---
  if (!videoDetails) {
      return (
        <div className="flex h-screen bg-gray-900 items-center justify-center flex-col text-center p-4">
            <div className="text-6xl mb-4">☕</div>
            <h2 className="text-2xl font-bold text-gray-200">No Live Class Active</h2>
            <p className="text-gray-500 mt-2">The instructor hasn't started the session yet. <br/>Please refresh in a few minutes.</p>
            <button onClick={() => navigate(-1)} className="mt-6 text-blue-400 hover:underline">Go Back</button>
        </div>
      );
  }

  // --- SCENARIO C: ACTIVE LIVE CLASS (Video + Chat) ---
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white overflow-hidden">
      {/* LEFT: YouTube Player */}
      <div className="w-full md:w-3/4 h-[50vh] md:h-full relative bg-black">
        <iframe 
          width="100%" height="100%" 
          src={`https://www.youtube.com/embed/${videoDetails.youtubeVideoId}?autoplay=1&modestbranding=1&rel=0`} 
          title="Live Class" frameBorder="0" allowFullScreen
          className="absolute inset-0"
        ></iframe>
      </div>

      {/* RIGHT: Chat Room */}
      <div className="w-full md:w-1/4 h-[50vh] md:h-full flex flex-col border-l border-gray-700 bg-gray-800">
        <div className="p-4 bg-gray-900 font-bold border-b border-gray-700 flex justify-between items-center">
            <span>Live Chat</span>
            <span className="text-xs text-red-500 animate-pulse">● LIVE</span>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.isInstructor ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${m.isInstructor ? 'text-yellow-400' : 'text-gray-400'}`}>
                            {m.user} {m.isInstructor && '★'}
                        </span>
                    </div>
                    <div className={`px-3 py-2 rounded-lg text-sm max-w-[90%] ${
                        m.isInstructor 
                        ? 'bg-yellow-600/20 text-yellow-200 border border-yellow-600/50' 
                        : 'bg-gray-700 text-gray-100'
                    }`}>
                        {m.text}
                    </div>
                </div>
            ))}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
            <input 
                className="flex-1 bg-gray-700 text-white rounded px-3 py-2 outline-none text-sm focus:ring-1 focus:ring-blue-500" 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Ask a doubt..." 
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button 
                onClick={sendMessage} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded text-sm font-bold transition-colors"
            >
                Send
            </button>
        </div>
      </div>
    </div>
  );
};

export default LiveClass;