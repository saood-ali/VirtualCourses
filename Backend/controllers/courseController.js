import { freeze } from "@reduxjs/toolkit";
import Lecture from "../models/lectureModel";
import Course from "../models/courseModel";

export const createCourse = async(req,res)=>{
    try {
        const {title, category} = req.body;
        if(!title || !category){
            return res.status(400).json({message:"Title and Category are required"})
        }
        const course = await Course.create({
            title,
            category,
            creator: req.userId
        })
        return res.status(201).json(course)
    } catch (error) {
        return res.status(500).json({message:`Create course error ${error}`})
    }
}

export const getPublishedCourses = async(req,res)=>{
    try {
        const courses = await Course.find({isPublished:true})
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
        const courses = await Course.find({creator:userId});
        if(!courses){
            return res.status(400).json({message:"No courses found"})
        }
        return res.status(200).json(courses)
    } catch (error) {
        return res.status(500).json({message:`Get creator courses error ${error}`}) 
    }
}

export const editCourse = async(req,res)=>{
    try {
        const {courseId} = req.params;
        const {title, subTitle, description, category, level, isPublished, price} = req.body;
        let thumbnail;
        if(req.file){
            thumbnail = await uploadOnCloudinary(req.file.path)
        }
        let course = await Course.findById(courseId);
        if(!course){
            return res.status(400).json({message:"Course not found"})
        }
        const updateData = {title, subTitle, description, category, level, isPublished, price, thumbnail}
        course = await Course.findByIdAndUpdate(courseId, updateData, {new:true})
        return res.status(200).json(course)
    } catch (error) {
        return res.status(500).json({message:`Edit course error ${error}`})
    }
}

export const getCourseById = async(req,res)=>{
    try {
        const {courseId} = req.params;
        let course = await Course.findById(courseId)
        if(!course){
            return res.status(400).json({message:"Course not found"})
        }
        return res.status(200).json(course)
    } catch (error) {
        return res.status(500).json({message:`Get course by id error ${error}`})
    }
}

export const removeCourse = async(req,res)=>{
    try {
        const {courseId} = req.params;
        let course = await Course.findById(courseId)
        if(!course){
            return res.status(400).json({message:"Course not found"})
        }
        course = await findByIdAndDelete(courseId, {new:true})
        return res.status(200).json({message:"Course deleted successfully"})
    } catch (error) {
        return res.status(500).json({message:`Remove course error ${error}`})
    }
}

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
        return res.status(201).json({lecture,course});

    } catch (error) {
        return res.status(500).json({message: `Failed to create lecture ${error}`})
    }
}

export const getCourseLecture = async (req,res) => {
    try {
        const {courseId} = req.params;
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message:`Course is not found`})
        }
        await course.populate("lectures");
        await course.save();
        return res.status(200).json(course)
    } catch (error) {
        return res.status(500).json({message: `Failed to getCourseLecture ${error}`}) 
    }
}

export const editLecture = async (req,res) => {
    try {
        const {lectureId} = req.params;
        const {isPreviewFree, lectureTitle} = req.body;
        const lecture = await Lecture.findById(lectureId);
        if(!lecture){
            return res.status(404).json({message:`Lecture is not found`})
        }
        let videoUrl
        if(req.file){
            videoUrl = await uploadOnCloudinary(req.file.path);
            lecture.videoUrl = videoUrl
        }
        if(lectureTitle){
            lecture.lectureTitle = lectureTitle
        }
        lecture.isPreviewFree = isPreviewFree;
        await lecture.save();
        return res.status(200).json(lecture)
    } catch (error) {
        return res.status(500).json({message: `Failed to Edit Lecture ${error}`})
    }
}

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
        return res.status(200).json({message:"Lecture Removed"})
    } catch (error) {
        return res.status(500).json({message:`Failed to remove lecture ${error}`})
    }
}