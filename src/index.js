#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'path';
import puppeteer from 'puppeteer';
import logger from './utils/logger.js';
import { processEmailFile } from './emailProcessorFile.js';
import { processBriefFile } from './briefProcessorFile.js';

import { setupCLI } from './cli.js';

logger.info('Launching Puppeteer...');
let thumbnailCount = 0;

async function processHTMLFile(htmlFilePath, outputDir, folderType) {
    try {
        // Якщо тип папки не визначений, але шлях містить email/layouts
        if (!folderType && (htmlFilePath.includes('email') || htmlFilePath.includes('layouts'))) {
            folderType = 'email';
        }

        logger.info(`Processing ${folderType || 'unknown type'} file: ${htmlFilePath}`);

        if (folderType === 'email') {
            await processEmailFile(htmlFilePath, outputDir);
            thumbnailCount++;
            logger.info(`Successfully processed email file: ${htmlFilePath}`);
        } else if (folderType === 'brief') {
            await processBriefFile(htmlFilePath, outputDir);
            thumbnailCount++;
            logger.info(`Successfully processed brief file: ${htmlFilePath}`);
        } else {
            logger.warn(`Unknown folder type for file: ${htmlFilePath}`);
            // Спробуємо обробити як email, якщо файл знаходиться в папці email або layouts
            if (htmlFilePath.toLowerCase().includes('email') || htmlFilePath.toLowerCase().includes('layouts')) {
                await processEmailFile(htmlFilePath, outputDir);
                thumbnailCount++;
                logger.info(`Successfully processed as email file: ${htmlFilePath}`);
            }
        }
    } catch (error) {
        logger.error(`Error processing file ${htmlFilePath}:`, error);
    }
}

function getFolderType(dirPath) {
    // Розбиваємо шлях на частини
    const pathParts = dirPath.toLowerCase().split(path.sep);

    // Перевіряємо всі частини шляху на наявність ключових слів
    for (const part of pathParts) {
        // Якщо знаходимо папку email або layouts у шляху
        if (part === 'email' || part === 'layouts') {
            return 'email';
        }
        if (part === 'brief') {
            return 'brief';
        }
    }

    // Перевіряємо чи знаходиться файл в підпапці email/layouts
    if (pathParts.includes('email') && pathParts.includes('layouts')) {
        return 'email';
    }

    return null;
}

function shouldSkipDirectory(dirName, parentPath) {
    return dirName === '_blank' && path.basename(parentPath) === 'templates';
}

async function processDirectory(inputDir) {
    try {
        if (!await fs.pathExists(inputDir)) {
            logger.error(`Input directory does not exist: ${inputDir}`);
            return;
        }

        const entries = await fs.readdir(inputDir, { withFileTypes: true });
        let folderType = getFolderType(inputDir);

        // Додаткова перевірка для email/layouts
        if (!folderType && (inputDir.includes('email') || inputDir.includes('layouts'))) {
            folderType = 'email';
        }

        logger.info(`Processing directory: ${inputDir} (type: ${folderType || 'unknown'})`);

        for (const entry of entries) {
            const entryPath = path.join(inputDir, entry.name);

            if (entry.isDirectory()) {
                if (!shouldSkipDirectory(entry.name, inputDir)) {
                    await processDirectory(entryPath);
                }
            } else if (entry.isFile() && path.extname(entry.name) === '.html') {
                await processHTMLFile(entryPath, inputDir, folderType);
            }
        }
    } catch (error) {
        logger.error(`Error processing directory: ${inputDir}`, error);
    }
}

async function main() {
    setupCLI(async (inputDir, options) => {
        let browser;
        try {
            logger.info('Starting with options:', options);
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            await processDirectory(inputDir);

            logger.info(`Thumbnail generation completed successfully. Total thumbnails generated: ${thumbnailCount}`);
        } catch (error) {
            logger.error('Critical error', error);
            process.exit(1);
        } finally {
            if (browser) await browser.close();
        }
    });
}

main();
