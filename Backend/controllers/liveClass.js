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

export const startLiveSession = async (req, res) => {
  try {
    const { courseId, youtubeId, title } = req.body;
    if (!courseId || !youtubeId) {
      return res.status(400).json({ message: "Course ID and YouTube ID are required." });
    }

    const session = await LiveSession.findOneAndUpdate(
      { courseId },
      { 
        $set: { 
          youtubeId, 
          title: title || "Live Doubt Session",
          isLive: true,
          educator: req.user._id 
        } 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, session });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to start live session" });
  }
};