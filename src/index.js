#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const config = require('./config/config.js');
const fileUtils = require('./utils/fileUtils');
const logger = require('./utils/logger');
const HTMLTemplateProcessor = require('./htmlProcessor');
logger.info('Launching Puppeteer...');


async function generateThumbnail(htmlContent, outputPath) {
    if (!htmlContent) {
        logger.error('Empty HTML content provided');
        throw new Error('Empty HTML content');
    }

    const browser = await puppeteer.launch({
        headless: 'true'
    });

    try {
        const page = await browser.newPage();
        
        await page.setViewport({
            width: config.thumbnailWidth,
            height: config.minThumbnailHeight,  // Початкова висота, яку згодом змінемо
            deviceScaleFactor: 1,
        });

        await page.setContent(htmlContent, {
            waitUntil: ['load', 'networkidle0', 'domcontentloaded']
        });

        // Додаткове очікування для повного рендерингу
        await page.waitForNetworkIdle();

        const contentHeight = await page.evaluate(() => {
            return document.documentElement.scrollHeight;
        });

        // Задаємо динамічну висоту для viewport
        await page.setViewport({
            width: config.thumbnailWidth,
            height: contentHeight,
            deviceScaleFactor: 1,
        });

        await page.screenshot({
            path: outputPath,
            type: 'webp',
            fullPage: false
        });

        const fileExists = await fs.exists(outputPath);
        if (fileExists) {
            const fileStats = await fs.stat(outputPath);
            logger.info(`Thumbnail created successfully. File size: ${fileStats.size} bytes`);
        }
    } finally {
        await browser.close();
    }
}


// Створюємо екземпляр процесора зі шляхом до шаблону
const templatePath = path.join(__dirname, 'template.html'); // Шлях до вашого шаблону
const processor = new HTMLTemplateProcessor(templatePath);

async function processHTMLFile(htmlFilePath, outputPath) {
    try {
        logger.info(`Processing file: ${htmlFilePath}`);
        
        const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');
        
        // Обробляємо HTML через процесор, вставляючи вміст у шаблон
        const processedHTML = await processor.processHTML(htmlContent);
        
        if (!processedHTML) {
            logger.error(`Failed to process HTML file: ${htmlFilePath}`);
            return;
        }
        
        // Генеруємо мініатюру з обробленого HTML
        await generateThumbnail(processedHTML, outputPath);
        logger.info(`Thumbnail generated: ${outputPath}`);
    } catch (error) {
        logger.error(`Error processing file: ${htmlFilePath}`, error);
    }
}


function isHTMLFile(filePath) {
  return path.extname(filePath) === '.html';
}

function isCopyableFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext !== '.png' && ext !== '.webp';
  }

  async function processFile(filePath, outputDir) {
    try {
        // const fileBaseName = path.basename(filePath, '.html');  // Прибираємо розширення
        // const outputBasePath = path.join(outputDir, fileBaseName);
        await fs.ensureDir(outputDir);
        
        if (isHTMLFile(filePath)) {
            logger.info(`Generating thumbnail for HTML file: ${filePath}`);
            // Генеруємо мініатюру з іншим ім'ям файлу
            const thumbnailPath = path.join(outputDir, `thumb.webp`);
            await processHTMLFile(filePath, thumbnailPath);
            
            // Копіюємо оригінальний HTML файл
            const htmlOutputPath = path.join(outputDir, path.basename(filePath));
            await fileUtils.copyFile(filePath, htmlOutputPath);
        } else if (isCopyableFile(filePath)) {
            logger.info(`Copying file: ${filePath}`);
            const outputPath = path.join(outputDir, path.basename(filePath));
            await fileUtils.copyFile(filePath, outputPath);
        }
    } catch (error) {
        logger.error(`Error processing file: ${filePath}`, error);
    }
}
  

async function generateThumbnails(inputDir, outputDir) {
    if (!inputDir) {
        logger.error("Error generating thumbnails: inputDir is not defined");
        return;
    }
  try {
    await fileUtils.createDirectory(outputDir);
    const entries = await fs.readdir(inputDir, { withFileTypes: true });

    const tasks = entries.map(async (entry) => {
      const entryPath = path.join(inputDir, entry.name);
      if (entry.isDirectory()) {
        const nestedOutputDir = path.join(outputDir, entry.name);
        return generateThumbnails(entryPath, nestedOutputDir);
      } else if (entry.isFile()) {
        return processFile(entryPath, outputDir);
      }
    });
    await Promise.all(tasks);

    logger.info('Thumbnail generation completed successfully');
  } catch (error) {
    logger.error('Error generating thumbnails', error);
  }
}

async function main() {
  try {
    console.log('Starting thumbnail generation...');
    await generateThumbnails(config.inputDir, config.outputDir);
    console.log('Thumbnail generation completed.');
  } catch (error) {
    logger.error('Critical error', error);
  }
}

main();
