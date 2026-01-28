import {uploadOnCloudinary} from "../config/cloudinary.js";
import User from "../models/userModel.js";
export const getCurrentUser = async(req,res)=>{
    try {
        const user = await User.findById(req.UserID).select("-password").populate("enrolledCourses");
        if(!user){
            return res.status(400).json({message:"User not found"})
        }
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({message:`getCurrentUser error ${error}`})
    }
}

export const updateProfile = async(req,res)=>{
    try {
        const userId = req.userID;
        const {name, description} = req.body;
        let photoUrl;
        if(req.file){
            photoUrl = await uploadOnCloudinary(req.file.path);
        }
        const user = await User.findByIdAndUpdate(userId, {name, description, photoUrl});
        if(!user){
            return res.status(400).json({message:"User not found"})
        }
        await user.save();
        return res.status(200).json(user)

    } catch (error) {
        return res.status(500).json({message:`UpdateProfile error ${error}`})   
    }
}