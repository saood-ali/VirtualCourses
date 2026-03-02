import { useState } from "react";
import { BsArrowReturnLeft } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../config/axiosClient.js";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { DotPattern } from "../../components/DotPattern.jsx";
import { useDispatch, useSelector } from "react-redux";
import { setCreatorCourseData } from "../../redux/courseSlice.js";

function CreateCourses() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { creatorCourseData } = useSelector((state) => state.course);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateCourse = async () => {
    setLoading(true);
    try {
      const result = await axiosClient.post(`/api/course/create`,
        { title, category });
      const newCourse = result.data?.course ?? result.data;
      // Immediately update the Redux store so Courses.jsx shows the new course
      const existing = Array.isArray(creatorCourseData) ? creatorCourseData : [];
      dispatch(setCreatorCourseData([...existing, newCourse]));
      toast.success("Course Created");
      navigate("/courses");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message ?? "Failed to create course");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10 relative overflow-hidden">
      
      {/* THE FIX */}
      <DotPattern 
        className="absolute inset-0 z-0 text-gray-400 opacity-50" 
        width={16} 
        height={16} 
        cx={1} 
        cy={1} 
        cr={1} 
      />

      {/* The Card:*/}
      <div
        className="max-w-xl w-[600px] mx-auto p-6 bg-white 
     shadow-xl rounded-md mt-10 relative z-10"
      >
        <BsArrowReturnLeft
          className="top-[8%] left-[5%] absolute w-[22px] h-[22px] cursor-pointer hover:scale-110 transition-transform"
          onClick={() => navigate("/courses")}
        />
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Create Course
        </h2>
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label
              htmlFor="title"
              className="block text-sm 
          font-medium text-gray-700 mb-1"
            >
              Course Title
            </label>
            <input
              type="text"
              id="title"
              placeholder="Enter Course Title"
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none
            focus:ring-2 focus:ring-[black]" onChange={(e) => setTitle(e.target.value)} value={title}
            />
          </div>
          <div>
            <label
              htmlFor="cat"
              className="block text-sm 
          font-medium text-gray-700 mb-1"
            >
              Course Category
            </label>
            <select
              name=""
              id=""
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none
          focus:ring-2 focus:ring-[black]" onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select Category</option>
              <option value="App Development">App Development</option>
              <option value="AI/ML">AI/ML</option>
              <option value="AI Tools">AI Tools</option>
              <option value="Data Science">Data Science</option>
              <option value="Data Analytics">Data Analytics</option>
              <option value="Ethical Hacking">Ethical Hacking</option>
              <option value="UI UX Designing">UI UX Designing</option>
              <option value="Web Development">Web Development</option>
              <option value="others">Others</option>
            </select>
          </div>
          <button className="w-full bg-[black] text-white py-2 px-4 
          rounded-md active:bg-[#3a3a3a] transition shadow-md hover:shadow-lg" disabled={loading} onClick={handleCreateCourse}>
            {loading ? <ClipLoader size={30} color="white" /> : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateCourses;