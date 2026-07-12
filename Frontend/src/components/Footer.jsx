import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Twitter, Github, Linkedin } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide footer on authentication pages
  if (location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/forget-password") {
    return null;
  }

  return (
    <footer className="bg-white border-t border-[#E5E7EB] pt-16 pb-8">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-16">
          
          {/* Brand & Description (Takes up 2 columns) */}
          <div className="lg:col-span-2 flex flex-col items-start pr-4">
            <div 
              onClick={() => navigate("/")} 
              className="flex items-center cursor-pointer mb-4"
            >
              <img src="/logo.svg" alt="VirtualCourses" className="h-12 w-auto" />
            </div>
            <p className="text-[14px] text-[#5F6368] leading-relaxed mb-6 max-w-sm">
              The premium, AI-powered learning marketplace for modern professionals. Empowering educators to teach, and students to master new skills with unprecedented speed.
            </p>
            <div className="flex items-center gap-4 text-[#9CA3AF]">
              <Twitter className="w-6 h-6 hover:text-[#111111] cursor-pointer transition-colors" />
              <Github className="w-6 h-6 hover:text-[#111111] cursor-pointer transition-colors" />
              <Linkedin className="w-6 h-6 hover:text-[#111111] cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Links: Platform */}
          <div>
            <h3 className="text-[13px] font-bold text-[#111111] uppercase tracking-wider mb-5">Platform</h3>
            <ul className="space-y-3 text-[14px] font-medium text-[#5F6368]">
              <li className="hover:text-[#111111] cursor-pointer transition-colors" onClick={() => navigate("/allcourses")}>Explore Courses</li>
              <li className="hover:text-[#111111] cursor-pointer transition-colors" onClick={() => navigate("/search")}>
                Search with AI <Sparkles className="inline-block w-3 h-3 ml-1 text-[#FFD400]" />
              </li>
              <li className="hover:text-[#111111] cursor-pointer transition-colors" onClick={() => navigate("/login")}>Educator Login</li>
              <li className="hover:text-[#111111] cursor-pointer transition-colors" onClick={() => navigate("/signup")}>Student Signup</li>
            </ul>
          </div>

          {/* Links: Top Categories */}
          <div>
            <h3 className="text-[13px] font-bold text-[#111111] uppercase tracking-wider mb-5">Categories</h3>
            <ul className="space-y-3 text-[14px] font-medium text-[#5F6368]">
              <li className="hover:text-[#111111] cursor-pointer transition-colors">Web Development</li>
              <li className="hover:text-[#111111] cursor-pointer transition-colors">App Development</li>
              <li className="hover:text-[#111111] cursor-pointer transition-colors">AI & Machine Learning</li>
              <li className="hover:text-[#111111] cursor-pointer transition-colors">UI / UX Design</li>
            </ul>
          </div>

          {/* Links: Company */}
          <div>
            <h3 className="text-[13px] font-bold text-[#111111] uppercase tracking-wider mb-5">Company</h3>
            <ul className="space-y-3 text-[14px] font-medium text-[#5F6368]">
              <li className="hover:text-[#111111] cursor-pointer transition-colors">About Us</li>
              <li className="hover:text-[#111111] cursor-pointer transition-colors">Careers</li>
              <li className="hover:text-[#111111] cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-[#111111] cursor-pointer transition-colors">Terms of Service</li>
            </ul>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] font-medium text-[#9CA3AF]">
          <p>© {new Date().getFullYear()} VirtualCourses. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            Designed with <span className="text-[#FFD400]">♥</span> for Educators
          </div>
        </div>

      </div>
    </footer>
  );
}