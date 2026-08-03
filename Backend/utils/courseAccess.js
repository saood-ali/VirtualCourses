import Course from "../models/courseModel.js";

/* A course discussion is readable and writable by exactly the people with a
   seat in the course: enrolled students and the educator who owns it.

   Shared by the socket handler (join_room) and the REST history endpoint so
   both doors enforce the same rule — a client that cannot join the room over
   the socket cannot read the transcript over HTTP either. */
export const canAccessCourse = async (courseId, userId) => {
  if (!courseId || !userId) return false;

  const course = await Course.findById(courseId)
    .select("creator enrolledStudents")
    .lean();
  if (!course) return false;

  if (course.creator?.toString() === userId.toString()) return true;
  return (course.enrolledStudents || []).some(
    (id) => id.toString() === userId.toString()
  );
};

export default canAccessCourse;
