import {useEffect, useState} from "react";
import { useRef } from "react";
import { BsArrowReturnLeft } from "react-icons/bs";
import { useNavigate, useParams } from "react-router-dom";
import img from "../../assets/empty_folder.png";
import { FaEdit } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../../App.jsx";
import { toast } from "react-toastify";
import { ClipLoader } from "react-spinners";
import { useDispatch, useSelector } from "react-redux";
import { setCourseData } from "../../redux/courseSlice.js";
import { FlickeringGrid } from "../../components/FlickeringGrid.jsx"; 

function EditCourse() {
  const navigate = useNavigate();
  const {courseId} = useParams();
  const thumb = useRef();
  const [isPublished,setIsPublished] = useState(false);
  const [selectCourse,setSelectCourse] = useState(null);
  const [title,setTitle] = useState("");
  const [subTitle,setSubTitle] = useState("");
  const [description,setDescription] = useState("");
  const [category,setCategory] = useState("");
  const [level,setLevel] = useState("");
  const [price,setPrice] = useState("");
  const [frontendImage, setFrontendImage] = useState(img);
  const [backendImage, setBackendImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const dispatch = useDispatch();
  const {courseData} = useSelector(state=>state.course);

  const handleThumbnail = (e)=>{
    const file = e.target.files[0];
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  }

  useEffect(() => {
  const fetchCourseData = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/course/getcourse/${courseId}`, {
        withCredentials: true
      });
      
      const courseData = result.data;
      setSelectCourse(courseData);

      if (courseData) {
        setTitle(courseData.title || "");
        setSubTitle(courseData.subTitle || "");
        setDescription(courseData.description || "");
        setCategory(courseData.category || "");
        setLevel(courseData.level || "");
        setPrice(courseData.price || "");
        setFrontendImage(courseData.thumbnail || img);
        setIsPublished(courseData.isPublished);
      }
    } catch (error) {
      console.log(error);
    }
  };

  fetchCourseData();
  
}, [courseId]);

 const handleEditCourse = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("subTitle", subTitle);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("level", level);
    formData.append("price", price);
    formData.append("isPublished", isPublished);

    if (backendImage) {
      formData.append("courseImage", backendImage);
    }

    try {
      const result = await axios.post(
        `${serverUrl}/api/course/editcourse/${courseId}`,
        formData,
        { withCredentials: true }
      );

      const updateData = result.data;
      const currentCourses = courseData || []; 

      if(updateData.isPublished){
        const updateCourses = currentCourses.map(c => c._id === courseId ? updateData : c);
        
        if(!currentCourses.some(c => c._id === courseId)) {
          updateCourses.push(updateData);
        }
        dispatch(setCourseData(updateCourses));
      }
      else {
        const filterCourses = currentCourses.filter(c => c._id !== courseId);
        dispatch(setCourseData(filterCourses)); 
      }

      setLoading(false);
      navigate("/courses");
      toast.success(result.data.message || "Course Updated");

    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error(error.response?.data?.message || "Failed to update course");
    }
  };
  
  const handleRemoveCourse = async () => {
    setLoading1(true);
    try {
      const result = await axios.delete(`${serverUrl}/api/course/remove/${courseId}`,{withCredentials:true});
      console.log(result.data);
      const filterCourses = courseData.filter(c=>c._id!==courseId);
      dispatch(setCourseData(filterCourses));
      setLoading1(false);
      navigate("/courses")
      toast.success("Course Removed")
      
    } catch (error) {
      console.log(error)
      setLoading1(false);
      toast.error(error.response.data.message)
    }
  }

  return (
    <div className="min-h-screen relative w-full overflow-hidden bg-gray-50 flex justify-center py-10 px-4">
      
      {/*  FLICKERING GRID */}
      <div className="absolute inset-0 z-0">
        <FlickeringGrid
          className="w-full h-full" 
          squareSize={4}
          gridGap={6}
          color="#2E2E2E"    
          maxOpacity={0.15}   
          flickerChance={0.7}
        />
      </div>

      {/*  Main Content Card */}
      <div className="max-w-5xl w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6 relative z-10">
        
        {/* Top Bar */}
        <div className="flex items-center justify-center gap-[20px] 
        md:justify-between flex-col md:flex-row mb-6 relative">
          <BsArrowReturnLeft
            className="top-[-20%] md:top-[20%]
            absolute left-0 md:left-[2%] w-[22px] h-[22px] cursor-pointer hover:scale-110 transition-transform"
            onClick={() => navigate("/courses")}
          />

          <h2 className="text-2xl font-semibold md:pl-[60px]">
            Add detail information regarding the course
          </h2>
          <div className="space-x-2 space-y-2">
            <button className="bg-black text-white px-4 py-2 rounded-md cursor-pointer hover:bg-gray-800 transition-colors" onClick={()=>navigate(`/createlecture/${selectCourse?._id}`)}>
              Go to lecture page
            </button>
          </div>
        </div>

        {/* Form Details */}
        <div className="bg-gray-50 p-6 rounded-md border border-gray-100">
          <h2 className="text-lg font-medium mb-4">Basic Course information</h2>
          <div className="space-x-2 space-y-2">
            {!isPublished? <button className="bg-green-100 text-green-600 px-4 py-2 
            rounded-md border hover:bg-green-200 transition-colors cursor-pointer" onClick={()=>setIsPublished(prev=>!prev)}>
            Click to Publish
            </button> : <button className="bg-red-100 text-red-600 px-4 py-2 
            rounded-md border hover:bg-red-200 transition-colors cursor-pointer" onClick={()=>setIsPublished(prev=>!prev)}>
            Click to UnPublish
            </button> }
            <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors cursor-pointer" disabled={loading1}
          onClick={handleRemoveCourse}>{loading1? <ClipLoader color="white" size={20}/>: "Remove Course"}</button>
          </div>

          <form className="space-y-6 mt-6" onSubmit={(e)=>e.preventDefault()}>
           <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input id="title" type="text" className="w-full border 
            px-4 py-2 rounded-md focus:ring-2 focus:ring-black focus:outline-none" placeholder="CourseTitle" onChange={(e)=>setTitle(e.target.value)} value={title}/>
           </div>
           <div>
            <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input id="subtitle" type="text" className="w-full border 
            px-4 py-2 rounded-md focus:ring-2 focus:ring-black focus:outline-none" placeholder="CourseSubtitle" onChange={(e)=>setSubTitle(e.target.value)} value={subTitle}/> 
           </div>
           <div>
            <label htmlFor="des" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="des" type="text" className="w-full border 
            px-4 py-2 rounded-md h-24 resize-none focus:ring-2 focus:ring-black focus:outline-none" placeholder="Course Description" 
            onChange={(e)=>setDescription(e.target.value)} value={description}></textarea>
           </div>
           <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            {/* For Category */}
            <div className="flex-1"> 
            <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Course Category</label>
            <select name="" id="" className="w-full border px-4 py-2 rounded-md bg-white focus:ring-2 focus:ring-black focus:outline-none" 
            onChange={(e)=>setCategory(e.target.value)} value={category}>
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
            {/* For Level */}
            <div className="flex-1"> 
            <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">Course Level</label>
            <select name="" id="" className="w-full border px-4 py-2 rounded-md bg-white focus:ring-2 focus:ring-black focus:outline-none" 
            onChange={(e)=>setLevel(e.target.value)} value={level}>
                <option value="">Select Level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
            </select>
            </div>
            {/* For Price */}
             <div className="flex-1"> 
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Course Price (INR)</label>
            <input type="number" name="" id="price"
              className="w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-black focus:outline-none" placeholder="₹" 
              onChange={(e)=>setPrice(e.target.value)} value={price}
            />
            </div>
           </div>
           <div>
              <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">
              Course Thumbnail</label>
              <input type="file" hidden ref={thumb} accept="image/*" onChange={handleThumbnail}/>
            </div> 
           <div className="relative w-[300px] h-[170px] group">
             <img src={frontendImage} alt="" className="w-full h-full border border-black rounded-[5px] object-cover" 
             onClick={()=>thumb.current.click()}/>
             <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors rounded-[5px] pointer-events-none"></div>
             <FaEdit className="w-[20px] h-[20px] absolute top-2 right-2 cursor-pointer text-white drop-shadow-md hover:scale-110 transition-transform" onClick={()=>thumb.current.click()}/>
            </div>
           <div className="flex items-center justify-start gap-[15px] pt-4">
            <button className="bg-[#e9e8e8] hover:bg-red-200 text-black border
              border-black cursor-pointer px-4 py-2 rounded-md transition-colors" onClick={()=>navigate("/courses")}>Cancel</button>
            <button className="bg-black text-white px-7 py-2 rounded-md hover:bg-gray-800 
            cursor-pointer transition-colors" disabled={loading} onClick={handleEditCourse}>{loading? <ClipLoader size={30} color="white"/> : "Save"}
            </button>
           </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditCourse;