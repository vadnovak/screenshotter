import fs from 'fs-extra';
import path from 'path';
import HTMLTemplateProcessor from './emailProcessor.cjs';
import { generateThumbnail } from './thumbnailGenerator.js';
import logger from './utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templatePath = path.join(__dirname, 'template.html');
const processor = new HTMLTemplateProcessor(templatePath);

export async function processEmailFile(htmlFilePath, outputPath) {
    try {
        logger.info(`Processing file: ${htmlFilePath}`);

        // Create thumbnails directory if it doesn't exist
        const thumbnailsDir = path.join(path.dirname(htmlFilePath), 'thumbnails');
        await fs.ensureDir(thumbnailsDir);

        // Generate thumbnail filename based on original filename
        const thumbnailPath = path.join(thumbnailsDir, `thumb.webp`);

        const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');
        const processedHTML = await processor.processHTML(htmlContent);

        if (!processedHTML) {
            logger.error(`Failed to process HTML file: ${htmlFilePath}`);
            return;
        }

        await generateThumbnail(processedHTML, thumbnailPath);
        logger.info(`Thumbnail generated: ${thumbnailPath}`);

        return thumbnailPath;
    } catch (error) {
        logger.error(`Error processing file: ${htmlFilePath}`, error.stack);
        throw error; // Propagate error for proper handling
    }
}
