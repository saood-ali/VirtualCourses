import fs from "fs";
import axios from "axios";

// Reusable streaming file downloader.
// Downloads a remote file (e.g. a Cloudinary video) to a local destination path.
// Shared across ingestion stages so the logic lives in exactly one place.
export const downloadFile = async (url, destPath) => {
  const writer = fs.createWriteStream(destPath);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

export default downloadFile;
