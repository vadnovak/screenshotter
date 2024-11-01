require('dotenv').config();

module.exports = {
  inputDir: process.env.INPUT_DIR,
  outputDir: process.env.OUTPUT_DIR,
  thumbnailWidth: parseInt(process.env.THUMBNAIL_WIDTH),
  minThumbnailHeight: parseInt(process.env.MIN_THUMBNAIL_HEIGHT),
  thumbnailQuality: parseInt(process.env.THUMBNAIL_QUALITY),
  logLevel: process.env.LOG_LEVEL,
};