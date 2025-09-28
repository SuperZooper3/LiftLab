/**
 * Simulation Tick Scheduler
 * Manages the main simulation loop with precise timing control
 */

/**
 * Callback function type for tick events
 */
export type TickCallback = (deltaTime: number, totalTime: number) => void;

/**
 * Ticker interface for controlling simulation timing
 */
export interface Ticker {
  /** Start the ticker */
  start(): void;
  
  /** Stop the ticker */
  stop(): void;
  
  /** Pause the ticker (can be resumed) */
  pause(): void;
  
  /** Resume a paused ticker */
  resume(): void;
  
  /** Check if ticker is currently running */
  isRunning(): boolean;
  
  /** Check if ticker is paused */
  isPaused(): boolean;
  
  /** Add a callback to be called on each tick */
  onTick(callback: TickCallback): () => void;
  
  /** Remove all tick callbacks */
  clearCallbacks(): void;
  
  /** Get current tick rate (ticks per second) */
  getTickRate(): number;
  
  /** Set new tick rate (ticks per second) */
  setTickRate(ticksPerSecond: number): void;
  
  /** Get total elapsed time since start */
  getTotalTime(): number;
  
  /** Reset total time counter */
  resetTime(): void;
}

/**
 * High-precision ticker implementation using requestAnimationFrame
 * Falls back to setTimeout for non-browser environments
 */
class PrecisionTicker implements Ticker {
  private intervalMs: number;
  private callbacks: Set<TickCallback> = new Set();
  private isActive = false;
  private isPausedState = false;
  private lastTickTime = 0;
  private totalElapsedTime = 0;
  private animationFrameId: number | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(ticksPerSecond: number) {
    this.intervalMs = 1000 / ticksPerSecond;
  }

  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.isPausedState = false;
    this.lastTickTime = this.getCurrentTime();
    this.scheduleNextTick();
  }

  stop(): void {
    this.isActive = false;
    this.isPausedState = false;
    this.cancelScheduledTick();
  }

  pause(): void {
    if (!this.isActive) return;
    this.isPausedState = true;
    this.cancelScheduledTick();
  }

  resume(): void {
    if (!this.isActive || !this.isPausedState) return;
    this.isPausedState = false;
    this.lastTickTime = this.getCurrentTime();
    this.scheduleNextTick();
  }

  isRunning(): boolean {
    return this.isActive && !this.isPausedState;
  }

  isPaused(): boolean {
    return this.isPausedState;
  }

  onTick(callback: TickCallback): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  clearCallbacks(): void {
    this.callbacks.clear();
  }

  getTickRate(): number {
    return 1000 / this.intervalMs;
  }

  setTickRate(ticksPerSecond: number): void {
    if (ticksPerSecond <= 0) {
      throw new Error('Tick rate must be positive');
    }
    this.intervalMs = 1000 / ticksPerSecond;
  }

  getTotalTime(): number {
    return this.totalElapsedTime;
  }

  resetTime(): void {
    this.totalElapsedTime = 0;
    this.lastTickTime = this.getCurrentTime();
  }

  private getCurrentTime(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  private scheduleNextTick(): void {
    if (!this.isActive || this.isPausedState) return;

    // Use requestAnimationFrame in browser, setTimeout in Node.js
    if (typeof globalThis !== 'undefined' && 'requestAnimationFrame' in globalThis) {
      this.animationFrameId = (globalThis as any).requestAnimationFrame(() => this.tick());
    } else {
      this.timeoutId = setTimeout(() => this.tick(), this.intervalMs);
    }
  }

  private cancelScheduledTick(): void {
    if (this.animationFrameId !== null) {
      if (typeof globalThis !== 'undefined' && 'cancelAnimationFrame' in globalThis) {
        (globalThis as any).cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = null;
    }
    
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private tick(): void {
    if (!this.isActive || this.isPausedState) return;

    const currentTime = this.getCurrentTime();
    const deltaTime = (currentTime - this.lastTickTime) / 1000; // Convert to seconds
    
    // Only tick if enough time has passed (prevents excessive ticking)
    if (deltaTime >= this.intervalMs / 1000) {
      this.totalElapsedTime += deltaTime;
      this.lastTickTime = currentTime;

      // Call all registered callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(deltaTime, this.totalElapsedTime);
        } catch (error) {
          console.error('Error in tick callback:', error);
        }
      });
    }

    // Schedule next tick
    this.scheduleNextTick();
  }
}

