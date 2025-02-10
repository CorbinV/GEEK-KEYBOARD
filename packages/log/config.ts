import { LogLevelDesc } from 'loglevel';
type Config = {
  [key in 'development' | 'production']: {
    logLevel: LogLevelDesc;
  };
};
const config: Config = {
  development: {
    logLevel: 'debug',
  },
  production: {
    logLevel: 'warn',
  },
};

export default config;
