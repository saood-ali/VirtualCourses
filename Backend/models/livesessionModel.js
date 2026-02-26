import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Live Interactive Class"
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    educator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);

export default LiveSession;