/**
 * Fixed-interval ticker using setInterval
 * More predictable timing but less precise than PrecisionTicker
 */
class IntervalTicker implements Ticker {
  private intervalMs: number;
  private callbacks: Set<TickCallback> = new Set();
  private isActive = false;
  private isPausedState = false;
  private totalElapsedTime = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private startTime = 0;
  private pauseTime = 0;

  constructor(ticksPerSecond: number) {
    this.intervalMs = 1000 / ticksPerSecond;
  }

  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.isPausedState = false;
    this.startTime = Date.now();
    
    this.intervalId = setInterval(() => {
      if (!this.isPausedState) {
        const deltaTime = this.intervalMs / 1000;
        this.totalElapsedTime += deltaTime;
        
        this.callbacks.forEach(callback => {
          try {
            callback(deltaTime, this.totalElapsedTime);
          } catch (error) {
            console.error('Error in tick callback:', error);
          }
        });
      }
    }, this.intervalMs);
  }

  stop(): void {
    this.isActive = false;
    this.isPausedState = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause(): void {
    if (!this.isActive) return;
    this.isPausedState = true;
    this.pauseTime = Date.now();
  }

  resume(): void {
    if (!this.isActive || !this.isPausedState) return;
    this.isPausedState = false;
  }

  isRunning(): boolean {
    return this.isActive && !this.isPausedState;
  }

  isPaused(): boolean {
    return this.isPausedState;
  }

  onTick(callback: TickCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  clearCallbacks(): void {
    this.callbacks.clear();
  }

  getTickRate(): number {
    return 1000 / this.intervalMs;
  }

  setTickRate(ticksPerSecond: number): void {
    if (ticksPerSecond <= 0) {
      throw new Error('Tick rate must be positive');
    }
    
    const wasRunning = this.isRunning();
    this.intervalMs = 1000 / ticksPerSecond;
    
    // Restart with new interval if currently running
    if (wasRunning) {
      this.stop();
      this.start();
    }
  }

  getTotalTime(): number {
    return this.totalElapsedTime;
  }

  resetTime(): void {
    this.totalElapsedTime = 0;
    this.startTime = Date.now();
  }
}

/**
 * Create a new ticker instance
 * @param ticksPerSecond Target tick rate (default: 60 TPS)
 * @param usePrecisionTiming Use high-precision timing (default: true)
 * @returns Ticker instance
 */
export function createTicker(
  ticksPerSecond: number = 60,
  usePrecisionTiming: boolean = true
): Ticker {
  if (ticksPerSecond <= 0) {
    throw new Error('Tick rate must be positive');
  }
  
  return usePrecisionTiming 
    ? new PrecisionTicker(ticksPerSecond)
    : new IntervalTicker(ticksPerSecond);
}

/**
 * Utility class for common timing operations
 */
export class TimingUtils {
  /**
   * Convert simulation time to human-readable format
   * @param seconds Time in seconds
   * @returns Formatted time string (e.g., "2m 30s")
   */
  static formatTime(seconds: number): string {
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Create a debounced version of a function
   * @param func Function to debounce
   * @param delay Delay in milliseconds
   * @returns Debounced function
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Create a throttled version of a function
   * @param func Function to throttle
   * @param limit Time limit in milliseconds
   * @returns Throttled function
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Wait for a specified number of milliseconds
   * @param ms Milliseconds to wait
   * @returns Promise that resolves after the delay
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Frame rate monitor for performance tracking
 */
export class FrameRateMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private updateInterval = 1000; // Update FPS every second

  constructor(updateInterval: number = 1000) {
    this.updateInterval = updateInterval;
    this.lastTime = Date.now();
  }

  /**
   * Call this method every frame/tick
   */
  tick(): void {
    this.frameCount++;
    const currentTime = Date.now();
    
    if (currentTime - this.lastTime >= this.updateInterval) {
      this.fps = (this.frameCount * 1000) / (currentTime - this.lastTime);
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return Math.round(this.fps * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Reset the monitor
   */
  reset(): void {
    this.frameCount = 0;
    this.lastTime = Date.now();
    this.fps = 0;
  }
}
