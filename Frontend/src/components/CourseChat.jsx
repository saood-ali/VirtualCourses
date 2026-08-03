import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { MessageSquare, Send, ShieldCheck, Users } from "lucide-react";
import useCourseChat from "../customHooks/useCourseChat.js";

const initials = (name) => (name?.charAt(0)?.toUpperCase() || "U");

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

// Treat "within 80px of the bottom" as following the conversation.
const NEAR_BOTTOM_PX = 80;

export default function CourseChat({ courseId, enabled }) {
  const { userData } = useSelector((state) => state.user);
  const {
    messages,
    joined,
    error,
    members,
    typingLabel,
    loadingHistory,
    loadingOlder,
    hasMore,
    sendMessage,
    notifyTyping,
    stopTyping,
    loadOlder,
  } = useCourseChat(courseId, enabled);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const endRef = useRef(null);
  const atBottomRef = useRef(true);
  /* Height of the scroll content captured just before an older page renders, so
     the view can be pinned to the message the reader was already looking at. */
  const restoreRef = useRef(null);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  const handleLoadOlder = () => {
    const el = scrollRef.current;
    restoreRef.current = el ? el.scrollHeight - el.scrollTop : null;
    loadOlder();
  };

  /* Two competing jobs, both before paint: keep the newest message visible for a
     reader at the bottom, and hold position when older history is prepended. */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (restoreRef.current !== null) {
      el.scrollTop = el.scrollHeight - restoreRef.current;
      restoreRef.current = null;
      return;
    }
    if (atBottomRef.current) {
      endRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [messages]);

  // A new typing line grows the log; follow it only if already at the bottom.
  useEffect(() => {
    if (atBottomRef.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [typingLabel]);

  const handleChange = (e) => {
    setDraft(e.target.value);
    if (e.target.value.trim()) notifyTyping();
    else stopTyping();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim() || !joined) return;
    sendMessage(draft);
    setDraft("");
    atBottomRef.current = true;
  };

  if (!enabled) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[8px] p-6 shadow-sm">
        <h3 className="text-[18px] font-bold text-[#111111] mb-2">Course Discussion</h3>
        <p className="text-[14px] text-[#5F6368] leading-relaxed">
          Enroll in this course to join the live discussion with the instructor and other students.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[8px] shadow-sm flex flex-col">
      <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-[18px] h-[18px] text-[#5F6368]" />
          <h3 className="text-[18px] font-bold text-[#111111]">Course Discussion</h3>
        </div>
        <div className="flex items-center gap-3">
          {members.length > 0 && (
            <span
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#5F6368]"
              title={members.map((m) => m.name).join(", ")}
            >
              <Users className="w-3.5 h-3.5" />
              {members.length} online
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#5F6368]">
            <span
              className={`w-2 h-2 rounded-full ${joined ? "bg-[#FFD400]" : "bg-[#E5E7EB]"}`}
            />
            {joined ? "Connected" : "Connecting…"}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-[360px] overflow-y-auto px-6 py-4 flex flex-col gap-4 bg-[#F8F9FA]"
      >
        {error && (
          <div className="text-[13px] font-medium text-[#5F6368] bg-white border border-[#E5E7EB] rounded-[6px] px-4 py-3">
            {error}
          </div>
        )}

        {hasMore && (
          <button
            type="button"
            onClick={handleLoadOlder}
            disabled={loadingOlder}
            className="self-center text-[13px] font-semibold text-[#5F6368] hover:text-[#111111] bg-white border border-[#E5E7EB] rounded-[6px] px-4 py-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {loadingOlder ? "Loading…" : "Load earlier messages"}
          </button>
        )}

        {loadingHistory && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[14px] text-[#9CA3AF]">Loading discussion…</p>
          </div>
        )}

        {!error && !loadingHistory && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-[14px] text-[#9CA3AF] max-w-[260px]">
              No messages yet. Ask a question to start the discussion.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isSelf = msg.senderId === userData?._id;
          return (
            <div key={msg.id} className={`flex gap-3 ${isSelf ? "flex-row-reverse" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-[#FFD400] flex items-center justify-center text-[13px] font-bold text-[#111111] shrink-0 overflow-hidden">
                {msg.senderPhotoUrl ? (
                  <img src={msg.senderPhotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials(msg.senderName)
                )}
              </div>
              <div className={`max-w-[78%] ${isSelf ? "items-end text-right" : ""} flex flex-col`}>
                <div className={`flex items-center gap-1.5 mb-1 ${isSelf ? "justify-end" : ""}`}>
                  <span className="text-[13px] font-bold text-[#111111]">
                    {isSelf ? "You" : msg.senderName}
                  </span>
                  {msg.senderRole === "educator" && (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FFD400]" title="Educator" />
                  )}
                  <span className="text-[11px] font-medium text-[#9CA3AF]">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-[14px] text-[#111111] leading-relaxed bg-white border border-[#E5E7EB] rounded-[6px] px-4 py-2.5 text-left break-words">
                  {msg.text}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Reserved height so the log doesn't jump as the indicator appears. */}
      <div className="px-6 h-[22px] flex items-center border-t border-[#E5E7EB] bg-[#F8F9FA]">
        {typingLabel && (
          <span className="text-[12px] font-medium text-[#9CA3AF] italic">
            {typingLabel}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-[#E5E7EB] flex items-center gap-3">
        <input
          value={draft}
          onChange={handleChange}
          onBlur={stopTyping}
          disabled={!joined}
          maxLength={2000}
          placeholder={joined ? "Write a message…" : "Connecting to the discussion…"}
          className="flex-1 h-[52px] px-4 text-[15px] text-[#111111] placeholder-[#9CA3AF] bg-white border border-[#E5E7EB] rounded-[6px] focus:outline-none focus:border-[#FFD400] focus:ring-1 focus:ring-[#FFD400] transition-shadow disabled:bg-[#F8F9FA]"
        />
        <button
          type="submit"
          disabled={!joined || !draft.trim()}
          className="h-[52px] px-5 bg-[#FFD400] hover:bg-[#e6be00] text-[#111111] text-[15px] font-bold rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
}
