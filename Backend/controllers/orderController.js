import razorpay from 'razorpay';
import dotenv from 'dotenv';
import Course from '../models/courseModel.js';
import User from '../models/userModel.js';
import { clearCache } from "../config/redis.js";
dotenv.config();

const RazorPayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const RazorpayOrder = async (req,res)=>{
    try {
        const {courseId} = req.body;
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message:"Course is not found"})
        }
        const options={
            amount:course.price*100,
            currency:"INR",
            receipt:`${courseId}.toString()`
        }
        const order = await RazorPayInstance.orders.create(options);
        return res.status(200).json(order);
    } catch (error) {
        return res.status(500).json({message:`Failed to create Razorpay order ${error}`})
    }
}

export const verifyPayment = async(req,res)=>{
    try {
        const {courseId, userId, razorpay_order_id} = req.body;
        const orderInfo = await RazorPayInstance.orders.fetch(razorpay_order_id);
        
        if(orderInfo.status === "paid"){
            const user = await User.findById(userId);
            if(!user.enrolledCourses.includes(courseId)){
                user.enrolledCourses.push(courseId);
                await user.save();
            }

            const course = await Course.findById(courseId);
            if(!course.enrolledStudents.includes(userId)){
                course.enrolledStudents.push(userId);
                await course.save();
            }

            await clearCache(
                `user:profile:${userId}`,             // User's dashboard
                `stats:instructor:${course.creator}`, // Instructor's dashboard stats
                `course:${courseId}`                  // Course landing page stats
            );

            return res.status(200).json({message:"Payment verified and enrollment successful"})
        } else {
            return res.status(400).json({message:"Payment failed"})
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        return res.status(500).json({message:`Internal Server Error during payment verification ${error}`})
    }
}