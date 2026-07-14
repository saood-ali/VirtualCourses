import mongoose from "mongoose";

const lectureChunkSchema = new mongoose.Schema(
  {
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    startTimestamp: {
      type: Number,
      default: 0,
      min: 0,
    },
    endTimestamp: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    tokenCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

// Standard MongoDB indexes (no Atlas Vector Search index in this milestone).
// Retrieve all chunks for a lecture in stored order.
lectureChunkSchema.index({ lectureId: 1, chunkIndex: 1 });
// Scope chunk queries by course.
lectureChunkSchema.index({ courseId: 1 });

const LectureChunk = mongoose.model("LectureChunk", lectureChunkSchema);
export default LectureChunk;
