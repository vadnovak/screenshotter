import { program } from 'commander';
import path from 'path';
import logger from './utils/logger.js';

export function setupCLI(processingFunction) {
    program
        .name('thumbgen')
        .description('Thumbnail generator for email templates and briefs')
        .version('1.0.0');

    program
        .command('email')
        .description('Generate thumbnails for email templates')
        .option('-d, --dir <directory>', 'specify input directory', 'email')
        .action(async (options) => {
            try {
                logger.info('Starting email templates thumbnail generation...');
                await processingFunction(path.resolve(options.dir), { mode: 'email' });
            } catch (error) {
                logger.error('Error processing email templates:', error);
                process.exit(1);
            }
        });

    program
        .command('brief')
        .description('Generate thumbnails for briefs')
        .option('-d, --dir <directory>', 'specify briefs directory', 'shared/brief')
        .option('-s, --server <url>', 'local server URL', 'http://localhost:5001')
        .action(async (options) => {
            try {
                logger.info('Starting briefs thumbnail generation...');
                await processingFunction(path.resolve(options.dir), {
                    mode: 'brief',
                    localServerUrl: options.server
                });
            } catch (error) {
                logger.error('Error processing briefs:', error);
                process.exit(1);
            }
        });

    program.parse();
}
