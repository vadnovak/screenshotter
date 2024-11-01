const cheerio = require('cheerio');
const fs = require('fs-extra');

class HTMLTemplateProcessor {
    constructor(templatePath) {
        this.templatePath = templatePath;
    }

    async processHTML(htmlContent) {
        const $ = cheerio.load(htmlContent);
        const bodyContent = $('body').html(); // Вибираємо вміст тега <body>
        
        const template = await fs.readFile(this.templatePath, 'utf-8');
        const $template = cheerio.load(template);
        
        // Вставляємо вміст у тег <mj-body> шаблону
        $template('mj-body').html(bodyContent);

        return $template.html();
    }
}

module.exports = HTMLTemplateProcessor;
