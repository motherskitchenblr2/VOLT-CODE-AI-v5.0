export interface WatchdogTelemetry {
  fps: number;
  memoryUsageMb: number;
  hydrationErrorsCount: number;
  apiFailuresCount: number;
  activeTimersCount: number;
}

export class SentinelWatcher {
  private telemetry: WatchdogTelemetry = {
    fps: 60,
    memoryUsageMb: 0,
    hydrationErrorsCount: 0,
    apiFailuresCount: 0,
    activeTimersCount: 0
  };

  private frameCount = 0;
  private lastFpsCheck = Date.now();

  constructor(
    private logCallback: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void
  ) {}

  public startFpsMonitor() {
    const loop = () => {
      this.frameCount++;
      const now = Date.now();
      if (now - this.lastFpsCheck >= 1000) {
        this.telemetry.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCheck));
        this.frameCount = 0;
        this.lastFpsCheck = now;
        
        if (this.telemetry.fps < 30) {
          this.logCallback(`[SENTINEL] Frame rate warning: System FPS degraded to ${this.telemetry.fps}`, 'warn');
        }
      }
      requestAnimationFrame(loop);
    };
    if (typeof window !== 'undefined') {
      requestAnimationFrame(loop);
    }
  }

  public checkMemoryPerformance() {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      this.telemetry.memoryUsageMb = Math.round(mem.usedJSHeapSize / (1024 * 1024));
      
      if (this.telemetry.memoryUsageMb > 250) {
        this.logCallback(`[SENTINEL] Memory load warning: Used heap size reached ${this.telemetry.memoryUsageMb} MB`, 'warn');
      }
    }
  }

  public registerHydrationError() {
    this.telemetry.hydrationErrorsCount++;
    this.logCallback('[SENTINEL] React Hydration mismatch error intercepted.', 'error');
  }

  public registerApiFailure(endpoint: string) {
    this.telemetry.apiFailuresCount++;
    this.logCallback(`[SENTINEL] Outgoing network exception on target: ${endpoint}`, 'error');
  }

  public getTelemetryReport(): WatchdogTelemetry {
    this.checkMemoryPerformance();
    return this.telemetry;
  }
}
