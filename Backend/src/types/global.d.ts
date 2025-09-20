declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: any;
      PORT?: string;
      CORS_ORIGIN?: string;
      RATE_LIMIT_WINDOW_MS?: string;
      RATE_LIMIT_MAX_REQUESTS?: string;
      NODE_ENV?: string;
    }
  }
  
  var process: {
    env: NodeJS.ProcessEnv;
    uptime(): number;
  };
  
  var console: {
    log(...args: any[]): void;
    error(...args: any[]): void;
  };
}

export {};
