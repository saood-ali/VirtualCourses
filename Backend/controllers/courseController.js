import { freeze } from "@reduxjs/toolkit";

export const createCourse = async(req,res)=>{
    try {
        const {title, category} = req.body;
        if(!title || !category){
            return res.status(400).json({message:"Title and Category are required"})
        }
        const course = await Course.create({
            title,
            description,
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