import { Injectable } from '@angular/core';

/** Thin wrapper over `console`, so logging has one place to change later. */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  /** Logs something unexpected that the app recovered from. */
  warn(message: string, ...context: unknown[]): void {
    console.warn(message, ...context);
  }

  /** Logs a failure with technical details that are never shown to users. */
  error(message: string, ...context: unknown[]): void {
    console.error(message, ...context);
  }
}
