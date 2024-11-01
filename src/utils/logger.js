import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// Getting __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log format configuration
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Creating logger
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
          winston.format.colorize(),
          logFormat
      )
    }),
    // File logging for errors
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'error.log'),
      level: 'error'
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, '..', 'logs', 'combined.log')
    })
  ]
});

export default logger;
