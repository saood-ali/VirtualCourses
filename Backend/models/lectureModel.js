import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
    lectureTitle: {
        type: String,
        required: true
    },
    videoUrl: {
        type: String,
       required: true 
    },
    transcript: { 
        type: String,
        default: "" // Store the lecture text/summary here
    },
    isPreviewFree: {
        type: Boolean,
        default: false
    }
}, { timestamps: true }); 

const Lecture = mongoose.model("Lecture", lectureSchema);
export default Lecture;