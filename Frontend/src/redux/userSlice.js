import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: null, 
    },
    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload;
        },
        logout: (state) => {
            state.userData = null;
        }
    }
});

export const { setUserData, logout } = userSlice.actions;
export default userSlice.reducer;