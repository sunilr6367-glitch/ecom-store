/**
 * Performance Benchmarks - Phase 4 Q23: Performance Benchmarks
 *
 * Provides benchmarking utilities for measuring performance of functions and operations.
 *
 * Usage:
 *   import { benchmark, measure, track } from './utils/benchmark';
 *
 *   // Simple timing
 *   const result = await benchmark(fetchProducts, args);
 *   console.log(`Took ${result.duration}ms`);
 *
 *   // Track multiple metrics
 *   const tracker = track('API Calls');
 *   tracker.start();
 *   await fetchProducts();
 *   tracker.stop();
 *   console.log(tracker.report());
 */

import { EventEmitter } from 'events';

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  /** Name of the benchmark */
  name: string;
  /** Duration in milliseconds */
  duration: number;
  /** Number of iterations (if applicable) */
  iterations: number;
  /** Average duration per iteration */
  average: number;
  /** Minimum duration */
  min: number;
  /** Maximum duration */
  max: number;
  /** Standard deviation */
  stdDev: number;
  /** Memory usage (if available) */
  memoryUsage?: {
    before: number;
    after: number;
    delta: number;
  };
  /** Timestamp */
  timestamp: Date;
}

/**
 * Timing result
 */
export interface TimingResult {
  /** Duration in milliseconds */
  duration: number;
  /** Memory usage delta */
  memoryDelta: number;
}

/**
 * Track multiple measurements
 */
export class MeasurementTracker extends EventEmitter {
  private measurements: Map<string, TimingResult[]> = new Map();
  private activeTimers: Map<
    string,
    { startTime: number; startMemory: number }
  > = new Map();
  private name: string;

  constructor(name: string = 'Measurements') {
    super();
    this.name = name;
  }

  /**
   * Start a timer
   */
  start(key: string): void {
    this.activeTimers.set(key, {
      startTime: performance.now(),
      startMemory: process.memoryUsage().heapUsed,
    });
  }

  /**
   * Stop a timer and record the measurement
   */
  stop(key: string): TimingResult | undefined {
    const timer = this.activeTimers.get(key);
    if (!timer) {
      console.warn(`[BENCHMARK] No timer found for key: ${key}`);
      return undefined;
    }

    const duration = performance.now() - timer.startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryDelta = endMemory - timer.startMemory;

    this.activeTimers.delete(key);

    // Store measurement
    const measurements = this.measurements.get(key) || [];
    measurements.push({ duration, memoryDelta });
    this.measurements.set(key, measurements);

    this.emit('measurement', { key, duration, memoryDelta });

    return { duration, memoryDelta };
  }

  /**
   * Record a manual measurement
   */
  record(key: string, duration: number, memoryDelta?: number): void {
    const measurements = this.measurements.get(key) || [];
    measurements.push({ duration, memoryDelta: memoryDelta || 0 });
    this.measurements.set(key, measurements);
  }

  /**
   * Get statistics for a key
   */
  getStats(key: string):
    | {
        count: number;
        total: number;
        average: number;
        min: number;
        max: number;
        p50: number;
        p95: number;
        p99: number;
      }
    | undefined {
    const measurements = this.measurements.get(key);
    if (!measurements || measurements.length === 0) {
      return undefined;
    }

    const durations = measurements.map((m) => m.duration).sort((a, b) => a - b);
    const total = durations.reduce((a, b) => a + b, 0);

    const percentile = (arr: number[], p: number) => {
      const index = Math.ceil((p / 100) * arr.length) - 1;
      return arr[Math.max(0, index)];
    };

    return {
      count: durations.length,
      total,
      average: total / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      p99: percentile(durations, 99),
    };
  }

