import log, { LogLevelDesc, LogLevelNames, Logger } from 'loglevel';
import config from '../config';

const env = (process.env.NODE_ENV || 'development') as 'production' | 'development';
const logLevel: LogLevelDesc = config[env]?.logLevel || 'warn';
const logColors = {
  debug: 'color: gray',
  info: 'color: blue',
  warn: 'color: orange; background-color:rgba(255, 220, 207, 0.75)',
  error: 'color: red; background-color:rgba(255, 214, 214, 0.77)',
};
log.methodFactory = function (methodName: LogLevelNames, logLevel, loggerName) {
  const color = logColors[methodName as keyof typeof logColors] || 'color: black'; // 默认颜色为黑色
  return function () {
    const timestamp = new Date().toISOString();
    const moduleName = loggerName || 'default' as any;

    const consoleArgs = [`%c[${timestamp}] [${moduleName}]`, color];

    consoleArgs.push(...Array.from(arguments));

    console.log.apply(console, consoleArgs);
  };
};
log.setLevel(logLevel);
const logger = log
export default logger;
export {
  logger,
};
export interface Log extends Logger{ };
