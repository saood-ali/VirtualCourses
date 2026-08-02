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
    //   UPLOADED -> TRANSCRIBING -> CHUNKING -> EMBEDDING -> INDEXING -> READY | FAILED
    // `INDEXING` is the brief Atlas-vector-index-readiness probe that runs after
    // embeddings are written; READY now provably means "vector search works".
    // Old milestones used only UPLOADED/TRANSCRIBING/READY/FAILED; CHUNKING and
    // EMBEDDING were reserved and are now used.
    processingStatus: {
      type: String,
      enum: ["UPLOADED", "TRANSCRIBING", "CHUNKING", "EMBEDDING", "INDEXING", "READY", "FAILED"],
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
