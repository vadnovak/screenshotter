const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');
const logger = require('./logger');

/**
 * Створює директорію, якщо вона ще не існує.
 *
 * @param {string} dirPath - Шлях до директорії.
 * @returns {Promise<void>}
 */
async function createDirectory(dirPath) {
  try {
    await fs.ensureDir(dirPath);
    logger.info(`Директорія ${dirPath} успішно створена.`);
  } catch (error) {
    logger.error(`Виникла помилка при створенні директорії ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Знаходить всі HTML-файли в заданій директорії рекурсивно.
 *
 * @param {string} dirPath - Шлях до директорії.
 * @returns {Promise<string[]>} - Масив шляхів до знайдених HTML-файлів.
 */
async function findHTMLFiles(dirPath) {
  try {
    return await glob(`${dirPath}/**/*.html`);
  } catch (error) {
    logger.error(`Помилка при пошуку HTML-файлів у ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Копіює файл з одного місця в інше.
 *
 * @param {string} sourcePath - Шлях до вихідного файлу.
 * @param {string} destPath - Шлях до цільового файлу.
 * @returns {Promise<void>}
 */
async function copyFile(sourcePath, destPath) {
  try {
    await fs.copy(sourcePath, destPath);
    logger.info(`Файл ${sourcePath} успішно скопійовано до ${destPath}.`);
  } catch (error) {
    logger.error(`Виникла помилка при копіюванні файлу ${sourcePath} до ${destPath}:`, error);
    throw error;
  }
}

module.exports = {
  createDirectory,
  findHTMLFiles,
  copyFile,
};