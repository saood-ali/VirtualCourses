import mongoose from "mongoose";
import ChatMessage from "../models/chatMessageModel.js";
import { canAccessCourse } from "../utils/courseAccess.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/* The single wire shape for a chat message. The socket handler emits this too,
   so a client can concatenate history and live messages without knowing which
   door a message came through. */
export const serializeMessage = (doc) => {
  const sender = doc.sender && doc.sender._id ? doc.sender : null;
  return {
    id: doc._id.toString(),
    room: doc.course.toString(),
    text: doc.text,
    senderId: sender ? sender._id.toString() : doc.sender?.toString() || null,
    senderName: sender?.name || "Deleted user",
    senderRole: sender?.role || "student",
    senderPhotoUrl: sender?.photoUrl || "",
    createdAt: new Date(doc.createdAt).toISOString(),
  };
};

/* GET /api/chat/:courseId/messages?before=<messageId>&limit=<n>

   Paginates backwards from newest. `before` is the id of the oldest message the
   client already holds; ObjectIds are monotonic, so `_id < before` reads as
   "older than that" and rides the {course, _id} index. Returns oldest-first so
   the client can append straight onto the top of its list. */
export const getCourseMessages = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { before } = req.query;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    const allowed = await canAccessCourse(courseId, req.userId);
    if (!allowed) {
      return res
        .status(403)
        .json({ message: "Enroll in this course to view the discussion." });
    }

    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(parsedLimit)
      ? DEFAULT_LIMIT
      : Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);

    const query = { course: courseId };
    if (before) {
      if (!mongoose.isValidObjectId(before)) {
        return res.status(400).json({ message: "Invalid cursor" });
      }
      query._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    /* One extra row is the cheapest way to know whether an older page exists
       without a second count query. */
    const docs = await ChatMessage.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("sender", "name role photoUrl")
      .lean();

    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, limit) : docs;

    return res.status(200).json({
      messages: page.reverse().map(serializeMessage),
      hasMore,
    });
  } catch (error) {
    console.error("getCourseMessages failed:", error);
    return res.status(500).json({ message: "Failed to load chat history" });
  }
};
