import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import { getOrSetCache, clearCache } from "../config/redis.js";

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const splitUrl = url.split("/");
    const lastPart = splitUrl[splitUrl.length - 1];
    const publicId = lastPart.split(".")[0];
    return publicId;
  } catch (error) {
    console.error("Error extracting publicId", error);
    return null;
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.id;
    const user = await getOrSetCache(`user:profile:${userId}`, async () => {
         return await User.findById(userId)
           .select("-password")
           .populate("enrolledCourses");
    }, 3600);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `getCurrentUser error ${error}` });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { name, description } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    let photoUrl = user.photoUrl;

    if (req.file) {
      photoUrl = req.file.path;
      if (user.photoUrl) {
        const oldPublicId = "VirtualCourses/" + getPublicIdFromUrl(user.photoUrl);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId, (err, result) => {
            if (err) console.log("Cloudinary delete error:", err);
            else console.log("Old image deleted:", result);
          });
        }
      }
    }

    user.name = name || user.name;
    user.description = description || user.description;
    user.photoUrl = photoUrl;

    await user.save();

    const updatedUser = await User.findById(userId)
      .populate("enrolledCourses")
      .select("-password");

    await clearCache(
        `user:profile:${userId}`, 
        `creator:${userId}`
    );

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `UpdateProfile error ${error}` });
  }
};