/**
 * URL Shortener Logging Middleware - Frontend Version
 * Reusable logging package that sends logs to the test server
 */

// Configuration
const LOG_API_URL = "http://20.244.56.144/evaluation-service/logs";

// Valid values for validation
const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const VALID_PACKAGES = {
  frontend: ["api", "component", "hook", "page", "state", "style", "handler"],
  backend: ["handler", "middleware", "service", "database", "util"],
};

/**
 * Logger class to handle all logging operations
 */
class Logger {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    this.isOnline = navigator?.onLine ?? true;

    // Setup online/offline listeners
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true;
        this.processOfflineQueue();
      });
      window.addEventListener("offline", () => {
        this.isOnline = false;
      });
    }

    // Queue for offline logs
    this.offlineQueue = this.loadOfflineQueue();
  }

  /**
   * Validate log parameters
   * @param {string} stack - "backend" or "frontend"
   * @param {string} level - "debug", "info", "warn", "error", "fatal"
   * @param {string} packageName - Valid package name based on stack
   * @param {string} message - Log message
   * @returns {Object} Validation result
   */
  validateParams(stack, level, packageName, message) {
    const errors = [];

    // Validate stack
    if (!stack || typeof stack !== "string") {
      errors.push("Stack is required and must be a string");
    } else if (!VALID_STACKS.includes(stack.toLowerCase())) {
      errors.push(`Stack must be one of: ${VALID_STACKS.join(", ")}`);
    }

    // Validate level
    if (!level || typeof level !== "string") {
      errors.push("Level is required and must be a string");
    } else if (!VALID_LEVELS.includes(level.toLowerCase())) {
      errors.push(`Level must be one of: ${VALID_LEVELS.join(", ")}`);
    }

    // Validate package
    if (!packageName || typeof packageName !== "string") {
      errors.push("Package is required and must be a string");
    } else if (stack && VALID_PACKAGES[stack.toLowerCase()]) {
      if (
        !VALID_PACKAGES[stack.toLowerCase()].includes(packageName.toLowerCase())
      ) {
        errors.push(
          `Package for ${stack} must be one of: ${VALID_PACKAGES[
            stack.toLowerCase()
          ].join(", ")}`
        );
      }
    }

    // Validate message
    if (!message || typeof message !== "string") {
      errors.push("Message is required and must be a string");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Load offline queue from localStorage
   * @returns {Array} Array of queued log entries
   */
  loadOfflineQueue() {
    try {
      const queue = localStorage.getItem("loggingMiddleware_offlineQueue");
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Save offline queue to localStorage
   */
  saveOfflineQueue() {
    try {
      localStorage.setItem(
        "loggingMiddleware_offlineQueue",
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      // Fallback for localStorage issues
    }
  }

  /**
   * Add log to offline queue
   * @param {Object} logData - Log data to queue
   */
  queueOfflineLog(logData) {
    this.offlineQueue.push({
      ...logData,
      queuedAt: new Date().toISOString(),
    });
    this.saveOfflineQueue();
  }

  /**
   * Process offline queue when back online
   */
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    const queueCopy = [...this.offlineQueue];
    this.offlineQueue = [];
    this.saveOfflineQueue();

    for (const logData of queueCopy) {
      try {
        await this.sendLogToAPI(logData);
      } catch (error) {
        // If still failing, re-queue the log
        this.queueOfflineLog(logData);
      }
    }
  }

  /**
   * Send log data to the API
   * @param {Object} logData - Log data to send
   * @returns {Promise} API response
   */
  async sendLogToAPI(logData) {
    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Send log with retry mechanism
   * @param {Object} logData - Log data to send
   * @returns {Promise} API response or error
   */
  async sendLogWithRetry(logData) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.sendLogToAPI(logData);
        return {
          success: true,
          data: response,
          attempt,
        };
      } catch (error) {
        lastError = error;

        if (attempt < this.retryAttempts) {
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * attempt)
          );
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: this.retryAttempts,
    };
  }

  /**
   * Main logging function
   * @param {string} stack - "backend" or "frontend"
   * @param {string} level - "debug", "info", "warn", "error", "fatal"
   * @param {string} packageName - Valid package name
   * @param {string} message - Log message
   * @returns {Promise} Log result
   */
  async Log(stack, level, packageName, message) {
    try {
      // Validate parameters
      const validation = this.validateParams(
        stack,
        level,
        packageName,
        message
      );
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
      }

      // Prepare log data
      const logData = {
        stack: stack.toLowerCase(),
        level: level.toLowerCase(),
        package: packageName.toLowerCase(),
        message: message,
        timestamp: new Date().toISOString(),
      };

      // If offline, queue the log
      if (!this.isOnline) {
        this.queueOfflineLog(logData);
        return {
          success: true,
          queued: true,
          message: "Log queued for when online",
        };
      }

      // Send log to API
      const result = await this.sendLogWithRetry(logData);

      if (!result.success) {
        // If API fails, queue for later
        this.queueOfflineLog(logData);
        throw new Error(
          `Failed to send log after ${result.attempts} attempts: ${result.error.message}`
        );
      }

      return {
        success: true,
        logID: result.data.logID,
        message: result.data.message,
        attempt: result.attempt,
      };
    } catch (error) {
      // Fallback error handling without console.log
      throw new Error(`Logging failed: ${error.message}`);
    }
  }

  /**
   * Convenience methods for different log levels
   */
  async debug(stack, packageName, message) {
    return this.Log(stack, "debug", packageName, message);
  }

  async info(stack, packageName, message) {
    return this.Log(stack, "info", packageName, message);
  }

  async warn(stack, packageName, message) {
    return this.Log(stack, "warn", packageName, message);
  }

  async error(stack, packageName, message) {
    return this.Log(stack, "error", packageName, message);
  }

  async fatal(stack, packageName, message) {
    return this.Log(stack, "fatal", packageName, message);
  }

  /**
   * Get offline queue status
   * @returns {Object} Queue information
   */
  getOfflineQueueStatus() {
    return {
      queueLength: this.offlineQueue.length,
      isOnline: this.isOnline,
      oldestEntry:
        this.offlineQueue.length > 0 ? this.offlineQueue[0].queuedAt : null,
    };
  }

  /**
   * Clear offline queue (use with caution)
   */
  clearOfflineQueue() {
    this.offlineQueue = [];
    this.saveOfflineQueue();
  }
}

// Create singleton instance
const logger = new Logger();

// Export the main Log function and convenience methods
export const Log = logger.Log.bind(logger);
export const LogDebug = logger.debug.bind(logger);
export const LogInfo = logger.info.bind(logger);
export const LogWarn = logger.warn.bind(logger);
export const LogError = logger.error.bind(logger);
export const LogFatal = logger.fatal.bind(logger);
export const getLoggerStatus = logger.getOfflineQueueStatus.bind(logger);
export const clearLogQueue = logger.clearOfflineQueue.bind(logger);

export default logger;
