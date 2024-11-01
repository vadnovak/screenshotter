import * as dotenv from 'dotenv';

dotenv.config();

export default {
  inputDir: process.env.INPUT_DIR || 'shared/email',
  thumbnailWidth: parseInt(process.env.THUMBNAIL_WIDTH) || 1024,
  minThumbnailHeight: parseInt(process.env.MIN_THUMBNAIL_HEIGHT) || 40,
  thumbnailQuality: parseInt(process.env.THUMBNAIL_QUALITY) || 80,
  logLevel: process.env.LOG_LEVEL || 'info',
  templateProcessingLimit: 2,
  fileProcessingLimit: 5,
};
