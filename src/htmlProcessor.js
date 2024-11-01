import * as cheerio from 'cheerio';
import fs from 'fs/promises';

class HTMLTemplateProcessor {
    constructor(templatePath) {
        this.templatePath = templatePath;
    }

    async processHTML(htmlContent) {
        const $ = cheerio.load(htmlContent);
        const bodyContent = $('body').html();

        const template = await fs.readFile(this.templatePath, 'utf-8');
        const $template = cheerio.load(template);

        $template('mj-body').html(bodyContent);

        return $template.html();
    }
}

export default HTMLTemplateProcessor;
