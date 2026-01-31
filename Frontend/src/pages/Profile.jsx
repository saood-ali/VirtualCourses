import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BsArrowReturnLeft } from "react-icons/bs";
import axios from "axios";
import { toast } from "react-toastify";
import { setUserData } from "../redux/userSlice";
import { serverUrl } from "../App";

function Profile() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logOut`, {
        withCredentials: true,
      });

      dispatch(setUserData(null));
      localStorage.removeItem("token");
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Logout Failed");
    }
  };

  // GUARD CLAUSE: Loading state
  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <h2 className="text-xl font-bold text-gray-600">Loading Profile...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-xl w-full relative">
        
        {/* Back Button */}
        <BsArrowReturnLeft
          className="absolute top-[8%] left-[5%] w-[22px] h-[22px] cursor-pointer hover:scale-110 transition"
          onClick={() => navigate("/")}
          title="Go Back"
        />

        {/* Profile Image & Name */}
        <div className="flex flex-col items-center text-center">
          {userData?.photoUrl ? (
            <img
              src={userData?.photoUrl}
              className="w-24 h-24 rounded-full object-cover border-4 border-[black]"
              alt="Profile"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full text-white flex items-center justify-center
      text-[30px] border-2 bg-black border-white"
            >
              {userData?.name?.slice(0, 1).toUpperCase()}
            </div>
          )}

          <h2 className="text-2xl font-bold mt-4 text-gray-800">
            {userData?.name}
          </h2>
          <p className="text-sm text-gray-500 capitalize">{userData?.role}</p>
        </div>

        {/* User Details */}
        <div className="mt-6 space-y-4">
          <div className="text-sm flex items-center justify-start gap-1">
            <span className="font-semibold text-gray-700">Email:</span>
            <span className="text-gray-600">{userData?.email}</span>
          </div>
          <div className="text-sm flex items-center justify-start gap-1">
            <span className="font-semibold text-gray-700">Bio:</span>
            <span className="text-gray-600">{userData?.description || "No bio available"}</span>
          </div>
          <div className="text-sm flex items-center justify-start gap-1">
            <span className="font-semibold text-gray-700">Enrolled Courses:</span>
            <span className="text-gray-600">{userData?.enrolledCourses?.length || 0}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            className="px-6 py-2 rounded bg-[black] text-white font-medium
          active:bg-[#333] hover:bg-[#222] cursor-pointer transition shadow-md hover:shadow-lg"
            onClick={() => navigate("/edit-profile")}
          >
            Edit Profile
          </button>
          
          <button
            className="px-6 py-2 rounded bg-red-600 text-white font-medium
          active:bg-red-700 hover:bg-red-500 cursor-pointer transition shadow-md hover:shadow-lg"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;