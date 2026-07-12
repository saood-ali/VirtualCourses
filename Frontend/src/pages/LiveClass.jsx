import React, { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { ArrowLeft, Radio } from "lucide-react";
import axiosClient from "../config/axiosClient.js";
import { toast } from "react-toastify";

const APP_ID = Number(import.meta.env.VITE_ZEGO_APP_ID);
const SERVER_SECRET = import.meta.env.VITE_ZEGO_SERVER_SECRET;

/* ── Helper: random guest ID ── */
const randomID = (len = 5) => {
  const chars = "12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const LiveClass = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);

  const isEducator = userData?.role === "educator";

  /* ── Live status sync — unchanged ── */
  const updateLiveStatus = useCallback(async (isLive) => {
    if (!isEducator) return;
    try {
      await axiosClient.post(`/api/live/start`, { courseId, isLive });
    } catch (err) {
      console.error("Failed to update live status", err);
    }
  }, [courseId, isEducator]);

  /* ── ZegoCloud room init — unchanged ── */
  const myMeeting = useCallback(async (element) => {
    if (!element) return;
    if (!APP_ID || !SERVER_SECRET) {
      toast.error("Video SDK keys missing! Check .env file.");
      return;
    }

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      APP_ID,
      SERVER_SECRET,
      courseId,
      userData?._id || randomID(),
      userData?.name || "Guest Student"
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);
    const role = isEducator ? ZegoUIKitPrebuilt.Host : ZegoUIKitPrebuilt.Audience;

    zp.joinRoom({
      container: element,
      scenario: {
        mode: ZegoUIKitPrebuilt.LiveStreaming,
        config: { role },
      },
      sharedLinks: [{ name: "Class Link", url: window.location.href }],
      showUserList: true,
      onJoinRoom: () => {
        if (isEducator) {
          updateLiveStatus(true);
          toast.success("You are LIVE! 🔴");
        }
      },
      onLeaveRoom: () => {
        if (isEducator) {
          updateLiveStatus(false);
          navigate(-1);
        }
      },
    });
  }, [courseId, userData, navigate, updateLiveStatus, isEducator]);

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A] text-white font-sans antialiased">

      {/* ── Compact top bar ── */}
      <div className="shrink-0 h-12 border-b border-white/10 flex items-center px-5 gap-4 bg-[#111111] z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-[#FFD400] rounded-[2px] shrink-0" />
          <span className="text-xs font-semibold tracking-wide uppercase text-white/60">VirtualCourses</span>
        </div>
        {/* Live indicator */}
        <div className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {isEducator ? "Hosting" : "Live Class"}
          </span>
          <span className="text-[11px] font-medium text-white/30 ml-1">
            {isEducator ? "You are the host" : "Audience mode"}
          </span>
        </div>
      </div>

      {/* ── ZegoCloud full-screen room mount ── */}
      <div className="flex-1 w-full" ref={myMeeting} />

    </div>
  );
};

export default LiveClass;