import { useEffect, useState } from "react";
import axiosClient from "../config/axiosClient.js";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axiosClient.get(
          `/api/user/getcurrentuser?t=${new Date().getTime()}`,
          {
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
        // Only force-logout on explicit 401 Unauthorized.
        // Network errors, 5xx, etc. should NOT wipe a valid cached session.
        if (error.response?.status === 401) {
          console.log("Session expired or invalid:", error);
          localStorage.removeItem("token");
          dispatch(setUserData(null));
        } else {
          console.log("Could not verify session (non-auth error):", error?.message);
          // Keep whatever is already in the store (re-hydrated from localStorage)
        }
      } finally {
        setTimeout(() => {
            setIsLoading(false);
        }, 0);
      }
    };

    fetchUser();
  }, [dispatch]);

  return isLoading;
};

export default useGetCurrentUser;