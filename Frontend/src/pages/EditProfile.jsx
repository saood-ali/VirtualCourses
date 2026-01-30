import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BsArrowReturnLeft } from 'react-icons/bs';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App.jsx';
import { setUserData } from '../redux/userSlice';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';


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

    const token = localStorage.getItem("token"); 
    const result = await axios.post(
      `${serverUrl}/api/user/profile`, 
      formData, 
      { 
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
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
    <div className='min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10'>
      <div className='bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full relative'>
        <BsArrowReturnLeft className="absolute top-[5%] left-[5%] w-[22px] h-[22px] cursor-pointer" onClick={() => navigate("/profile")} />
        <h2 className='text-2xl font-bold text-center text-gray-800 mb-6'>Edit Profile</h2>
        <form className='space-y-5' onSubmit={(e) => e.preventDefault()}>
          <div className='flex flex-col items-center text-center'>
            {initialData.photoUrl ? (
              <img
                src={initialData.photoUrl}
                className="w-24 h-24 rounded-full object-cover border-4 border-[black]"
                alt="profile"
              />
            ) : (
              <div className="w-24 h-24 rounded-full text-white flex items-center justify-center text-[30px] border-2 bg-black border-white">
                {initialData.name?.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="image" className='text-sm font-medium text-gray-700'>Select Avatar</label>
            <input id='image' type='file' accept='image/*'
              className='w-full px-4 py-2 border rounded-md text-sm' onChange={(e) => setPhotoUrl(e.target.files[0])} />
          </div>
          <div>
            <label htmlFor="name" className='text-sm font-medium text-gray-700'>UserName</label>
            <input id='name' type='text'
              className='w-full px-4 py-2 border rounded-md text-sm' onChange={(e) => setName(e.target.value)} value={name} />
          </div>
          <div>
            <label className='text-sm font-medium text-gray-700'>Email</label>
            <input readOnly type='text' value={initialData.email}
              className='w-full px-4 py-2 border rounded-md text-sm bg-gray-50 cursor-not-allowed' />
          </div>
          <div>
            <label className='text-sm font-medium text-gray-700'>Bio</label>
            <textarea placeholder="Tell us about yourself" rows={3}
              className='w-full mt-1 px-4 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-[black]' 
              onChange={(e) => setDescription(e.target.value)} value={description} />
          </div>
          <button className='w-full bg-[black] active:bg-[#454545] text-white py-2 rounded-md font-medium transition cursor-pointer' 
              disabled={loading} onClick={handleEditProfile}>
            {loading ? <ClipLoader size={20} color="white" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

function EditProfile() {
  const { userData } = useSelector(state => state.user);

  if (!userData) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
         <ClipLoader size={50} color="black"/>
      </div>
    );
  }

  return <EditProfileForm initialData={userData} key={userData._id || 'edit-form'} />;
}

export default EditProfile;