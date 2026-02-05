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
  const [name, setName] = useState(initialData.name || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEditProfile = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (photoUrl) {
        formData.append("photoUrl", photoUrl);
      }

      const config = {
        withCredentials: true,
      };

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
    // 1. MAIN WRAPPER: Changed bg-black to bg-white
    <div className='relative min-h-screen flex items-center justify-center bg-white overflow-hidden px-4 py-10'>

      {/* 2. CARD CONTAINER: Light Glass Style (bg-white/80, text-gray-800) */}
      <div className='relative z-10 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl max-w-xl w-full text-gray-800 overflow-hidden'>
        
        {/* 3. BACKGROUND ANIMATION: Adjusted color to show on white */}
        <div className="absolute inset-0 z-0">
          <Iridescence 
            color={[0.9, 0.94, 1]} // Very light blue tint (visible on white)
            mouseReact={false} 
            amplitude={0.1} 
            speed={1.0} 
          />
        </div>

        {/* 4. CONTENT LAYER */}
        <div className="relative z-10 p-8">
            
            <BsArrowReturnLeft 
              className="absolute top-[5%] left-[5%] w-[22px] h-[22px] cursor-pointer text-gray-400 hover:text-gray-800 transition" 
              onClick={() => navigate("/profile")} 
            />
            
            <h2 className='text-2xl font-bold text-center mb-6 text-gray-800'>Edit Profile</h2>
            
            <form className='space-y-5' onSubmit={(e) => e.preventDefault()}>
              
              <div className='flex flex-col items-center text-center'>
                {initialData.photoUrl ? (
                  <img
                    src={initialData.photoUrl}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    alt="profile"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full text-white flex items-center justify-center text-[30px] border-2 bg-blue-600 border-white shadow-lg">
                    {initialData.name?.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="image" className='text-sm font-medium text-gray-600'>Select Avatar</label>
                <input 
                    id='image' 
                    type='file' 
                    accept='image/*'
                    // Updated Input Styles for Light Mode
                    className='w-full px-4 py-2 mt-1 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500' 
                    onChange={(e) => setPhotoUrl(e.target.files[0])} 
                />
              </div>

              <div>
                <label htmlFor="name" className='text-sm font-medium text-gray-600'>UserName</label>
                <input 
                    id='name' 
                    type='text'
                    className='w-full px-4 py-2 mt-1 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500' 
                    onChange={(e) => setName(e.target.value)} 
                    value={name} 
                />
              </div>

              <div>
                <label className='text-sm font-medium text-gray-600'>Email</label>
                <input 
                    readOnly 
                    type='text' 
                    value={initialData.email}
                    className='w-full px-4 py-2 mt-1 border border-gray-200 rounded-md text-sm bg-gray-100 text-gray-500 cursor-not-allowed' 
                />
              </div>

              <div>
                <label className='text-sm font-medium text-gray-600'>Bio</label>
                <textarea 
                    placeholder="Tell us about yourself" 
                    rows={3}
                    className='w-full mt-1 px-4 py-2 border border-gray-300 rounded-md resize-none bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500' 
                    onChange={(e) => setDescription(e.target.value)} 
                    value={description} 
                />
              </div>

              <button 
                className='w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-md font-semibold transition cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed' 
                disabled={loading} 
                onClick={handleEditProfile}
              >
                {loading ? <ClipLoader size={20} color="white" /> : "Save Changes"}
              </button>

            </form>
        </div>
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