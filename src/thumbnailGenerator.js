import logger from "./utils/logger.js";
import puppeteer from "puppeteer";
import config from "./config/config.js";
import fs from "fs-extra";
import path from "path";

export async function generateThumbnail(htmlContent, outputPath) {
    if (!htmlContent) {
        logger.error('Empty HTML content provided');
        throw new Error('Empty HTML content');
    }

    // Ensure the output directory exists
    await fs.ensureDir(path.dirname(outputPath));

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new", // Updated to use the new headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        await page.setViewport({
            width: config.thumbnailWidth,
            height: config.minThumbnailHeight,
            deviceScaleFactor: 1,
        });

        await page.setContent(htmlContent, {
            waitUntil: ['load', 'networkidle0', 'domcontentloaded']
        });

        // Wait for any dynamic content to load
        await page.waitForNetworkIdle({
            timeout: 5000
        }).catch(e => logger.warn('Network idle timeout, continuing anyway'));

        const contentHeight = await page.evaluate(() => {
            return Math.max(
                document.documentElement.scrollHeight,
                document.body.scrollHeight
            );
        });

        // Set minimum height if content is too small
        const finalHeight = Math.max(contentHeight, config.minThumbnailHeight);

        await page.setViewport({
            width: config.thumbnailWidth,
            height: finalHeight,
            deviceScaleFactor: 1,
        });

        await page.screenshot({
            path: outputPath,
            type: config.thumbnailFormat,
            quality: config.thumbnailQuality,
            fullPage: false
        });

        const fileStats = await fs.stat(outputPath);
        logger.info(`Thumbnail created successfully at ${outputPath}. File size: ${fileStats.size} bytes`);

        return outputPath;
    } catch (error) {
        logger.error(`Error generating thumbnail: ${error.message}`, error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
