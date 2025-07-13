interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: any;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  extra?: Record<string, any>;
}

// Type for browser error events (only available in browser environment)
type BrowserErrorEvent = {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  error?: any;
};

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  page?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

class ErrorReporter {
  private queue: ErrorInfo[] = [];
  private isProcessing = false;
  private maxRetries = 3;
  private retryDelay = 1000;

  async report(
    error: Error | BrowserErrorEvent | string,
    context?: ErrorContext,
    componentStack?: string
  ): Promise<void> {
    const errorInfo = this.parseError(error, componentStack);

    // Add context
    if (context) {
      errorInfo.extra = { ...errorInfo.extra, ...context };
    }

    // Add to queue
    this.queue.push(errorInfo);

    // Process queue
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private parseError(
    error: Error | BrowserErrorEvent | string,
    componentStack?: string
  ): ErrorInfo {
    const baseInfo: ErrorInfo = {
      message: "Unknown error",
      timestamp: new Date().toISOString(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    if (typeof error === "string") {
      baseInfo.message = error;
    } else if (
      typeof ErrorEvent !== "undefined" &&
      error instanceof ErrorEvent
    ) {
      baseInfo.message = error.message;
      baseInfo.source = error.filename;
      baseInfo.lineno = error.lineno;
      baseInfo.colno = error.colno;
      baseInfo.error = error.error;
      baseInfo.stack = error.error?.stack;
    } else if (error instanceof Error) {
      baseInfo.message = error.message;
      baseInfo.stack = error.stack;
      baseInfo.error = {
        name: error.name,
        message: error.message,
      };
    }

    if (componentStack) {
      baseInfo.componentStack = componentStack;
    }

    return baseInfo;
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, 10); // Process up to 10 errors at once

      try {
        await this.sendBatch(batch);
      } catch (error) {
        // If sending fails, put errors back in queue for retry
        this.queue.unshift(...batch);
        await this.delay(this.retryDelay);
      }
    }

    this.isProcessing = false;
  }

  private async sendBatch(errors: ErrorInfo[]): Promise<void> {
    const response = await fetch("/api/report-error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ errors }),
    });

    if (!response.ok) {
      throw new Error(`Failed to report errors: ${response.status}`);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Install global error handlers
  installGlobalHandlers(): void {
    if (typeof window === "undefined") return;

    // Handle unhandled errors
    window.addEventListener("error", (event: any) => {
      this.report(event, { source: "window.onerror" });
    });

    // Handle unhandled promise rejections
    window.addEventListener(
      "unhandledrejection",
      (event: PromiseRejectionEvent) => {
        const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
        error.stack = event.reason?.stack || "";

        this.report(error, {
          source: "unhandledrejection",
          reason: event.reason,
        });
      }
    );
  }
}

// Create singleton instance
const errorReporter = new ErrorReporter();

// Export the main function
export function reportError(
  error: Error | BrowserErrorEvent | string,
  context?: ErrorContext,
  componentStack?: string
): void {
  errorReporter.report(error, context, componentStack).catch(console.error);
}

// Export function to install global handlers
export function installErrorHandlers(): void {
  errorReporter.installGlobalHandlers();
}

// Helper function for React Error Boundaries
export function reportReactError(
  error: Error,
  errorInfo: { componentStack: string },
  context?: ErrorContext
): void {
  reportError(error, context, errorInfo.componentStack);
}