  /**
   * Generate a report for all measurements
   */
  report(): string {
    const lines: string[] = [];
    lines.push(`=== ${this.name} Report ===`);
    lines.push(`Generated: ${new Date().toISOString()}\n`);

    for (const [key, measurements] of this.measurements) {
      const stats = this.getStats(key);
      if (stats) {
        lines.push(`📊 ${key}:`);
        lines.push(`   Count: ${stats.count}`);
        lines.push(`   Total: ${stats.total.toFixed(2)}ms`);
        lines.push(`   Avg: ${stats.average.toFixed(2)}ms`);
        lines.push(`   Min: ${stats.min.toFixed(2)}ms`);
        lines.push(`   Max: ${stats.max.toFixed(2)}ms`);
        lines.push(`   P50: ${stats.p50.toFixed(2)}ms`);
        lines.push(`   P95: ${stats.p95.toFixed(2)}ms`);
        lines.push(`   P99: ${stats.p99.toFixed(2)}ms`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Get all measurements as JSON
   */
  toJSON(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const [key, measurements] of this.measurements) {
      data[key] = {
        measurements,
        stats: this.getStats(key),
      };
    }
    return data;
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements.clear();
    this.activeTimers.clear();
  }
}

/**
 * Simple benchmark function
 */
export async function benchmark<T>(
  fn: () => Promise<T> | T,
  options: {
    name?: string;
    iterations?: number;
    warmup?: number;
    log?: boolean;
  } = {}
): Promise<BenchmarkResult> {
  const name = options.name || 'Anonymous';
  const iterations = options.iterations || 1;
  const warmup = options.warmup || 0;
  const log = options.log !== false;

  // Warmup runs (not counted)
  if (warmup > 0) {
    for (let i = 0; i < warmup; i++) {
      await fn();
    }
  }

  // Memory before
  const memoryBefore = process.memoryUsage().heapUsed;

  // Benchmark runs
  const durations: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    durations.push(end - start);
  }

  // Memory after
  const memoryAfter = process.memoryUsage().heapUsed;

  // Calculate statistics
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);

  // Standard deviation
  const squaredDiffs = durations.map((d) => Math.pow(d - avg, 2));
  const avgSquaredDiff =
    squaredDiffs.reduce((a, b) => a + b, 0) / durations.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  const result: BenchmarkResult = {
    name,
    duration: sum,
    iterations,
    average: avg,
    min,
    max,
    stdDev,
    memoryUsage: {
      before: memoryBefore,
      after: memoryAfter,
      delta: memoryAfter - memoryBefore,
    },
    timestamp: new Date(),
  };

  if (log) {
    console.log(formatBenchmark(result));
  }

  return result;
}

/**
 * Format benchmark result for console
 */
export function formatBenchmark(result: BenchmarkResult): string {
  const lines: string[] = [];
  lines.push(`⚡ Benchmark: ${result.name}`);
  lines.push(`   Iterations: ${result.iterations}`);
  lines.push(`   Total: ${result.duration.toFixed(2)}ms`);
  lines.push(`   Average: ${result.average.toFixed(2)}ms`);
  lines.push(`   Min: ${result.min.toFixed(2)}ms`);
  lines.push(`   Max: ${result.max.toFixed(2)}ms`);
  lines.push(`   Std Dev: ${result.stdDev.toFixed(2)}ms`);
  if (result.memoryUsage) {
    lines.push(
      `   Memory: ${(result.memoryUsage.delta / 1024 / 1024).toFixed(2)}MB`
    );
  }
  return lines.join('\n');
}

/**
 * Compare two benchmark results
 */
export function compareBenchmarks(
  a: BenchmarkResult,
  b: BenchmarkResult
): string {
  const faster = a.average < b.average ? a : b;
  const slower = a.average < b.average ? b : a;
  const percentFaster =
    ((slower.average - faster.average) / slower.average) * 100;

  return [
    `📈 Performance Comparison`,
    ``,
    `  ${a.name}:`,
    `    Average: ${a.average.toFixed(2)}ms`,
    ``,
    `  ${b.name}:`,
    `    Average: ${b.average.toFixed(2)}ms`,
    ``,
    `  🏆 ${faster.name} is ${percentFaster.toFixed(1)}% faster`,
  ].join('\n');
}

/**
 * Create a simple timer
 */
export function createTimer(): {
  start: () => void;
  stop: () => number;
  reset: () => void;
} {
  let startTime = 0;

  return {
    start() {
      startTime = performance.now();
    },
    stop() {
      return performance.now() - startTime;
    },
    reset() {
      startTime = 0;
    },
  };
}

/**
 * Throttle function execution for performance testing
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Debounce function execution for performance testing
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export default benchmark;
