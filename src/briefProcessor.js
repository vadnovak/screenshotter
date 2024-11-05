// briefProcessor.js
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';

class BriefHTMLProcessor {
    constructor(localServerUrl = 'http://localhost:5001') {
        this.localServerUrl = localServerUrl;
    }

    async processHTML(htmlContent) {
        const $ = cheerio.load(htmlContent);

        // Replace CSS path in head
        $('head link[href*="../shared/dist/main.css"]').attr('href', `${this.localServerUrl}/dist/main.css`);

        // Replace script paths
        $('script[src*="../shared/src/getbundle.js"]').attr('src', `${this.localServerUrl}/main.js`);

        // Replace all media assets paths in body
        $('body').html(function(i, html) {
            return html.replace(/\.\.\/shared\/assets\//g, `${this.localServerUrl}/assets/`);
        }.bind(this));

        return $.html();
    }

    async processBriefFile(inputPath, outputDir) {
        const htmlContent = await fs.readFile(inputPath, 'utf-8');
        const processedHTML = await this.processHTML(htmlContent);

        // Create temporary file
        const tempFilePath = path.join(outputDir, 'temp-index.html');
        await fs.writeFile(tempFilePath, processedHTML);

        return {
            tempFilePath,
            processedHTML
        };
    }

    async cleanup(tempFilePath) {
        if (await fs.pathExists(tempFilePath)) {
            await fs.remove(tempFilePath);
        }
    }
}

export default BriefHTMLProcessor;
