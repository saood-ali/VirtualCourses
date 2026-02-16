import { useEffect, useState } from "react";
import axios from "axios";
import { serverUrl } from "../App.jsx";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/user/getcurrentuser?t=${new Date().getTime()}`,
          {
            withCredentials: true,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          }
        );

        if (result.data && typeof result.data === 'object') {
          dispatch(setUserData(result.data));
        } else {
          throw new Error("Invalid user data received");
        }
      } catch (error) {
        console.log("Auto-login failed:", error);
        localStorage.removeItem("token");
        dispatch(setUserData(null));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [dispatch]);

  return isLoading;
};

export default useGetCurrentUser;