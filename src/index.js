#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import puppeteer from 'puppeteer';
import config from './config/config.js';
import logger from './utils/logger.js';
import HTMLTemplateProcessor from './htmlProcessor.js';
import pLimit from 'p-limit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

logger.info('Launching Puppeteer...');
let thumbnailCount = 0;

async function generateThumbnail(htmlContent, outputPath, options = {}) {
    if (!htmlContent) {
        logger.error('Empty HTML content provided');
        throw new Error('Empty HTML content');
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        await page.setViewport({
            width: config.thumbnailWidth,
            height: config.minThumbnailHeight,
            deviceScaleFactor: 1,
        });

        await page.setContent(htmlContent, {
            waitUntil: ['load', 'networkidle0', 'domcontentloaded']
        });

        await page.waitForNetworkIdle();

        // Calculate actual content height
        const contentHeight = await page.evaluate(() => {
            const body = document.body;
            const html = document.documentElement;
            return Math.max(
                body.scrollHeight, body.offsetHeight,
                html.clientHeight, html.scrollHeight, html.offsetHeight
            );
        });

        await page.setViewport({
            width: config.thumbnailWidth,
            height: contentHeight,
            deviceScaleFactor: 1,
        });

        await page.addStyleTag({
            content: `
                body { 
                    margin: 0;
                    padding: 0;
                    background: white;
                }
            `
        });

        const screenshotOptions = {
            path: outputPath,
            fullPage: true,
            ...(path.extname(outputPath) === '.webp' ? {
                type: 'webp',
                quality: config.thumbnailQuality
            } : {
                type: 'png',
                omitBackground: false
            })
        };

        await page.screenshot(screenshotOptions);

        const fileExists = await fs.exists(outputPath);
        if (fileExists) {
            const fileStats = await fs.stat(outputPath);
            logger.info(`Thumbnail created successfully. File size: ${fileStats.size} bytes`);
        }
    } finally {
        await browser.close();
    }
}

const templatePath = path.join(__dirname, 'template.html');
const processor = new HTMLTemplateProcessor(templatePath);

async function processHTMLFile(htmlFilePath, outputDir, isTemplateFolder = false) {
    try {
        logger.info(`Processing file: ${htmlFilePath}`);

        const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');
        const processedHTML = await processor.processHTML(htmlContent);

        if (!processedHTML) {
            logger.error(`Failed to process HTML file: ${htmlFilePath}`);
            return;
        }

        // Determine thumbnail name and type based on folder
        const thumbnailName = isTemplateFolder ? 'thumb.png' : 'thumb.webp';
        const thumbnailPath = path.join(outputDir, thumbnailName);
        await generateThumbnail(processedHTML, thumbnailPath);
        logger.info(`Thumbnail generated: ${thumbnailPath}`);

        thumbnailCount++; // Increment counter
    } catch (error) {
        logger.error(`Error processing file: ${htmlFilePath}`, error);
    }
}

// Universal function to check file type
function checkFileType(filePath, isTemplateFolder) {
    const extname = path.extname(filePath);
    const basename = path.basename(filePath);
    return {
        isHTML: extname === '.html',
        isEmail: isTemplateFolder && basename === 'email.html'
    };
}

function shouldSkipDirectory(dirName, parentPath) {
    // Check if it's a _blank folder in the templates directory
    return dirName === '_blank' && path.basename(parentPath) === 'templates';
}

async function processDirectory(inputDir, isTemplateFolder = false) {
    try {
        if (!await fs.pathExists(inputDir)) {
            logger.error(`Input directory does not exist: ${inputDir}`);
            return;
        }

        const entries = await fs.readdir(inputDir, { withFileTypes: true });

        // Set processing limits based on folder type
        const limit = isTemplateFolder ? config.templateProcessingLimit : config.fileProcessingLimit;
        const limiter = pLimit(limit);

        const processingPromises = [];
        for (const entry of entries) {
            const entryPath = path.join(inputDir, entry.name);

            if (entry.isDirectory()) {
                // Check if we should skip this directory
                if (shouldSkipDirectory(entry.name, inputDir)) {
                    logger.info(`Skipping _blank directory in templates folder: ${entryPath}`);
                    continue;
                }

                // Check if we're entering the templates folder
                const isTemplates = entry.name === 'templates' || isTemplateFolder;
                await processDirectory(entryPath, isTemplates);
            } else if (entry.isFile()) {
                processingPromises.push(limiter(async () => {
                    // Process file based on folder type
                    const { isHTML, isEmail } = checkFileType(entryPath, isTemplateFolder);
                    if (isTemplateFolder && isEmail) {
                        await processHTMLFile(entryPath, path.dirname(entryPath), true);
                    } else if (isHTML) {
                        await processHTMLFile(entryPath, path.dirname(entryPath), false);
                    }
                }));
            }
        }

        await Promise.all(processingPromises);
    } catch (error) {
        logger.error(`Error processing directory: ${inputDir}`, error);
    }
}

async function main() {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        await processDirectory(config.inputDir, browser);
    } catch (error) {
        logger.error('Critical error', error);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
    logger.info(`Thumbnail generation completed successfully. Total thumbnails generated: ${thumbnailCount}`);
}

main();
