import fs from 'fs-extra';
import path from 'path';
import BriefHTMLProcessor from './briefProcessor.js';
import { generateThumbnail } from './thumbnailGenerator.js';
import logger from './utils/logger.js';

export async function processBriefFile(htmlFilePath, outputDir) {
    try {
        logger.info(`Processing brief file: ${htmlFilePath}`);

        const briefProcessor = new BriefHTMLProcessor(); // Припустимо, що BriefHTMLProcessor містить специфічну логіку
        const { processedHTML, tempFilePath } = await briefProcessor.processBriefFile(htmlFilePath, outputDir);

        if (!processedHTML) {
            logger.error(`Failed to process brief file: ${htmlFilePath}`);
            return;
        }

        const thumbnailPath = path.join(outputDir, 'thumb.webp'); // для "brief" використовуємо WEBP
        await generateThumbnail(tempFilePath, thumbnailPath, { isFile: true });

        // Видаляємо тимчасовий файл після створення мініатюри
        await fs.remove(tempFilePath);
        logger.info(`Brief thumbnail generated: ${thumbnailPath}`);
    } catch (error) {
        logger.error(`Error processing brief file: ${htmlFilePath}`, error);
    }
}
