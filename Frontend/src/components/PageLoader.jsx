export default function PageLoader({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">

      {/* Logo + Pulse ring */}
      <div className="relative flex items-center justify-center mb-10">
        {/* Outer pulse ring */}
        <span className="absolute inline-flex h-24 w-24 rounded-full bg-[#FFD400]/20 animate-ping" />
        {/* Inner static ring */}
        <span className="relative inline-flex h-20 w-20 rounded-full bg-[#FFF8DD] border border-[#FFD400]/30 items-center justify-center">
          <img
            src="/logo.svg"
            alt="VirtualCourses"
            className="h-10 w-auto"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          {/* Fallback initials if logo fails */}
          <span
            style={{ display: "none" }}
            className="text-[18px] font-black text-[#111111] items-center justify-center"
          >
            VC
          </span>
        </span>
      </div>

      {/* Brand name */}
      <p className="text-[#111111] text-[18px] font-bold tracking-tight mb-1">
        VirtualCourses
      </p>
      <p className="text-[#999999] text-[12px] font-medium uppercase tracking-widest mb-10">
        {message}
      </p>

      {/* Animated yellow progress bar */}
      <div className="w-48 h-[3px] bg-[#F0F0F0] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FFD400] rounded-full"
          style={{
            animation: "vc-progress 1.6s ease-in-out infinite",
          }}
        />
      </div>

      {/* Keyframe injection */}
      <style>{`
        @keyframes vc-progress {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 70%;  margin-left: 15%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
