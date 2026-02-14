import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import winston from 'winston';
import { config } from './environment';

const isPaaS = Boolean(process.env.RENDER);
const logLevel = process.env.LOG_LEVEL ?? (config.nodeEnv === 'production' ? 'warn' : 'info');

// Ensure logs directory exists before creating file transports
const logsDir = 'logs';
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({ format: consoleFormat }),
];

if (!isPaaS) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const DailyRotateFile = require('winston-daily-rotate-file');
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'info',
        format: logFormat,
      })
    );
  } catch {
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: logFormat,
      })
    );
  }
}

export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  exceptionHandlers: isPaaS ? [] : [new winston.transports.File({ filename: path.join(logsDir, 'exception.log') })],
  rejectionHandlers: isPaaS ? [] : [new winston.transports.File({ filename: path.join(logsDir, 'rejection.log') })],
});
