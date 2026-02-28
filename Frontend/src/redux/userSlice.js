import { createSlice } from "@reduxjs/toolkit";

// Re-hydrate userData from localStorage on page refresh
const loadUserFromStorage = () => {
  try {
    const serialized = localStorage.getItem("userData");
    return serialized ? JSON.parse(serialized) : null;
  } catch {
    return null;
  }
};

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: loadUserFromStorage(),
    },
    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload;
            // Keep localStorage in sync
            if (action.payload) {
                try {
                    localStorage.setItem("userData", JSON.stringify(action.payload));
                } catch {
                    // Storage quota exceeded — fail silently
                }
            } else {
                localStorage.removeItem("userData");
            }
        },
        logout: (state) => {
            state.userData = null;
            localStorage.removeItem("userData");
            localStorage.removeItem("token");
        }
    }
});

export const { setUserData, logout } = userSlice.actions;
export default userSlice.reducer;