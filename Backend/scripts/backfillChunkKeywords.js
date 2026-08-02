// One-off maintenance script: populate LectureChunk.keywords for chunks that
// were ingested before keyword extraction was added to the chunk pipeline.
//
// Uses the SAME extractKeywords() the ingestion pipeline uses, so backfilled
// chunks are byte-identical to freshly ingested ones. This matters: the keyword
// retrieval arm matches with $in against exact strings, so the tokenizer used
// here and the one used by the query preprocessor must never diverge.
//
//   node scripts/backfillChunkKeywords.js --dry-run
//   node scripts/backfillChunkKeywords.js

import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import LectureChunk from "../models/lectureChunkModel.js";
import { extractKeywords } from "../services/ai/ingestion/keywordExtractor.js";

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 500;

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log(`Connected. Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}\n`);

  // Only chunks with no keywords — re-extracting populated ones would be a
  // no-op today but would silently rewrite them if the tokenizer ever changes.
  const filter = { $or: [{ keywords: { $size: 0 } }, { keywords: { $exists: false } }] };
  const total = await LectureChunk.countDocuments(filter);
  console.log(`Chunks missing keywords: ${total}`);
  if (total === 0) {
    console.log("Nothing to backfill.");
    await mongoose.disconnect();
    return;
  }

  const cursor = LectureChunk.find(filter).select("_id text").lean().cursor();
  let scanned = 0, updated = 0, empty = 0;
  let ops = [];

  const flush = async () => {
    if (!ops.length) return;
    if (!DRY_RUN) await LectureChunk.bulkWrite(ops, { ordered: false });
    updated += ops.length;
    ops = [];
    process.stdout.write(`\r  processed ${scanned}/${total}, updated ${updated}`);
  };

  for await (const doc of cursor) {
    scanned++;
    const keywords = extractKeywords(doc.text);
    // A chunk can legitimately yield nothing (pure stopwords/filler); skip the
    // write rather than storing an empty array over an empty array.
    if (keywords.length === 0) { empty++; continue; }
    ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { keywords } } } });
    if (ops.length >= BATCH_SIZE) await flush();
  }
  await flush();

  console.log(`\n\nScanned:  ${scanned}`);
  console.log(`Updated:  ${updated}${DRY_RUN ? " (would have been)" : ""}`);
  console.log(`Skipped:  ${empty} (no extractable keywords)`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Backfill failed:", err);
  await mongoose.disconnect();
  process.exit(1);
});
