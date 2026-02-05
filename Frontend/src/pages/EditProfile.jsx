import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsArrowReturnLeft } from 'react-icons/bs';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App.jsx';
import { setUserData } from '../redux/userSlice.js';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import Iridescence from '../components/Iridescence.jsx';

const EditProfileForm = ({ initialData }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Form State
  const [name, setName] = useState(initialData.name || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [preview, setPreview] = useState(initialData.photoUrl || "");
  const [loading, setLoading] = useState(false);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoUrl(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (photoUrl) {
        formData.append("photoUrl", photoUrl);
      }

      const config = { withCredentials: true };

      const result = await axios.post(
        `${serverUrl}/api/user/profile`,
        formData,
        config
      );

      dispatch(setUserData(result.data));
      setLoading(false);
      navigate("/profile");
      toast.success("Profile Updated Successfully");
    } catch (error) {
      setLoading(false);
      console.log(error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    // 1. MAIN CONTAINER: Exact match to Profile (White BG)
    <div className="relative min-h-screen px-4 py-10 flex items-center justify-center bg-white overflow-hidden">

      {/* 2. BACKGROUND ANIMATION: Exact match to Profile (Light Colors) */}
      <div className="absolute inset-0 z-0">
        <Iridescence 
          color={[0.9, 0.94, 1]} 
          mouseReact={false} 
          amplitude={0.1} 
          speed={1.0} 
        />
      </div>

      {/* 3. CARD CONTAINER: Exact match (Glassmorphism, Shadow, Border) */}
      <div className="relative z-10 bg-white/80 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-8 max-w-xl w-full text-gray-800">
        
        {/* Back Arrow */}
        <BsArrowReturnLeft
          className="absolute top-[8%] left-[5%] w-[22px] h-[22px] cursor-pointer hover:scale-110 transition text-gray-400 hover:text-gray-900"
          onClick={() => navigate("/profile")}
          title="Go Back"
        />

        <form onSubmit={handleEditProfile}>
          
          {/* Avatar Display Section */}
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24">
              {preview ? (
                <img
                  src={preview}
                  className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                  alt="Profile Preview"
                />
              ) : (
                <div className="w-full h-full rounded-full text-white flex items-center justify-center text-[30px] border-2 bg-blue-600 border-white shadow-lg">
                  {initialData.name?.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold mt-4 text-gray-900">Edit Profile</h2>
          </div>

          {/* Form Fields Section */}
          <div className="mt-6 space-y-4">

            {/* RESTORED: Explicit Image Upload Field */}
            <div className="flex flex-col gap-1">
               <label htmlFor="image-upload" className="text-sm font-semibold text-gray-600 mb-1">Change Avatar</label>
               <input 
                 id="image-upload" 
                 type="file" 
                 accept="image/*" 
                 onChange={handleFileChange}
                 // Styled to match the other inputs in this layout
                 className="w-full text-sm text-gray-600 border border-gray-300 rounded-lg cursor-pointer bg-white/50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
               />
            </div>
            
            {/* Username */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600">Username</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white/50"
              />
            </div>

            {/* Email (Read Only) */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600">Email</label>
              <input 
                type="text" 
                value={initialData.email} 
                readOnly
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-600">Bio</label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white/50 resize-none"
              />
            </div>

          </div>

          {/* Action Button - Centered like Profile buttons */}
          <div className="mt-8 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 cursor-pointer transition shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <ClipLoader size={20} color="white" /> : "Save Changes"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

function EditProfile() {
  const { userData } = useSelector(state => state.user);

  if (!userData) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-white'>
         <ClipLoader size={50} color="black"/>
      </div>
    );
  }

  return <EditProfileForm initialData={userData} key={userData._id || 'edit-form'} />;
}

export default EditProfile;