import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const generateSignature = (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Cloudinary signature rules: DO NOT include file, cloud_name, resource_type,
    // or api_key in the signature — only include body params like folder, timestamp, etc.
    const params = {
      folder: "VirtualCourses",
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_NAME,
      folder: params.folder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not generate signature" });
  }
};