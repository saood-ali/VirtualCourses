
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BsArrowReturnLeft } from "react-icons/bs";

function Profile() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();

  //  GUARD CLAUSE: If no user data, show loading instead of crashing
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
        <BsArrowReturnLeft
          className="absolute top-[8%] left-[5%] w-[22px] h-[22px] cursor-pointer"
          onClick={() => navigate("/")}
        />
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
              {/* Added safe check ?. to prevent crash */}
              {userData?.name?.slice(0, 1).toUpperCase()}
            </div>
          )}

          <h2 className="text-2xl font-bold mt-4 text-gray-800">
            {userData?.name}
          </h2>
          <p className="text-sm text-gray-500">{userData?.role}</p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="text-sm flex items-center justify-start gap-1">
            <span className="font-semibold text-gray-700">Email:</span>
            <span>{userData?.email}</span>
          </div>
          <div className="text-sm flex items-center justify-start gap-1">
            <span className="font-semibold text-gray-700">Bio:</span>
            <span>{userData?.description || "No bio available"}</span>
          </div>
          <div className="text-sm flex items-center justify-start gap-1">
            <span className="font-semibold text-gray-700">Enrolled Courses:</span>
            {/* Added safe check ?. and fallback || 0 */}
            <span>{userData?.enrolledCourses?.length || 0}</span>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <button
            className="px-5 py-2 rounded bg-[black] text-white 
          active:bg-[#4b4b4b] cursor-pointer transition"
            onClick={() => navigate("/edit-profile")}
          >
            Edit Profile
          </button>
          {/* Note: Logic for logout should be added here if needed */}
          <button>Logout</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;