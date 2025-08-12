export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export enum ExecutionEnvironment {
  BACKEND_PROCESSING = 'backend_processing',
  SCRAPING_SERVICE = 'scraping_service'
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  jsonData?: string;
  executionEnvironment: ExecutionEnvironment;
}

export class Logger {
  private logs: LogEntry[] = [];
  private startTime: number;
  private userId: string;
  private useCaseName: string;
  private executionEnvironment: ExecutionEnvironment;

  constructor(userId: string, useCaseName: string, executionEnvironment: keyof typeof ExecutionEnvironment = 'SCRAPING_SERVICE') {
    this.startTime = new Date().getTime();
    this.userId = userId;
    this.useCaseName = useCaseName;
    this.executionEnvironment = ExecutionEnvironment[executionEnvironment];
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    jsonData?: Object,
  ): LogEntry {

    // Console log the log entry
    console.log("Log entry: ", { userId: this.userId, useCaseName: this.useCaseName, level, message, jsonData, executionEnvironment: this.executionEnvironment });

    const now = new Date().getTime();

    return {
      timestamp: now,
      level,
      message,
      jsonData: JSON.stringify(jsonData),
      executionEnvironment: this.executionEnvironment
    };
  }

  info(message: string, jsonData?: Object): void {
    const logEntry = this.createLogEntry(LogLevel.INFO, message, jsonData);
    this.logs.push(logEntry);
  }

  warn(message: string, jsonData?: Object): void {
    const logEntry = this.createLogEntry(LogLevel.WARN, message, jsonData);
    this.logs.push(logEntry);
  }

  error(message: string, jsonData?: Object): void {
    const logEntry = this.createLogEntry(LogLevel.ERROR, message, jsonData);
    this.logs.push(logEntry);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }
} 