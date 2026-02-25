import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    youtubeId: {
      type: String,
      required: true, 
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    isLive: {
      type: Boolean,
      default: true, 
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true } 
);

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);

export default LiveSession;