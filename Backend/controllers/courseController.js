import { v2 as cloudinary } from "cloudinary";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import Lecture from "../models/lectureModel.js";
import Course from "../models/courseModel.js";
import User from "../models/userModel.js";
import Review from "../models/reviewModel.js";
import { getOrSetCache, clearCache } from "../config/redis.js";

const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    const regex = /\/v\d+\/(.+)\.[a-z]+$/;
    const match = url.match(regex);
    return match ? match[1] : null; 
};

export const createCourse = async(req,res)=>{
    try {
        const {title, category} = req.body;
        if(!title || !category){
            return res.status(400).json({message:"Title and Category are required"})
        }
        const course = await Course.create({
            title,
            category,
            creator: req.id
        })
        await clearCache(`courses:published`, `creator:courses:${req.id}`);
        return res.status(201).json(course)
    } catch (error) {
        return res.status(500).json({message:`Create course error ${error}`})
    }
}

export const getPublishedCourses = async(req,res)=>{
    try {
        // 🚀 CACHE: 1 Hour (3600s). Home page doesn't change every second.
        const courses = await getOrSetCache("courses:published", async () => {
             return await Course.find({isPublished:true}).populate("lectures reviews")
        }, 3600);

        if(!courses){
            return res.status(400).json({message:"No courses found"})
        }
        return res.status(200).json(courses)
    } catch (error) {
        return res.status(500).json({message:`Get published courses error ${error}`})
    }
}

export const getCreatorCourses = async(req,res)=>{
    try {
        const userId = req.userId;
        const courses = await Course.find({creator:userId}).sort({createdAt: -1});

        if(!courses){
            return res.status(400).json({message:"No courses found"})
        }
        return res.status(200).json(courses)
    } catch (error) {
        return res.status(500).json({message:`Get creator courses error ${error}`}) 
    }
}

export const editCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, subTitle, description, category, level, isPublished, price } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const isBeingPublished = isPublished === true || isPublished === 'true';
        if (isBeingPublished) {
            const finalTitle = title || course.title;
            const finalCategory = category || course.category;
            const finalLevel = level || course.level;
            const finalPrice = price !== undefined && price !== "" ? price : course.price;
            
            if (!finalTitle || !finalCategory || !finalLevel || finalPrice === undefined || finalPrice === null || finalPrice === "") {
                return res.status(400).json({ message: "Title, category, level, and price are required to publish the course." });
            }
        }

        const userId = (req.id || req.userId).toString();
        const creatorId = course.creator.toString();

       if (creatorId !== userId) {
        return res.status(403).json({ 
            message: `DEBUG ERROR: Owner=${creatorId} | You=${userId}` 
        });
    }

        let thumbnail = course.thumbnail || process.env.DEFAULT_COURSE_THUMBNAIL || "https://res.cloudinary.com/df5jasvzx/image/upload/default-thumbnail_uhf9kp.png";
        
        if (req.file) {
            if (course.thumbnail && course.thumbnail !== process.env.DEFAULT_COURSE_THUMBNAIL && !course.thumbnail.includes("default-thumbnail")) {
                const publicId = getPublicIdFromUrl(course.thumbnail);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }
            thumbnail = req.file.path;
        }

        const updateData = { title, subTitle, description, category, level, isPublished, price, thumbnail };
        const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, { new: true });

        await clearCache(
            `course:${courseId}`, 
            `courses:published`, 
            `creator:courses:${userId}`
        );
        return res.status(200).json({ message: "Course updated successfully", course: updatedCourse });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Failed to edit course" });
    }
};

export const getCourseById = async(req,res)=>{
    try {
        const {courseId} = req.params;
        // 🚀 CACHE: 24 Hours. Course descriptions rarely change.
        let course = await getOrSetCache(`course:${courseId}`, async () => {
             return await Course.findById(courseId);
        }, 86400);

        if(!course){
            return res.status(400).json({message:"Course not found"})
        }
        return res.status(200).json(course)
    } catch (error) {
        return res.status(500).json({message:`Get course by id error ${error}`})
    }
}

