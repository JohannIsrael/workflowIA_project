import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as expressWinston from 'express-winston';
import * as winston from 'winston';


export const expressWinstonLogger = expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `[Wins] ${process.pid}  - ${new Date().toLocaleString('es-MX', {
          month: '2-digit',
          day: '2-digit',
          hour: 'numeric',
          year: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })}     LOG [HTTP] ${level}: ${message}`;
      }),
    ),
    meta: false,
    //   expressFormat: true,
    colorize: true,
    requestFilter: (req, propName) => {
      if (propName === '_startTime') {
        req._startTime = req._startTime || new Date(); // asegurar que exista
      }
      return req[propName];
    },
    msg: (req, res) => {        
      const status = res.statusCode;
      const method = req.method;
      const url = req.originalUrl;
  
      const start = ((req as any)._startTime || new Date()) as Date;
      const duration = Date.now() - start.getTime();
  
      return ` ${method} ${url} ${status} +${duration}ms`;
    },
  });