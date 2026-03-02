import axios from "axios";
const serverUrl = import.meta.env.VITE_SERVER_URL;

const axiosClient = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;