export const removeCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        await Course.findByIdAndDelete(courseId);
        await Review.deleteMany({ course: courseId });

        await clearCache(
            `course:${courseId}`, 
            `courses:published`, 
            `creator:courses:${req.id || req.userId}`,
            `reviews:all`
        );
        return res.status(200).json({ message: "Course deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: `Remove course error ${error}` });
    }
};

//For Lecture
export const createLecture = async(req,res)=>{
    try {
        const {lectureTitle} = req.body;
        const {courseId} = req.params;
        if(!lectureTitle || !courseId){
            return res.status(400).json({message:"Lecture title and course id are required"})
        }
        const lecture = await Lecture.create({lectureTitle});
        const course = await Course.findById(courseId);
        if(course){
            course.lectures.push(lecture._id)
        }
        await course.populate("lectures");
        await course.save();
        await clearCache(`course:curriculum:${courseId}`);
        return res.status(201).json({lecture,course});

    } catch (error) {
        return res.status(500).json({message: `Failed to create lecture ${error}`})
    }
}

export const getCourseLecture = async (req,res) => {
    try {
        const {courseId} = req.params;

        // 🚀 CACHE: 24 Hours. This is a heavy query (populate), huge win for Redis.
        const course = await getOrSetCache(`course:curriculum:${courseId}`, async () => {
            const c = await Course.findById(courseId);
            if(!c) return null;
            await c.populate("lectures");
            return c;
        }, 86400);

        if(!course){
            return res.status(404).json({message:`Course is not found`})
        }
        return res.status(200).json(course)
    } catch (error) {
        return res.status(500).json({message: `Failed to getCourseLecture ${error}`}) 
    }
}

export const editLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const { isPreviewFree, lectureTitle, videoUrl } = req.body; 

        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture is not found" });
        }
        if (videoUrl) {
            lecture.videoUrl = videoUrl;
        }
        if (lectureTitle) {
            lecture.lectureTitle = lectureTitle;
        }
        if (typeof isPreviewFree !== 'undefined') {
            lecture.isPreviewFree = isPreviewFree;
        }

        await lecture.save();
        await clearCache(`lecture:${lectureId}`);
        return res.status(200).json(lecture);

    } catch (error) {
        return res.status(500).json({ message: `Failed to Edit Lecture ${error}` });
    }
};

export const removeLecture = async (req,res) => {
    try {
        const {lectureId} = req.params;
        const lecture = await Lecture.findByIdAndDelete(lectureId);
        if(!lecture){
            return res.status(404).json({message:`Lecture is not found`})
        }
        await Course.updateOne(
            {lectures:lectureId},
            {$pull:{lectures:lectureId}}
        )
        await clearCache(`lecture:${lectureId}`);
        return res.status(200).json({message:"Lecture Removed"})
    } catch (error) {
        return res.status(500).json({message:`Failed to remove lecture ${error}`})
    }
}

export const getLectureById = async (req, res) => {
    try {
        const { lectureId } = req.params;

        // 🚀 CACHE: 24 Hours. Video URLs don't change often.
        const lecture = await getOrSetCache(`lecture:${lectureId}`, async () => {
             return await Lecture.findById(lectureId);
        }, 86400);

        if (!lecture) {
            return res.status(404).json({ success: false, message: "Lecture not found" });
        }

        return res.status(200).json({
            success: true,
            lectureTitle: lecture.lectureTitle,
            videoUrl: lecture.videoUrl,
            isPreviewFree: lecture.isPreviewFree,
            _id: lecture._id
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: `Failed to get lecture by id: ${error.message}`
        });
    }
};

//Get Creator
export const getCreatorById = async (req, res) => {
  try {
    const userId = req.body?.userId || req.query?.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // 🚀 CACHE: 24 Hours. Creator profiles (name/photo) change rarely.
    const user = await getOrSetCache(`creator:${userId}`, async () => {
         return await User.findById(userId).select("-password");
    }, 86400);

    if (!user) {
      return res.status(404).json({ message: "User is not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("getCreatorById error:", error);
    return res.status(500).json({ message: `Failed to get creator ${error}` });
  }
};
