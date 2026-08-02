import { getLectureProcessingStatus } from "../services/ai/ingestion/lecturePipeline.js";

// Live processing status for a single lecture. Consumed by the educator's
// progress checklist (polled every ~3s while processing).
//
// Deliberately NOT cached: this endpoint is polled frequently and must always
// return the current status; a Redis-cached value would freeze the checklist.

export const getLectureStatus = async (req, res) => {
    try {
        const { lectureId } = req.params;

        if (!lectureId) {
            return res.status(400).json({ success: false, message: "Lecture ID is required" });
        }

        const status = await getLectureProcessingStatus(lectureId);
        if (!status) {
            return res.status(404).json({ success: false, message: "Lecture not found" });
        }

        return res.status(200).json({ success: true, ...status });

    } catch (error) {
        console.error("Status Error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to get lecture status" });
    }
};

export default getLectureStatus;
