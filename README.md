# Layouts Thumbnails Generator
## Project Description
Layouts Thumbnails Generator is a tool for automatic generation of thumbnails for HTML layouts with support for various processing modes.

## Features
- Thumbnail generation for HTML files
- Support for processing files in different directories
- Customization of generation parameters via environment variables
- Logging of the generation process
- Support for HTML content templating

## Requirements
- Node.js (version 14+ recommended)
- Dependencies installed from `package.json`

## Local Installation
1. Clone the repository
2. Run `npm install`
3. Create a `.env` file with settings (optional)

## Environment Variables
Possible settings via `.env`:
- `INPUT_DIR`: Input files directory (default: `shared/email`)
- `THUMBNAIL_WIDTH`: Thumbnail width (default: 1024)
- `MIN_THUMBNAIL_HEIGHT`: Minimum thumbnail height (default: 40)
- `THUMBNAIL_QUALITY`: Thumbnail quality (default: 80)
- `LOG_LEVEL`: Logging level (default: 'info')

## Usage
### Run via npm
```bash
npm start
```

### Global Installation
```bash
npm install -g
thumbgen
```

## Project Structure
- `src/index.js`: Main generation script
- `src/config/config.js`: Application configuration
- `src/emailProcessor.cjs`: HTML template processor
- `src/utils/logger.js`: Logging setup

## Logging
Logs are stored:
- In the console
- In `logs/error.log` files
- In `logs/combined.log` files

## Processing Features
- Support for generating thumbnails for HTML files
- Limitation on the number of simultaneously processed files
- Skipping service directories (e.g., `_blank`)

## Dependencies
- Puppeteer for rendering
- Cheerio for HTML parsing
- Winston for logging

## Thumbnail Formats
- PNG (for templates)
- WebP (for layouts)
