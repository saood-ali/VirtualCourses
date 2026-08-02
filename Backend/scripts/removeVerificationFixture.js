// One-off script: remove the __RETRIEVAL_VERIFY__ verification fixture that
// was seeded to exercise the retrieval pipeline (M4/M5 verification).
//
// Scope is EXACT: deletes only documents whose title/lectureTitle match the
// __RETRIEVAL_VERIFY__ prefix, in FK-safe order (chunks -> lectures -> course).
// Published courses and real lecture data are never touched.
//
//   node scripts/removeVerificationFixture.js --dry-run
//   node scripts/removeVerificationFixture.js

import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Course from "../models/courseModel.js";
import Lecture from "../models/lectureModel.js";
import LectureChunk from "../models/lectureChunkModel.js";

const DRY_RUN = process.argv.includes("--dry-run");

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log(`Connected. Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}\n`);

  const courseFilter = { title: /^__RETRIEVAL_VERIFY__/ };
  const lectureFilter = { lectureTitle: /^__RETRIEVAL_VERIFY__/ };

  const courses = await Course.find(courseFilter).select("_id title").lean();
  const lectures = await Lecture.find(lectureFilter).select("_id lectureTitle").lean();
  const lectureIds = lectures.map((l) => l._id);

  console.log(`Found: ${courses.length} fixture course(s), ${lectures.length} fixture lecture(s).`);
  for (const c of courses) console.log(`  course ${c._id}  "${c.title}"`);
  for (const l of lectures) console.log(`  lecture ${l._id}  "${l.lectureTitle}"`);

  // Safety guard: if the DB shape ever changes (e.g. a real course titled
  // __RETRIEVAL_VERIFY__...), refuse to run blind.
  if (courses.length === 0 || lectures.length === 0 || lectureIds.length === 0) {
    console.error("ABORT: no fixture documents matched. Nothing deleted.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const chunkCount = await LectureChunk.countDocuments({ lectureId: { $in: lectureIds } });
  console.log(`\nWould delete: ${chunkCount} chunk(s), ${lectures.length} lecture(s), ${courses.length} course(s).`);

  if (DRY_RUN) {
    console.log("DRY RUN — no writes performed.");
    await mongoose.disconnect();
    return;
  }

  const r1 = await LectureChunk.deleteMany({ lectureId: { $in: lectureIds } });
  const r2 = await Lecture.deleteMany({ _id: { $in: lectureIds } });
  const r3 = await Course.deleteMany({ _id: { $in: courses.map((c) => c._id) } });
  console.log(`\nDeleted: ${r1.deletedCount} chunks, ${r2.deletedCount} lectures, ${r3.deletedCount} courses.`);

  const remaining = await LectureChunk.countDocuments({ lectureId: { $in: lectureIds } });
  console.log(`Remaining fixture chunks: ${remaining}`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Fixture removal failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
