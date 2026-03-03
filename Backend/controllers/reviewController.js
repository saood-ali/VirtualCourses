import Course from "../models/courseModel.js";
import Review from "../models/reviewModel.js";
import {clearCache,getOrSetCache} from "../config/redis.js";

export const createReview = async(req,res) =>{
    try {
        const {rating, comment, courseId} = req.body;
        const userId = req.userId;

        const course = await Course.findById(courseId);
        if(!course){
            return res.status(400).json({message:"Course is not found"});
        }
        const alreadyReviewed = await Review.findOne({course:courseId, user:userId});
        if(alreadyReviewed){
            return res.status(400).json({message:"You have already reviewed this course"})
        }
        const review = new Review({
            course:courseId,
            user:userId,
            rating,
            comment
        })
        await review.save();
        await course.reviews.push(review._id);
        await course.save();
        await clearCache(
            `course:${courseId}`,                 // 1. Clear Course Details (to show new review there)
            `courses:published`,                  // 2. Clear Home Page (to update Star Rating on card)
            `creator:courses:${course.creator}`,  // 3. Clear educator Dashboard (to update their stats)
            `reviews:all`                         // 4. Clear the global reviews list
        );
        return res.status(201).json(review)
    } catch (error) {
        return res.status(500).json({message:`Failed to create review ${error}`})
    }
}

export const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate("user")
            .populate("course", "title")
            .sort({ createdAt: -1 });

        return res.status(200).json(reviews);

    } catch (error) {
        return res.status(500).json({ message: `Failed to get review ${error}` });
    }
};