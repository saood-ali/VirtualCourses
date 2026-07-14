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
    //lifecycle:
    //   UPLOADED -> TRANSCRIBING -> CHUNKING -> EMBEDDING -> READY | FAILED
    // Milestone 2A only uses: UPLOADED, TRANSCRIBING, READY, FAILED.
    // CHUNKING and EMBEDDING are reserved for later milestones (no future schema change needed).
    processingStatus: {
      type: String,
      enum: ["UPLOADED", "TRANSCRIBING", "CHUNKING", "EMBEDDING", "READY", "FAILED"],
      default: "UPLOADED",
    },
    chunkCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    aiPipelineVersion: {
      type: String,
      default: "v1",
    },
  },
  { timestamps: true },
);

const Lecture = mongoose.model("Lecture", lectureSchema);
export default Lecture;
