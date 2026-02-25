import LiveSession from "../models/livesessionModel.js"; 

export const getLiveSessionDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const liveSession = await LiveSession.findOne({ 
      courseId, 
      isLive: true 
    }).sort({ createdAt: -1 });

    if (!liveSession) {
      return res.status(404).json({ message: "No live class happening right now." });
    }

    res.status(200).json({ 
      youtubeVideoId: liveSession.youtubeId,
      socketRoomId: `live_chat_${courseId}`,
      user: {
        name: req.user.name,
        _id: req.user._id,
        role: req.user.role 
      }
    });

  } catch (error) {
    console.error("Live Session Error:", error);
    res.status(500).json({ error: error.message });
  }
};