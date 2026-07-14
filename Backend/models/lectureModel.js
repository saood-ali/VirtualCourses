import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    lectureTitle: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      default: "",
    },
    transcript: {
      type: String,
      default: "", // Store the lecture text/summary here
    },
    isPreviewFree: {
      type: Boolean,
      default: false,
    },
    // AI ingestion metadata (Milestone 1 - Foundation Layer)
    // Lifecycle (Milestone 2A): UPLOADED -> TRANSCRIBING -> READY | FAILED
    processingStatus: {
      type: String,
      enum: ["UPLOADED", "TRANSCRIBING", "READY", "FAILED"],
      default: "UPLOADED",
    },
    chunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    aiPipelineVersion: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const Lecture = mongoose.model("Lecture", lectureSchema);
export default Lecture;
