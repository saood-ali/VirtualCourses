import mongoose from "mongoose";

export const MAX_MESSAGE_LENGTH = 2000;

/* One document per course-discussion message. `sender` stays a plain ref and is
   populated on read, so a user renaming themselves or changing their avatar is
   reflected in the whole transcript instead of leaving stale copies behind. */
const chatMessageSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: MAX_MESSAGE_LENGTH,
    },
  },
  { timestamps: true }
);

/* History is always read as "newest first within one course", which is exactly
   this index — `_id` descending doubles as the pagination cursor. */
chatMessageSchema.index({ course: 1, _id: -1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
export default ChatMessage;
