// Production-level logging utility
// Follows 2025 best practices for application logging

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';
type LogContext = Record<string, any>;

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logLevel = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    
    // Production defaults
    if (this.isProduction) {
      return envLevel || 'info';
    }
    
    // Development defaults
    return envLevel || 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, context, timestamp, userId, sessionId } = entry;
    
    let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (userId) {
      formatted += ` (UserID: ${userId})`;
    }
    
    if (sessionId) {
      formatted += ` (SessionID: ${sessionId})`;
    }
    
    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }
    
    return formatted;
  }

  private log(level: LogLevel, message: string, context?: LogContext, userId?: string, sessionId?: string) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context: this.sanitizeContext(context),
      timestamp: new Date().toISOString(),
      userId,
      sessionId
    };

    const formatted = this.formatMessage(entry);

    // Use appropriate console method
    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'debug':
      case 'trace':
        console.log(formatted);
        break;
    }

    // In production, you might want to send to external logging service
    if (this.isProduction && (level === 'error' || level === 'warn')) {
      this.sendToExternalLogger(entry);
    }
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    
    // Remove sensitive data in production
    if (this.isProduction) {
      const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'pin', 'secret', 'key'];
      
      for (const key of sensitiveKeys) {
        if (key in sanitized) {
          sanitized[key] = '[REDACTED]';
        }
      }
    }

    return sanitized;
  }

  private sendToExternalLogger(entry: LogEntry) {
    // Placeholder for external logging service integration
    // In production, you might send to services like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - CloudWatch
    // - Custom logging endpoint
  }

  // Public logging methods

  /**
   * TRACE: Detailed function tracing - NEVER in production
   * Only use in development/staging
   */
  trace(message: string, context?: LogContext, userId?: string, sessionId?: string) {
    if (this.isProduction) return; // Never log trace in production
    this.log('trace', message, context, userId, sessionId);
  }

  /**
   * DEBUG: External API responses, DB queries, config dumps
   * Off by default in production - enable with LOG_LEVEL=debug
   */
  debug(message: string, context?: LogContext, userId?: string, sessionId?: string) {
    this.log('debug', message, context, userId, sessionId);
  }

  /**
   * INFO: App startup, key business events, system health
   * Always on in production
   */
  info(message: string, context?: LogContext, userId?: string, sessionId?: string) {
    this.log('info', message, context, userId, sessionId);
  }

  /**
   * WARN: Performance alerts, API latency issues
   * Always on in production
   */
  warn(message: string, context?: LogContext, userId?: string, sessionId?: string) {
    this.log('warn', message, context, userId, sessionId);
  }

  /**
   * ERROR: Errors and exceptions (with PII scrubbed)
   * Always on in production
   */
  error(message: string, context?: LogContext, userId?: string, sessionId?: string) {
    this.log('error', message, context, userId, sessionId);
  }

  // Specialized logging methods for common use cases

  /**
   * Log API requests/responses
   */
  apiCall(method: string, url: string, status: number, latency: number, userId?: string) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'debug';
    this.log(level, `API ${method} ${url} → ${status}`, {
      method,
      url,
      status,
      latency: `${latency}ms`
    }, userId);
  }

  /**
   * Log business events
   */
  businessEvent(event: string, context?: LogContext, userId?: string) {
    this.info(`Business Event: ${event}`, context, userId);
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, value: number, unit: string, context?: LogContext) {
    const level = this.getPerformanceLogLevel(metric, value);
    this.log(level, `Performance: ${metric} = ${value}${unit}`, context);
  }

  /**
   * Log AI analysis steps (always enabled as requested)
   */
  aiAnalysis(step: string, context?: LogContext, userId?: string) {
    // Always log AI analysis steps regardless of log level
    const entry: LogEntry = {
      level: 'info',
      message: `AI Analysis: ${step}`,
      context: this.sanitizeContext(context),
      timestamp: new Date().toISOString(),
      userId
    };
    
    console.info(`🤖 ${this.formatMessage(entry)}`);
  }

  private getPerformanceLogLevel(metric: string, value: number): LogLevel {
    // Define performance thresholds
    const thresholds = {
      'api_latency': { warn: 2000, error: 5000 },
      'db_query_time': { warn: 1000, error: 3000 },
      'memory_usage': { warn: 500, error: 1000 }, // MB
      'cpu_load': { warn: 70, error: 90 } // percentage
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'info';

    if (value >= threshold.error) return 'error';
    if (value >= threshold.warn) return 'warn';
    return 'info';
  }

  /**
   * Log system health metrics
   */
  systemHealth(metrics: { memoryUsage?: number; cpuLoad?: number; [key: string]: any }) {
    this.info('System Health Check', metrics);
  }

  /**
   * Log authentication events
   */
  auth(event: 'login' | 'logout' | 'session_refresh' | 'auth_failure', userId?: string, context?: LogContext) {
    const level = event === 'auth_failure' ? 'warn' : 'info';
    this.log(level, `Auth Event: ${event}`, context, userId);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogLevel, LogContext };