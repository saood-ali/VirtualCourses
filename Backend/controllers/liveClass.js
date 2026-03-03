import LiveSession from "../models/livesessionModel.js"; 
import User from "../models/userModel.js";

export const getLiveSessionDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const liveSession = await LiveSession.findOne({ 
      courseId, 
      isLive: true 
    }).populate("educator").sort({ createdAt: -1 });

    if (!liveSession) {
      return res.status(404).json({ message: "No live class happening right now." });
    }

    const user = await User.findById(req.userId);

    res.status(200).json({ 
      success: true,
      roomID: courseId, 
      title: liveSession.title,
      educatorName: liveSession.educator ? liveSession.educator.name : "Educator",
      user: user ? {
        name: user.name,
        _id: user._id,
        role: user.role 
      } : { _id: req.userId }
    });

  } catch (error) {
    console.error("Live Session Error:", error);
    res.status(500).json({ error: error.message });
  }
};


export const startLiveSession = async (req, res) => {
  try {
    const { courseId, title, isLive } = req.body;
    
    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required." });
    }

    const session = await LiveSession.findOneAndUpdate(
      { courseId },
      { 
        $set: { 
          title: title || "Live Interactive Class",
          isLive: isLive,
          educator: req.userId 
        } 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, session });

  } catch (error) {
    console.error("Failed to update session:", error);
    res.status(500).json({ message: "Failed to update live session status" });
  }
};